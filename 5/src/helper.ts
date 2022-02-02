import * as THREE from "three";
import type { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import * as utils from "./lib/utils";
import * as dat from "dat.gui";
import { Color } from "three";

/*******************************************************************************
 * Helps to build gui, scene, camera and controls
 ******************************************************************************/

export class Settings extends utils.Callbackable {
  maxDepth: number = 5;
  subsamples: number = 3;
  width: number = 512;
  height: number = 512;
  correctSpheres: boolean = true;
  phong: boolean = true;
  alllights: boolean = true;
  shadows: boolean = true;
  mirrors: boolean = true;
  render: () => void = function() {
  };
  saveImg: () => void = function() {
  };
}

export function createGUI(params: Settings): dat.GUI {
  var gui: dat.GUI = new dat.GUI();

  gui.add(params, "width").name("Width");
  gui.add(params, "height").name("Height");
  gui.add(params, "correctSpheres").name("Correct Spheres");
  gui.add(params, "phong").name("Phong");
  gui.add(params, "alllights").name("All Lights");
  gui.add(params, "shadows").name("Shadows");
  gui.add(params, "mirrors").name("Mirrors");
  gui.add(params, "maxDepth", 0, 10, 1).name("Max Recursions");
  gui.add(params, "subsamples", 1, 4, 1).name("Subsamples");
  gui.add(params, "render").name("Render");
  gui.add(params, "saveImg").name("Save");
  return gui;
}


export function setupGeometry(scene: THREE.Scene) {

  var phongMaterialRed = new THREE.MeshPhongMaterial({
    color: 0xff0000,
    specular: 0xaaaaaa,
    shininess: 150,
    reflectivity: 0
  }) as THREE.MeshPhongMaterial & { mirror: boolean };
  phongMaterialRed.mirror = false;

  var phongMaterialGreen = new THREE.MeshPhongMaterial({
    color: 0x00ff00,
    specular: 0xaaaaaa,
    shininess: 150,
    reflectivity: 0
  }) as THREE.MeshPhongMaterial & { mirror: boolean };
  phongMaterialGreen.mirror = false;

  var phongMaterialBlue = new THREE.MeshPhongMaterial({
    color: 0x0000ff,
    specular: 0xaaaaaa,
    shininess: 150,
    reflectivity: 0
  }) as THREE.MeshPhongMaterial & { mirror: boolean };
  phongMaterialBlue.mirror = false;

  var phongMaterialTop = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    specular: 0x111111,
    shininess: 100,
    reflectivity: 0
  }) as THREE.MeshPhongMaterial & { mirror: boolean };
  phongMaterialTop.mirror = false;

  var phongMaterialGround = new THREE.MeshPhongMaterial({
    color: 0x666666,
    specular: 0x111111,
    shininess: 100,
    reflectivity: 0
  }) as THREE.MeshPhongMaterial & { mirror: boolean };
  phongMaterialGround.mirror = false;

    var mirrorMaterial = new THREE.MeshPhongMaterial({
        color: 0xffaa00,
        specular: 0xffffff,
        shininess: 10000,
        reflectivity: 0.8
    }) as THREE.MeshPhongMaterial & { mirror: boolean };
    mirrorMaterial.mirror = true;

  var mirrorMaterialRed = new THREE.MeshPhongMaterial({
      color: 0xff0000,
      specular: 0xaaaaaa,
      shininess: 150,
    reflectivity: 0.8
  }) as THREE.MeshPhongMaterial & { mirror: boolean };
  mirrorMaterialRed.mirror = true;

    var mirrorMaterialBlue = new THREE.MeshPhongMaterial({
        color: 0x0000ff,
        specular: 0xaaaaaa,
        shininess: 150,
        reflectivity: 0.8
    }) as THREE.MeshPhongMaterial & { mirror: boolean };
    mirrorMaterialBlue.mirror = true;

  var sphereGeometry = new THREE.SphereGeometry(50 / 300, 8, 4);
  var planeGeometry = new THREE.PlaneGeometry(602 / 300, 602 / 300);
  var boxGeometry = new THREE.BoxGeometry(100 / 300, 100 / 300, 100 / 300);
  var sphere = new THREE.Mesh(sphereGeometry, phongMaterialRed);
  sphere.position.set(-50 / 300, -250 / 300 + 5 / 300, -50 / 300);
  scene.add(sphere);
  var sphere2 = new THREE.Mesh(sphereGeometry, phongMaterialGreen);
  sphere2.position.set(-175 / 300, -150 / 300, -150 / 300);
  scene.add(sphere2);

  var boxBlue = new THREE.Mesh(boxGeometry, mirrorMaterialBlue);
  boxBlue.position.set(75 / 300, -250 / 300 + 5 / 300, -75 / 300);
  boxBlue.rotation.y = -0.5;
  scene.add(boxBlue);

  var box = new THREE.Mesh(boxGeometry, mirrorMaterialRed);
  box.position.set(-175 / 300, -250 / 300 + 2.5 / 300, -150 / 300);
  box.rotation.y = 0.25;
  scene.add(box);

  // bottom
  var planebottom = new THREE.Mesh(planeGeometry, phongMaterialGround);
  planebottom.position.set(0, -300 / 300, -150 / 300);
  planebottom.rotation.x = -1.57;
  planebottom.scale.setY(0.6);
  scene.add(planebottom);

  // top
  var planetop = new THREE.Mesh(planeGeometry, phongMaterialTop);
  planetop.position.set(0, 300 / 300, -150 / 300);
  planetop.rotation.x = 1.57;
  planetop.scale.setY(0.6);
  scene.add(planetop);

  // back
  var planeback = new THREE.Mesh(planeGeometry, mirrorMaterial);
  planeback.position.set(0, 0, -300 / 300);
  scene.add(planeback);

  // left
  var planeleft = new THREE.Mesh(planeGeometry, phongMaterialRed);
  planeleft.rotation.z = 1.57;
  planeleft.rotation.y = 1.57;
  planeleft.position.set(-300 / 300, 0, -150 / 300);
  planeleft.scale.setY(0.6);
  scene.add(planeleft);

  // right
  var planeright = new THREE.Mesh(planeGeometry, phongMaterialBlue);
  planeright.rotation.z = 1.57;
  planeright.rotation.y = -1.57;
  planeright.position.set(300 / 300, 0, -150 / 300);
  planeright.scale.setY(0.6);
  scene.add(planeright);

  scene.updateMatrixWorld();
  return planeback;
};

