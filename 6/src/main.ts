import * as THREE from "three";
import { CameraHelper } from "three";
import * as dat from "dat.gui";
import * as utils from "./lib/utils";
import RenderWidget from "./lib/rendererWidget";
import { Application, createWindow } from "./lib/window";
import * as helper from "./helper";
import { OwnStereoCamera } from "./lib/ownStereoCamera";
import type { KeyValuePair } from "./lib/utils";


class Settings extends utils.Callbackable {
    eyeWidth: number = 0;
}

function createGUI(settings: Settings): dat.GUI {
    var gui: dat.GUI = new dat.GUI();
    gui.add(settings, "eyeWidth").name("Eye Width");
    return gui;
}


function main() {
    var root = Application("3D");
    root.setLayout([["left", "right"]]);
    root.setLayoutColumns(["50%", "50%"]);
    root.setLayoutRows(["100%"]);


    var settings = new Settings();
    var gui = createGUI(settings);
    gui.open();


    const rightDiv = createWindow("right");
    root.append(rightDiv);
    const rightRenderer = new THREE.WebGLRenderer({
        antialias: true
    });
    const scene = new THREE.Scene();
    let shadow_camera = new OwnStereoCamera();
    shadow_camera.scene = scene;
    helper.setupCamera(shadow_camera, scene);
    helper.setupCamera(shadow_camera.cameraLeft, scene);
    helper.setupCamera(shadow_camera.cameraRight, scene);

    helper.setupGeometry(scene);
    helper.setupLight(scene);
    //let rightCameraHelper = new CameraHelper(shadow_camera.cameraRight);
    //scene.add(rightCameraHelper);

    const rightWid = new RenderWidget(rightDiv, rightRenderer, shadow_camera.cameraRight, scene, undefined);
    rightWid.animate();


    const leftDiv = createWindow("left");
    root.append(leftDiv);
    const leftRenderer = new THREE.WebGLRenderer({
        antialias: true
    });
    const leftWid = new RenderWidget(leftDiv, leftRenderer, shadow_camera.cameraLeft, scene, undefined);
    leftWid.animate();

    //const axesHelper = new THREE.AxesHelper(5);
    //scene.add(axesHelper);

    let clicked = false;
    rightDiv.addEventListener("mousedown", () => {
        clicked = true;
    });
    rightDiv.addEventListener("mouseup", () => {
        clicked = false;
    });
    rightDiv.addEventListener("mousemove", event => {
        if (clicked) {
            scene.rotation.y += event.movementX * 0.005;
            scene.rotation.x += event.movementY * 0.005;

        }
    });
    settings.addCallback((changed: KeyValuePair<Settings>) => {
        switch (changed.key){
            case "eyeWidth":
                shadow_camera.eyeWidth = changed.value
                shadow_camera.updateEyes()
                break
        }
    })

}

// call main entrypoint
main();

