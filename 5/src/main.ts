// custom imports
import { CanvasWidget } from "./canvasWidget";
import * as helper from "./helper";
import { Application, createWindow } from "./lib/window";
import {
    Color,
    Mesh,
    MeshPhongMaterial,
    Object3D,
    PerspectiveCamera,
    PointLight,
    Ray,
    Raycaster,
    Scene,
    SphereGeometry,
    Vector2,
    Vector3,
    WebGLRenderer
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import RenderWidget from "./lib/rendererWidget";
import type { KeyValuePair } from "./lib/utils";
import type { Intersection } from "three/src/core/Raycaster";


let canvasWidget: CanvasWidget;
let settings: helper.Settings;
let camera: PerspectiveCamera;
let scene: Scene;
let lights: Array<PointLight>;

function subVectors(v1: Vector3, v2: Vector3) {
    return new Vector3().subVectors(v1, v2);
}

function addVectors(v1: Vector3, v2: Vector3) {
    return new Vector3().addVectors(v1, v2);
}

function dot(v1: Vector3, v2: Vector3) {
    return new Vector3().copy(v1).dot(v2);
}

function scaleV(k: number, v: Vector3) {
    return new Vector3().copy(v).multiplyScalar(k);
}

function callback(changed: KeyValuePair<helper.Settings>) {
    switch (changed.key) {
        case "width":
            canvasWidget.changeDimensions(changed.value, settings.height);
            break;
        case "height":
            canvasWidget.changeDimensions(settings.width, changed.value);
            break;
        case "correctSpheres":
            console.log(`Correct spheres ${changed.value ? "enabled" : "disabled"}`);
            break;
        case "phong":
            console.log(`Phong with single light source ${changed.value ? "enabled" : "disabled"}`);
            break;
        case "alllights":
            console.log(`All light sources ${changed.value ? "enabled" : "disabled"}`);
            break;
        case "mirrors":
            console.log(`Mirrors ${changed.value ? "enabled" : "disabled"}`);
            break;
        case "maxDepth":
            console.log(`New max recursion depth ${changed.value}`);
            break;
        case "subsamples":
            console.log(`Now sending ${changed.value ** 2} rays per pixel`);
            break;
    }
}

function raycast() {
    console.log("Started raycasting");
    for (let x = 0; x <= settings.width; x++) {
        for (let y = 0; y <= settings.height; y++) {
            const rays = spawnRays(x, y);
            const colors = rays.map(mapRayToColor);
            const colors_sum = colors.reduce((a, b) => a.add(b));
            canvasWidget.setPixel(x, y, colors_sum.multiplyScalar(1. / colors.length));
        }
    }
    console.log("Finished raycasting");
}

function mapRayToColor(raycaster: Raycaster): Color {
    const intersections = listIntersections(raycaster);
    if (intersections.length === 0) {
        return new Color("black");
    }
    if (!settings.phong) {
        return ((intersections[0].object as Mesh).material as MeshPhongMaterial).color;
    }
    if (!settings.alllights) {
        return getPhongColorMirrorAware(intersections[0], lights[1], raycaster.ray);
    }
    const colors_arr = lights.map(l => getPhongColorMirrorAware(intersections[0], l, raycaster.ray));
    return colors_arr[0].add(colors_arr[1]).add(colors_arr[2]);
}

function toNdc(x: number, y: number): Vector2 {
    const ndc_x = (2. * x / settings.width) - 1.;
    const ndc_y = -(2 * (y / settings.width) - 1);
    return new Vector2(ndc_x, ndc_y);
}

function mapTargetToCameraDirectedRaycaster(v: Vector2) {
    const raycaster = new Raycaster();
    // Expects coordinates in [-1, 1]
    raycaster.setFromCamera(v, camera);
    return raycaster;
}

function listRayTargets(x: number, y: number): Array<Vector2> {
    if (settings.subsamples === 1) {
        return [toNdc(x, y)];
    }
    const step = 1. / (settings.subsamples + 1);
    let ndc_coord: Array<Vector2> = [];
    for (let i = 1; i <= settings.subsamples; i++) {
        for (let j = 1; j <= settings.subsamples; j++) {
            const ndc = toNdc(x + (j * step), y + (i * step));
            ndc_coord = ndc_coord.concat(ndc);
        }
    }
    return ndc_coord;
}

function spawnRays(x: number, y: number): Array<Raycaster> {
    const targets = listRayTargets(x, y);
    return targets.map(mapTargetToCameraDirectedRaycaster);
}

function listIntersections(raycaster: Raycaster) {
    if (!settings.correctSpheres) {
        return raycaster.intersectObject(scene, true);
    }
    let intersections: Array<Intersection> = [];
    scene.traverse(obj => {
        const intr = intersectObject(obj, raycaster);
        if (intr.length > 0) {
            intersections = intersections.concat(intr);
        }
    });
    intersections = intersections.sort((a, b) => (a.distance - b.distance));
    return intersections;
}

function solveQuadratic(a: number, b: number, c: number): Array<number> {
    let discr = b * b - 4 * a * c;
    if (discr < 0) {
        return [];
    }
    if (discr == 0) {
        return [-0.5 * b / a];
    }
    let q = (b > 0) ? -0.5 * (b + Math.sqrt(discr)) : -0.5 * (b - Math.sqrt(discr));
    let x0 = q / a;
    let x1 = c / q;
    return x0 > x1 ? [x0, x1] : [x1, x0];
}

function intersectSphere(ray: Ray, object: Mesh): Array<Vector3> {
    // analytic solution
    let L = subVectors(ray.origin, object.position);
    let a = dot(ray.direction, ray.direction);
    let b = 2 * dot(ray.direction, L);
    //@ts-ignore
    let c = dot(L, L) - object.geometry.parameters["radius"] ** 2;
    let solutions = solveQuadratic(a, b, c);
    return solutions.map(i => addVectors(ray.origin, scaleV(i, ray.direction.normalize())));
}

function intersectObject(object: Object3D, raycaster: Raycaster): Array<Intersection> {
    const mesh = object as Mesh;
    const geometry = mesh.geometry;
    if (geometry instanceof SphereGeometry) {
        let sphere_intersections = intersectSphere(raycaster.ray, mesh);
        return sphere_intersections.map(i => mapPointToIntersetion(i, mesh, raycaster.ray.origin));
    }
    return raycaster.intersectObject(object, false);
}

function mapPointToIntersetion(point_int: Vector3, mesh: Mesh, ray_origin: Vector3): Intersection {
    let distance_ = ray_origin.distanceTo(point_int);
    return { distance: distance_, point: point_int, object: mesh };
}

function getNormal(intersection: Intersection) {
    let normal;
    const mesh = intersection.object as Mesh;
    if (mesh.geometry instanceof SphereGeometry && settings.correctSpheres) {
        // For the spheres normalized vector between origin and intersection point
        normal = subVectors(intersection.point, intersection.object.position).normalize();
    } else {
        // @ts-ignore
        normal = intersection.face.normal.clone()
            .applyMatrix4(intersection.object.matrixWorld.clone().transpose().invert())
            .normalize();
    }
    return normal;
}

function getPhongColorMirrorAware(intersection: Intersection, light: PointLight, ray: Ray): Color {
    return settings.mirrors ? getPhongColorRecursively(intersection, light, ray, 1) : getPhongColor(intersection, light);
}

function getPhongColorRecursively(intersection: Intersection, light: PointLight, ray: Ray, depth: number): Color {
    const phongColor = getPhongColor(intersection, light);
    //@ts-ignore
    if (!intersection.object.material.mirror) {
        return phongColor;
    }
    if (depth === settings.maxDepth) {
        // this is a mirror but max depth is reached
        // @ts-ignore
        return phongColor.lerp(new Color("black"), intersection.object.material.reflectivity);
    }
    const normal = getNormal(intersection);
    const reflection_direction = ray.clone().direction.reflect(normal).normalize();
    const reflection_raycaster = new Raycaster(intersection.point, reflection_direction);
    let reflection_intersections = listIntersections(reflection_raycaster);
    reflection_intersections = reflection_intersections.filter(i => i.object !== intersection.object);
    if (reflection_intersections.length === 0) {
        // if nothing reflect
        // @ts-ignore
        return phongColor.lerp(new Color("black"), intersection.object.material.reflectivity);
    }
    depth += 1;
    // @ts-ignore
    return phongColor.lerp(getPhongColorRecursively(reflection_intersections[0], light, reflection_raycaster.ray, depth), intersection.object.material.reflectivity);

}

function getPhongColor(intersection: Intersection, light: PointLight) {
    let normal = getNormal(intersection);
    const mesh = intersection.object as Mesh;
    // Use correct normals
    if (settings.shadows) {
        let shadowRay = new Raycaster(intersection.point, subVectors(light.position, intersection.point).normalize());
        let shadows = listIntersections(shadowRay);
        // spheres would intersect self
        shadows = shadows.filter(i => i.object !== intersection.object);
        if (shadows.length > 0) {
            return new Color("black");
        }
    }
    let lightVector = subVectors(light.position, intersection.point).normalize();
    const reflectance = (mesh.material as MeshPhongMaterial).color;
    const light_intensity = new Color(light.color).multiplyScalar(light.intensity).multiplyScalar(1. / (lightVector.length() ** 2));
    const diffuse_component = getDiffuseComponent(light, intersection, mesh, normal, lightVector, light_intensity, reflectance);
    const specular_component = getSpecularComponent(intersection, mesh, normal, lightVector, light_intensity, reflectance);
    return diffuse_component.add(specular_component);
}


function getDiffuseComponent(light: PointLight, intersection: Intersection, mesh: Mesh, normal: Vector3, lightVector: Vector3, light_intensity: Color, reflectance: Color): Color {
    let cos_theta = dot(lightVector, normal);
    cos_theta = (cos_theta <= 0) ? 0 : cos_theta;
    return new Color(light_intensity.r * reflectance.r, light_intensity.g * reflectance.g, light_intensity.b * reflectance.b).multiplyScalar(cos_theta);
}

function getSpecularComponent(intersection: Intersection, mesh: Mesh, normal: Vector3, lightVector: Vector3, light_intensity: Color, reflectance: Color): Color {
    const viewDirection = subVectors(intersection.point, camera.position).normalize();
    const reflection = lightVector.clone().reflect(normal).normalize();

    let cos_gamma = dot(viewDirection, reflection);
    const shininess = (mesh.material as MeshPhongMaterial).shininess;
    cos_gamma = cos_gamma <= 0 ? 0 : cos_gamma ** shininess;
    return new Color(light_intensity.r * reflectance.r, light_intensity.g * reflectance.g, light_intensity.b * reflectance.b)
        .multiplyScalar(cos_gamma).multiplyScalar(shininess / 50);
}

function main() {

    let root = Application("Raytracing");
    root.setLayout([["canvas", "renderer"]]);
    root.setLayoutColumns(["50%", "50%"]);
    root.setLayoutRows(["100%"]);


    let canvasDiv = createWindow("canvas");
    root.appendChild(canvasDiv);
    settings = new helper.Settings();
    canvasWidget = new CanvasWidget(canvasDiv, settings.width, settings.height);

    helper.createGUI(settings);
    settings.addCallback(callback);
    settings.saveImg = () => canvasWidget.savePNG();
    settings.render = () => {
        const startTime = performance.now();
        raycast();
        const endTime = performance.now();
        console.log(`Call to raycast() took ${endTime - startTime} miliseconds`);
    };

    let rendererDiv = createWindow("renderer");
    root.appendChild(rendererDiv);
    let renderer = new WebGLRenderer({
        antialias: true  // to enable anti-alias and get smoother output
    });
    scene = new Scene();
    helper.setupGeometry(scene);
    lights = helper.setupLight(scene);
    camera = new PerspectiveCamera();
    camera = helper.setupCamera(camera);
    // create controls
    let controls = new OrbitControls(camera, rendererDiv);
    controls = helper.setupControls(controls);
    let wid = new RenderWidget(rendererDiv, renderer, camera, scene, controls);
    wid.animate();
}

// call main entrypoint
main();