export function setupLight(scene: THREE.Scene) {
  var intensity = 0.2;
  var lights = [];
  var light1 = new THREE.PointLight(new Color('magenta'), intensity * 2);
  light1.position.set(1, 0.8, 0.5);
  scene.add(light1);
  lights.push(light1);
  light1.updateMatrixWorld();

  var light2 = new THREE.PointLight(new Color('cyan'), intensity * 2.5);
  light2.position.set(-200 / 300, 100 / 300, 100 / 300);
  scene.add(light2);
  lights.push(light2);
  light2.updateMatrixWorld();

  var light3 = new THREE.PointLight(new Color('red'), intensity);
  light3.position.set(200 / 300, -150 / 300, 100 / 300);
  scene.add(light3);
  lights.push(light3);
  light3.updateMatrixWorld();
  light3.name = 'main_light';
  return lights;
};


export function setupCamera(camera: THREE.PerspectiveCamera) {
  camera.fov = 60;
  camera.far = 1000;
  camera.near = 0.001;
  camera.position.z = 540 / 300;
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
  return camera;
}

export function setupControls(controls: OrbitControls) {
  controls.rotateSpeed = 1.0;
  controls.zoomSpeed = 1.2;
  controls.enableZoom = true;
  controls.keys = { LEFT: "KeyA", UP: "KeyW", RIGHT: "KeyD", BOTTOM: "KeyS" };
  controls.listenToKeyEvents(document.body);
  controls.minDistance = 0.00001;
  controls.maxDistance = 9;
  controls.minZoom = 0;
  return controls;
};
