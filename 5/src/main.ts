// custom imports
import { CanvasWidget } from "./canvasWidget";
import * as helper from "./helper";
import { Application, createWindow } from "./lib/window";
import {
    Mesh,
    MeshPhongMaterial,
    Object3D,
    PerspectiveCamera,
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
            if (intersections.length > 0) {
                const intersection_color = ((intersections[0].object as Mesh).material as MeshPhongMaterial).color;
                // Expects coordinates in [0, 256]
                canvasWidget.setPixel(x, y, intersection_color);
            }
        }
    }
    console.log("Finished raycasting");
}

function listIntersections(raycaster: Raycaster) {
    if (!settings.correctSpheres) {
        return raycaster.intersectObject(scene, true);
    }
    var intersections: Array<Intersection> = [];
    scene.traverse(obj => {
        var intr = intersectObject(obj, raycaster);
        if (intr !== undefined && intr.length > 0) {
            intersections = intersections.concat(intr);
        }
    });
    intersections = intersections.sort((a, b) => (a.distance - b.distance));
    return intersections;
}

function intersectObject(object: Object3D, raycaster: Raycaster): Array<Intersection> | undefined {
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
    settings.render = raycast;

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
