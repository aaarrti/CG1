// custom imports
import { CanvasWidget } from "./canvasWidget";
import * as helper from "./helper";
import { Application, createWindow } from "./lib/window";
import {
    Camera,
    Color, Matrix4,
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
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import RenderWidget from "./lib/rendererWidget";
import type { KeyValuePair } from "./lib/utils";
import type { Intersection } from "three/src/core/Raycaster";


let canvasWidget: CanvasWidget;
let settings: helper.Settings;
let camera: PerspectiveCamera;
let scene: Scene;
let renderer: WebGLRenderer;


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
        case 'alllights':
            console.log(`All light sources ${changed.value ? "enabled" : "disabled"}`);
            break;

    }
}


function raycast() {
    console.log("Started raycasting");
    for (var x = 0; x <= settings.width; x++) {
        for (var y = 0; y <= settings.height; y++) {
            const ndc_x = (2. * x / settings.width) - 1.;
            const ndc_y = -(2 * (y / settings.width) - 1);
            const target = new Vector2(ndc_x, ndc_y);
            const raycaster = new Raycaster();
            // Expects coordinates in [-1, 1]
            raycaster.setFromCamera(target, camera);
            const intersections = listIntersections(raycaster);
            if (intersections.length === 0) {
                continue;
            }
            if (!settings.phong) {
                const color = ((intersections[0].object as Mesh).material as MeshPhongMaterial).color;
                // Expects coordinates in [0, 256]
                canvasWidget.setPixel(x, y, color);
            }
            if (settings.phong && !settings.alllights) {
                setPhongColorSingleSource(x, y, intersections[0]);
            }
            if (settings.phong && settings.alllights) {
                setPhongAllSources(x, y, intersections[0]);
            }
        }
    }
    console.log("Finished raycasting");

}

function setPhongColorSingleSource(x: number, y: number, intersection: Intersection) {
    const light = scene.getObjectByName("main_light");
    if (light === undefined) {
        // never happens, nut TS complains about it
        return;
    }
    const color = getPhongColorForLightSource(x, y, intersection, light as PointLight);
    canvasWidget.setPixel(x, y, color);
}

function setPhongAllSources(x: number, y: number, intersection: Intersection) {
    const lights: Array<PointLight> = [];
    scene.traverse(obj => {
        if (obj instanceof PointLight) {
            lights.push(obj);
        }
    });
    const colors_arr = lights.map(l => getPhongColorForLightSource(x, y, intersection, l));
    const color = colors_arr[0].add(colors_arr[1]).add(colors_arr[2]).multiplyScalar(1/3.);
    canvasWidget.setPixel(x, y, color);
}


function getPhongColorForLightSource(x: number, y: number, intersection: Intersection, light: PointLight) {
    let normal = new Vector3();
    // Use correct normals
    if ((intersection.object as Mesh).geometry instanceof SphereGeometry) {
        // For the spheres normalized vector between origin and intersection point
        normal.copy(
            new Vector3().copy(intersection.point).sub(intersection.object.position)
        );
    } else {
        // For all others Intersection.face.normal
        if (intersection.face) {
            normal.copy(
                new Vector3().copy(intersection.face.normal)
                    .applyMatrix4(
                        new Matrix4().copy(intersection.object.matrixWorld).invert().transpose()
                    )
            );

        } else {
            console.warn("intersection.face undefined");
        }
    }
    let lightVector = new Vector3().copy(light.position).sub(intersection.point);
    const light_intensity = new Color().copy((light as PointLight).color).multiplyScalar(4)
        .multiplyScalar((light as PointLight).intensity)
        .multiplyScalar(1. / (lightVector.length() ** 2));
    const diffuse_reflectance = ((intersection.object as Mesh).material as MeshPhongMaterial).color;
    let cos_theta = new Vector3()
        .copy(lightVector).dot(normal) / (lightVector.length() * normal.length());
    cos_theta = (cos_theta <= 0) ? 0 : cos_theta;
    const diffuse_component = new Color(
        light_intensity.r * diffuse_reflectance.r,
        light_intensity.g * diffuse_reflectance.g,
        light_intensity.b * diffuse_reflectance.b
    )
    .multiplyScalar(cos_theta)

    const viewDirection = new Vector3().copy(camera.position).sub(intersection.object.position)
    const bisector = new Vector3().copy(viewDirection).add(lightVector)
        .multiplyScalar(1/(new Vector3().copy(viewDirection).add(lightVector).length()));
    let cos_gamma = bisector.dot(normal);
    const shininess = ((intersection.object as Mesh).material as MeshPhongMaterial).shininess
    cos_gamma = (cos_gamma <= 0)? 0: cos_gamma**shininess
    const specular_component = new Color(
        light_intensity.r * diffuse_reflectance.r,
        light_intensity.g * diffuse_reflectance.g,
        light_intensity.b * diffuse_reflectance.b
    ).multiplyScalar(cos_gamma)

    return diffuse_component
        .add(specular_component)
}

