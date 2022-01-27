// custom imports
import { CanvasWidget } from "./canvasWidget";
import * as helper from "./helper";
import { Application, createWindow } from "./lib/window";
import { Mesh, MeshPhongMaterial, PerspectiveCamera, Raycaster, Scene, Vector2, WebGLRenderer } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import RenderWidget from "./lib/rendererWidget";
import type { KeyValuePair } from "./lib/utils";


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

  }

}


function raycast() {
  console.log("Started raycasting");
  for (var x = 0; x <= settings.width; x += 1) {
    for (var y = 0; y <= settings.height; y += 1) {
      const target = new Vector2((2. * x / settings.width) - 1., (2. * y / settings.height) - 1.);
      const raycaster = new Raycaster();
      raycaster.setFromCamera(target, camera);
      let intersections = raycaster.intersectObjects(scene.children, true);
      if (intersections.length > 0) {
        canvasWidget.setPixel(x, settings.height - y,
          ((intersections[0].object as Mesh).material as MeshPhongMaterial).color);
      }
    }
  }
  console.log("Finished raycasting");
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
