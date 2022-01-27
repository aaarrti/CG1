// custom imports
import { CanvasWidget } from "./canvasWidget";
import * as helper from "./helper";
import { Application, createWindow } from "./lib/window";
import { PerspectiveCamera, Scene, WebGLRenderer } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import RenderWidget from "./lib/rendererWidget";
import type { KeyValuePair } from "./lib/utils";


let canvasWidget: CanvasWidget;
let settings: helper.Settings;


function callback(changed: KeyValuePair<helper.Settings>) {
  switch (changed.key) {
    case "width":
      canvasWidget.changeDimensions(changed.value, settings.height);
      break;
    case 'height':
      canvasWidget.changeDimensions(settings.width, changed.value);
      break;

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
  settings.saveImg = () => {
    canvasWidget.savePNG();
  };
  let rendererDiv = createWindow("renderer");
  root.appendChild(rendererDiv);
  let renderer = new WebGLRenderer({
    antialias: true  // to enable anti-alias and get smoother output
  });
  let scene = new Scene();
  scene = helper.setupGeometry(scene);
  let lights = helper.setupLight(scene);
  let camera = new PerspectiveCamera();
  camera = helper.setupCamera(camera);
  // create controls
  let controls = new OrbitControls(camera, rendererDiv);
  controls = helper.setupControls(controls);
  let wid = new RenderWidget(rendererDiv, renderer, camera, scene, controls);
  wid.animate();

}

// call main entrypoint
main();
