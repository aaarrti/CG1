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
      console.log("Correct spheres enabled!");
      break;
  }
}


function raycast() {
  console.log("Started raycasting");
  for (var x = 0; x <= settings.width; x++) {
    for (var y = 0; y <= settings.height; y++) {
      const ndc_x = (2. * x / settings.width) - 1.;
      const ndc_y = (2. * y / settings.height) - 1.
      const target = new Vector2(ndc_x, ndc_y);
      const raycaster = new Raycaster();
      raycaster.setFromCamera(target, camera);
      const intersections = listIntersections(raycaster);
      if (intersections.length > 0) {
        canvasWidget.setPixel(x, settings.height - y, ((intersections[0].object as Mesh).material as MeshPhongMaterial).color);
      }
    }
  }
  console.log("Finished raycasting");
}

function listIntersections(raycaster: Raycaster) {
  if (settings.correctSpheres) {
    let intersections: Array<Intersection> = [];
    scene.traverse(obj => {
      let res = intersectObject(obj, raycaster);
      if (res !== undefined) {
        intersections = intersections.concat(res);
      }
    });
    return intersections;
  }
  return raycaster.intersectObject(scene);
}

function intersectObject(object_to_intersect: Object3D, raycaster: Raycaster): Array<Intersection> | undefined {
  if ((object_to_intersect as Mesh).geometry instanceof SphereGeometry) {
    const R = ((object_to_intersect as Mesh).geometry as SphereGeometry).parameters["radius"];
    const C = (object_to_intersect as Mesh).position;
    const D = raycaster.ray.direction;
    const O = raycaster.ray.origin;
    const a = D.dot(D);
    const b = 2 * D.dot(O.sub(C));
    const c = (O.sub(C).length() ** 2) - R ** 2;
    const delta = (b ** 2) - (4 * a * c);
    if (delta < 0) {
      return undefined;
    }
    if (delta == 0) {
      // 1 intersection
      const x = -b / 2 * a;
      const point = O.add(D.multiplyScalar(x));
      const dist = O.sub(point).length();
      return [{ distance: dist, point: point, object: object_to_intersect }];
    }
    if (delta > 0) {
      const x1 = (-b + delta ** 0.5) / 2 * a;
      const x2 = (-b - delta ** 0.5) / 2 * a;
      const point1 = O.add(D.multiplyScalar(x1));
      const dist1 = O.sub(point1).length();
      const point2 = O.add(D.multiplyScalar(x2));
      const dist2 = O.sub(point2).length();
      return [
        { distance: dist1, point: point1, object: object_to_intersect },
        { distance: dist2, point: point1, object: object_to_intersect }
      ];
    }
  } else {
    return raycaster.intersectObject(object_to_intersect, true);
  }
}

function main() {

  let root = Application("Texturing");
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