function listIntersections(raycaster: Raycaster) {
    if (!settings.correctSpheres) {
        return raycaster.intersectObject(scene, true);
    }
    var intersections: Array<Intersection> = [];
    scene.traverse(obj => {
        var intr = intersectObject(obj, raycaster);
        if (intr.length > 0) {
            intersections = intersections.concat(intr);
        }
    });
    intersections = intersections.sort((a, b) => (a.distance - b.distance));
    return intersections;
}

function intersectObject(object: Object3D, raycaster: Raycaster): Array<Intersection> {
    var mesh = object as Mesh;
    var geometry = mesh.geometry;
    if (!(geometry instanceof SphereGeometry)) {
        return raycaster.intersectObject(object, false);
    }
    // https://www.scratchapixel.com/lessons/3d-basic-rendering/minimal-ray-tracer-rendering-simple-shapes/ray-sphere-intersection
    var R = geometry.parameters["radius"];
    var C = new Vector3().copy(mesh.position);
    var D = new Vector3().copy(raycaster.ray.direction);
    var O = new Vector3().copy(raycaster.ray.origin);
    var a = new Vector3().copy(D).dot(D);
    var b = 2 * new Vector3().copy(D).dot(new Vector3().copy(O).sub(C));
    var c = (new Vector3().copy(O).sub(C).dot(new Vector3().copy(O).sub(C))) - (R ** 2);
    var delta = (b ** 2) - (4 * a * c);
    if (delta == 0) {
        // 1 intersection
        const x = -b / 2 * a;
        const point = new Vector3().copy(O).add(new Vector3().copy(D).multiplyScalar(x));
        const dist = new Vector3().copy(O).sub(point).length();
        return [{ distance: dist, point: point, object: object }];
    }
    if (delta > 0) {
        const x1 = (-b + delta ** 0.5) / 2 * a;
        const x2 = (-b - delta ** 0.5) / 2 * a;
        const point1 = new Vector3().copy(O).add(new Vector3().copy(D).multiplyScalar(x1));
        const dist1 = new Vector3().copy(O).sub(point1).length();
        const point2 = new Vector3().copy(O).add(new Vector3().copy(D).multiplyScalar(x2));
        const dist2 = new Vector3().copy(O).sub(point2).length();
        return [
            { distance: dist1, point: point1, object: object },
            { distance: dist2, point: point1, object: object }
        ];
    }
    return [];
}

function main() {

    let root = Application("Raytracing");
    root.setLayout([["canvas", "renderer"]]);
    root.setLayoutColumns(["50%", "50%"]);
    root.setLayoutRows(["100%"]);


    let canvasDiv = createWindow("canvas");
    root.appendChild(canvasDiv);
    canvasWidget = new CanvasWidget(canvasDiv, 256, 256);


    settings = new helper.Settings();
    let gui = helper.createGUI(settings);
    settings.addCallback(callback);
    settings.saveImg = () => canvasWidget.savePNG();
    settings.render = () => {
        var startTime = performance.now();
        raycast();
        var endTime = performance.now();
        console.log(`Call to raycast() took ${endTime - startTime} miliseconds`);
    };

    let rendererDiv = createWindow("renderer");
    root.appendChild(rendererDiv);
    renderer = new WebGLRenderer({
        antialias: true  // to enable anti-alias and get smoother output
    });
    scene = new Scene();
    scene = helper.setupGeometry(scene);
    let lights = helper.setupLight(scene);
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
