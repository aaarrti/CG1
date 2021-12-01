import * as THREE from "three";
import type { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import * as dat from "dat.gui";

// local from us provided utilities
import * as utils from "./lib/utils";

// load shader
import basicVertexShader from "./shader/basic.v.glsl";
import basicFragmentShader from "./shader/basic.f.glsl";
import type { Scene } from "three";
import { Matrix3, Mesh, RawShaderMaterial } from "three";

/*******************************************************************************
 * Defines Settings and GUI will later be seperated into settings.ts
 ******************************************************************************/

// enum(s)
export enum Shaders {
    basic = "Basic",
    ambient = "Ambient",
    normal = "Normal",
    toon = "Toon",
    lambert = "Lambert",
    gouraud_phong = "Gouraud",
    phong_phong = "Phong",
    phong_blinnPhong = "Blinn-Phong",
}

function enumToInt(s: Shaders) {
    switch (s) {
        case "Basic":
            return 0;
        case "Ambient":
            return 1;
        case "Normal":
            return 2;
        case "Toon":
            return 3;
        case "Lambert":
            return 4;
        case "Gouraud":
            return 5;
        case "Phong":
            return 6;
        case "Blinn-Phong":
            return 7;
    }
}

// (default) Settings.
export class Settings extends utils.Callbackable {
    // different setting types are possible (e.g. string, enum, number, boolean)
    shader: Shaders = Shaders.basic;
    ambient_reflectance: number = 0.5;
    ambient_color: [number, number, number] = [104, 13, 13];
    diffuse_reflectance: number = 1;
    diffuse_color: [number, number, number] = [204, 25, 25];
    specular_reflectance: number = 1;
    specular_color: [number, number, number] = [255, 255, 255];
    magnitude: number = 128;
    lightX: number = 2;
    lightY: number = 2;
    lightZ: number = 2;
}

export const params = new Settings();
params.addCallback(callback);

// create GUI given a Settings object
export function createGUI(): dat.GUI {
    // we are using dat.GUI (https://github.com/dataarts/dat.gui)
    var gui: dat.GUI = new dat.GUI();

    // build GUI
    gui.add(params, "shader", utils.enumOptions(Shaders)).name("Shader");

    gui.add(params, "ambient_reflectance", 0, 1, 0.01).name("Ambient reflec...");
    gui.addColor(params, "ambient_color").name("Ambient color");

    gui.add(params, "diffuse_reflectance", 0, 1, 0.01).name("Diffuse reflect...");
    gui.addColor(params, "diffuse_color").name("Diffuse color");

    gui.add(params, "specular_reflectance", 0, 1, 0.01).name("Specular reflec...");
    gui.addColor(params, "specular_color").name("Specular color");

    gui.add(params, "magnitude", 0, 128, 1).name("Magnitude");

    var lightFolder = gui.addFolder("Light");
    lightFolder.add(params, "lightX", -10, 10, 0.5).name("X");
    lightFolder.add(params, "lightY", -10, 10, 0.5).name("Y");
    lightFolder.add(params, "lightZ", -10, 10, 0.5).name("Z");
    lightFolder.open();

    return gui;
}


var default_uniforms: { [uniform: string]: THREE.IUniform };
default_uniforms = {
    magnitude: { value: 2 },
    w_coord: { value: 1. },
    ambient_color: { value: [104., 13., 13.] },
    ambient_reflectance: { value: 0.5 },
    shader_type: { value: 0 },
    matrixWorldTransposeInverse: {value: new Matrix3().identity()}
};


/*******************************************************************************
 * helper functions to build scene (geometry, light), camera and controls.
 ******************************************************************************/

export function setupGeometry(scene: THREE.Scene) {
    // https://threejs.org/docs/#api/en/geometries/BoxGeometry
    var torusKnotGeo = new THREE.TorusKnotGeometry(1, 0.3, 100, 32);
    var sphereGeo1 = new THREE.SphereGeometry(1.4, 20, 20);
    var boxGeo = new THREE.BoxGeometry(2, 2, 2);
    var sphereGeo2 = new THREE.SphereGeometry(1.4, 20, 20);
    var material = new THREE.RawShaderMaterial({
        uniforms: default_uniforms,
        vertexShader: basicVertexShader,
        fragmentShader: basicFragmentShader,
    });

    var model0 = new THREE.Mesh(torusKnotGeo, material);
    scene.add(model0);
    sphereGeo1.scale(1, 0.5, 1);
    var model1 = new THREE.Mesh(sphereGeo1, material);
    model1.rotateX(3.141592 / 2);
    model1.translateX(-4);
    model1.translateZ(-1.5);
    scene.add(model1);

    var model2 = new THREE.Mesh(sphereGeo2, material);
    model2.scale.set(1, 0.5, 1);
    model2.rotateX(3.141592 / 2);
    model2.translateX(-4);
    model2.translateZ(1.5);
    scene.add(model2);

    var model3 = new THREE.Mesh(boxGeo, material);
    model3.translateX(4);
    scene.add(model3);
    scene.traverse(obj => {
        if (obj instanceof Mesh){
            (obj.material as RawShaderMaterial).uniforms['matrixWorldTransposeInverse'] = {
                value: new Matrix3().setFromMatrix4(obj.matrixWorld.transpose().invert())
            }
        }
    })
    return { material, model0, model1, model2, model3 };
}

// define camera that looks into scene
export function setupCamera(camera: THREE.PerspectiveCamera, scene: THREE.Scene) {
    // https://threejs.org/docs/#api/cameras/PerspectiveCamera
    camera.near = 0.01;
    camera.far = 20;
    camera.fov = 70;
    camera.position.z = 6;
    camera.lookAt(scene.position);
    camera.updateProjectionMatrix();
    return camera;
}

// define controls (mouse interaction with the renderer)
export function setupControls(controls: OrbitControls) {
    controls.rotateSpeed = 1.0;
    controls.zoomSpeed = 1.2;
    controls.enableZoom = true;
    controls.keys = { LEFT: "KeyA", UP: "KeyW", RIGHT: "KeyD", BOTTOM: "KeyS" };
    controls.listenToKeyEvents(document.body);
    controls.minDistance = 0.1;
    controls.maxDistance = 9;
    return controls;
};


// defines callback that should get called whenever the
// params of the settings get changed (eg. via GUI)

function callback(changed: utils.KeyValuePair<Settings>) {
    switch (changed.key) {
        case "ambient_color":
            default_uniforms["ambient_color"] = { value: changed.value };
            break;
        case "ambient_reflectance":
            default_uniforms["ambient_reflectance"] = { value: changed.value };
            break;
        case "shader":
            const type = enumToInt(changed.value);
            default_uniforms["shader_type"] = { value: type };
            break;
        case 'lightX':



    }
}
