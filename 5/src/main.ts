// custom imports
import { CanvasWidget } from './canvasWidget'
import * as helper from './helper'
import { Application, createWindow } from './lib/window'
import {
    Color,
    Mesh,
    MeshPhongMaterial,
    Object3D,
    PerspectiveCamera,
    PointLight,
    Raycaster,
    Scene,
    SphereGeometry,
    Vector2,
    Vector3,
    WebGLRenderer
} from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import RenderWidget from './lib/rendererWidget'
import type { KeyValuePair } from './lib/utils'
import type { Intersection } from 'three/src/core/Raycaster'


let canvasWidget: CanvasWidget
let settings: helper.Settings
let camera: PerspectiveCamera
let scene: Scene
let renderer: WebGLRenderer
let lights: Array<PointLight>

function subVectors(v1: Vector3, v2: Vector3) {
    return new Vector3().subVectors(v1, v2)
}

function addVectors(v1: Vector3, v2: Vector3) {
    return new Vector3().addVectors(v1, v2)
}

function dot(v1: Vector3, v2: Vector3) {
    return new Vector3().copy(v1).dot(v2)
}

function callback(changed: KeyValuePair<helper.Settings>) {
    switch (changed.key) {
        case 'width':
            canvasWidget.changeDimensions(changed.value, settings.height)
            break
        case 'height':
            canvasWidget.changeDimensions(settings.width, changed.value)
            break
        case 'correctSpheres':
            console.log(`Correct spheres ${changed.value ? 'enabled' : 'disabled'}`)
            break
        case 'phong':
            console.log(`Phong with single light source ${changed.value ? 'enabled' : 'disabled'}`)
            break
        case 'alllights':
            console.log(`All light sources ${changed.value ? 'enabled' : 'disabled'}`)
            break

    }
}


function raycast() {
    console.log('Started raycasting')
    for (let x = 0; x <= settings.width; x++) {
        for (let y = 0; y <= settings.height; y++) {
            const ndc_x = (2. * x / settings.width) - 1.
            const ndc_y = -(2 * (y / settings.width) - 1)
            const target = new Vector2(ndc_x, ndc_y)
            const raycaster = new Raycaster()
            // Expects coordinates in [-1, 1]
            raycaster.setFromCamera(target, camera)
            const intersections = listIntersections(raycaster)
            if (intersections.length === 0) {
                canvasWidget.setPixel(x, y, new Color('black'))
                continue
            }
            if (!settings.phong) {
                const color = ((intersections[0].object as Mesh).material as MeshPhongMaterial).color
                // Expects coordinates in [0, 256]
                canvasWidget.setPixel(x, y, color)
            }
            if (settings.phong && !settings.alllights) {
                setPhongColorSingleSource(x, y, intersections[0])
            }
            if (settings.phong && settings.alllights) {
                setPhongAllSources(x, y, intersections[0])
            }
        }
    }
    console.log('Finished raycasting')

}

function listIntersections(raycaster: Raycaster) {
    if (!settings.correctSpheres) {
        return raycaster.intersectObject(scene, true)
    }
    let intersections: Array<Intersection> = []
    scene.traverse(obj => {
        const intr = intersectObject(obj, raycaster)
        if (intr.length > 0) {
            intersections = intersections.concat(intr)
        }
    })
    intersections = intersections.sort((a, b) => (a.distance - b.distance))
    return intersections
}

function intersectObject(object: Object3D, raycaster: Raycaster): Array<Intersection> {
    const mesh = object as Mesh
    const geometry = mesh.geometry
    if (!(geometry instanceof SphereGeometry)) {
        return raycaster.intersectObject(object, false)
    }
    // https://www.scratchapixel.com/lessons/3d-basic-rendering/minimal-ray-tracer-rendering-simple-shapes/ray-sphere-intersection
    // geometry parameters
    const R = geometry.parameters['radius']
    const C = mesh.position.clone()
    const D = raycaster.ray.direction.clone()
    const O = raycaster.ray.origin.clone()
    // quadratic equation parameters
    const a = dot(D, D)
    const b = 2. * dot(D, subVectors(O, C))
    const c = (subVectors(O, C).length() ** 2) - (R ** 2)
    const delta = (b ** 2) - (4. * a * c)
    if (delta == 0) {
        // 1 intersection
        const x = -b / (2. * a)
        const point = addVectors(O, D.clone().multiplyScalar(x))
        const dist = subVectors(point, O).length()
        return [{ distance: dist, point: point, object: object }]
    }
    if (delta > 0) {
        const x1 = (-b + Math.sqrt(delta)) / (2. * a)
        const x2 = (-b - Math.sqrt(delta)) / (2. * a)
        const point1 = addVectors(O, D.multiplyScalar(x1))
        const dist1 = subVectors(O, point1).length()
        const point2 = addVectors(O, D.multiplyScalar(x2))
        const dist2 = subVectors(O, point2).length()
        return [
            { distance: dist1, point: point1, object: object },
            { distance: dist2, point: point2, object: object }
        ]
    }
    return []
}

function setPhongColorSingleSource(x: number, y: number, intersection: Intersection) {
    const color = getPhongColorForLightSource(x, y, intersection, lights[0])
    canvasWidget.setPixel(x, y, color)
}

function setPhongAllSources(x: number, y: number, intersection: Intersection) {
    const colors_arr = lights.map(l => getPhongColorForLightSource(x, y, intersection, l))
    const color = colors_arr[0].add(colors_arr[1]).add(colors_arr[2])
    canvasWidget.setPixel(x, y, color)
}


function getPhongColorForLightSource(x: number, y: number, intersection: Intersection, light: PointLight) {
    let normal
    const mesh = intersection.object as Mesh
    // Use correct normals
    if (mesh.geometry instanceof SphereGeometry && settings.correctSpheres) {
        // For the spheres normalized vector between origin and intersection point
        normal = subVectors(intersection.object.position, intersection.point).normalize()
    } else {
        // @ts-ignore
        normal = intersection.face.normal.clone()
            .applyMatrix4(
                intersection.object.matrixWorld.clone().transpose().invert()
            )
            .normalize()
    }
    let lightVector = subVectors(light.position, intersection.point).normalize()
    const light_intensity = new Color(light.color)
        .multiplyScalar(light.intensity)
        .multiplyScalar(1. / (lightVector.length() ** 2))
    const diffuse_reflectance = (mesh.material as MeshPhongMaterial).color
    let cos_theta = dot(lightVector, normal)
    cos_theta = (cos_theta <= 0) ? 0 : cos_theta

    const diffuse_component = new Color(
        light_intensity.r * diffuse_reflectance.r,
        light_intensity.g * diffuse_reflectance.g,
        light_intensity.b * diffuse_reflectance.b
    ).multiplyScalar(cos_theta)

    const viewDirection = subVectors(intersection.point, camera.position).normalize()
    const reflection = lightVector.clone().reflect(normal).normalize()

    let cos_gamma = dot(viewDirection, reflection)
    const shininess = (mesh.material as MeshPhongMaterial).shininess
    cos_gamma = cos_gamma <= 0 ? 0 : cos_gamma ** shininess
    const specular_component = new Color(
        light_intensity.r * diffuse_reflectance.r,
        light_intensity.g * diffuse_reflectance.g,
        light_intensity.b * diffuse_reflectance.b
    ).multiplyScalar(cos_gamma).multiplyScalar(shininess / 50.)

    return diffuse_component.add(specular_component)
}

function main() {

    let root = Application('Raytracing')
    root.setLayout([['canvas', 'renderer']])
    root.setLayoutColumns(['50%', '50%'])
    root.setLayoutRows(['100%'])


    let canvasDiv = createWindow('canvas')
    root.appendChild(canvasDiv)
    settings = new helper.Settings()
    canvasWidget = new CanvasWidget(canvasDiv, settings.width, settings.height)

    helper.createGUI(settings)
    settings.addCallback(callback)
    settings.saveImg = () => canvasWidget.savePNG()
    settings.render = () => {
        const startTime = performance.now()
        raycast()
        const endTime = performance.now()
        console.log(`Call to raycast() took ${endTime - startTime} miliseconds`)
    }

    let rendererDiv = createWindow('renderer')
    root.appendChild(rendererDiv)
    renderer = new WebGLRenderer({
        antialias: true  // to enable anti-alias and get smoother output
    })
    scene = new Scene()
    scene = helper.setupGeometry(scene)
    lights = helper.setupLight(scene)
    camera = new PerspectiveCamera()
    camera = helper.setupCamera(camera)
    // create controls
    let controls = new OrbitControls(camera, rendererDiv)
    controls = helper.setupControls(controls)
    let wid = new RenderWidget(rendererDiv, renderer, camera, scene, controls)
    wid.animate()
}

// call main entrypoint
main()
