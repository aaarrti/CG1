/**
 * This is a minimal boilerplate example for the CG1 course.
 * Later skeletons will provide no code in main.ts so use this for reference.
 *
 * written by Ugo Finnendahl
 **/

// external dependencies
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import * as dat from 'dat.gui';

// local from us provided global utilities
import * as utils from './lib/utils';
import RenderWidget from './lib/rendererWidget';
import {Application, createWindow} from './lib/window';

// helper lib, provides exercise dependent prewritten Code
import * as helper from './helper';
import {Vector3} from "three";
import {RADIUS, ROTATION_ANGLE_RAD, SIDE_LEN} from "./constants";


/*******************************************************************************
 * Defines Settings and GUI
 ******************************************************************************/

// enum(s)
enum Models {
    quad = "Quad",
    box = "Box",
    sphere = "Sphere",
    torus = "Torus"
}

// (default) Settings.
class Settings extends utils.Callbackable {
    // different setting types are possible (e.g. string, enum, number, boolean, function)
    name: string = "main.tsx";
    model: Models = Models.box;
    scale: number = 1;
    truth: boolean = false;
    fun: () => void = function () {
        alert("You clicked me!")
    }
}

// create GUI given a Settings object
function createGUI(settings: Settings): dat.GUI {
    // we are using dat.GUI (https://github.com/dataarts/dat.gui)
    var gui: dat.GUI = new dat.GUI();

    // build GUI
    // the five types have different appearances
    gui.add(settings, 'name').name('App name');
    gui.add(settings, 'model', utils.enumOptions(Models)).name('3D Model');
    gui.add(settings, 'scale', 0, 10, 1).name('size');
    gui.add(settings, 'truth').name("2B or !2B?");
    gui.add(settings, 'fun').name("Click Me");

    return gui;
}


/*******************************************************************************
 * The main application. Your logic should later be separated into a different file.
 * A custom class(es) should be used later as well, since a global namespace is "ugly"
 ******************************************************************************/

var mesh: THREE.Mesh;
// defines callback that should get called
// whenever the settings get changed (eg. via GUI).
function callback(changed: utils.KeyValuePair<Settings>) {
    // only model change works for now:
    if (changed.key == "model") {
        switch (changed.value) {
            case Models.box:
                mesh.geometry = new THREE.BoxGeometry(SIDE_LEN, SIDE_LEN, SIDE_LEN);
                break;
            case Models.sphere:
                mesh.geometry = new THREE.SphereGeometry(RADIUS, 30, 30);
                break;
            case Models.torus:
                mesh.geometry = new THREE.TorusGeometry(RADIUS, 0.2, 8, 10);
                break;
            case Models.quad:
                mesh.geometry = new THREE.PlaneBufferGeometry(1, 1);
                break;
        }
    }
    if (changed.key == "truth"){
        if (changed.value) {
            mesh.material = new THREE.MeshPhongMaterial({color: "red"})
        }else {
            mesh.material = new THREE.MeshPhongMaterial({color: "blue"})
        }
    }
    if (changed.key == "scale"){
        switch (mesh.geometry.type) {
            case "BoxGeometry":
                mesh.geometry = new THREE.BoxGeometry(changed.value * SIDE_LEN, changed.value * SIDE_LEN, changed.value * SIDE_LEN)
                break;
            case "SphereGeometry":
                mesh.geometry = new THREE.SphereGeometry(changed.value * RADIUS, 30, 30)
                break;
            case "TorusGeometry":
                mesh.geometry = new THREE.TorusGeometry(changed.value * RADIUS, 0.2, 8, 10)
                break;
            case "PlaneBufferGeometry":
                mesh.geometry = new THREE.PlaneBufferGeometry(changed.value * SIDE_LEN, changed.value * SIDE_LEN)
                break;
        }
    }
}


/*******************************************************************************
 * Main entrypoint. Previouly declared functions get managed/called here.
 * Start here with programming.
 ******************************************************************************/
function main() {
    // setup/layout root Application.
    // Its the body HTMLElement with some additional functions.
    var root = Application("CG1 WS 20/21 - Exercise 0: Set up");
    // define the (complex) layout, that will be filled later:
    root.setLayout([
        ["renderer", "."],
        [".", "."]
    ]);
    // 1fr means 1 fraction, so 2fr 1fr means
    // the first column has 2/3 width and the second 1/3 width of the application
    root.setLayoutColumns(["100%", "100%"]);
    // you can use percentages as well, but (100/3)% is difficult to realize without fr.
    root.setLayoutRows(["100%", "100%"]);

    // ---------------------------------------------------------------------------
    // create Settings
    var settings = new Settings();
    // create GUI using settings
    var gui = createGUI(settings);
    gui.open();
    // adds the callback that gets called on settings change
    settings.addCallback(callback);

    // ---------------------------------------------------------------------------
    // create window with given id
    // the root layout will ensure that the window is placed right
    const rendererDiv = createWindow("renderer");
    // add it to the root application
    root.appendChild(rendererDiv);

    // create renderer
    const renderer = new THREE.WebGLRenderer({
        antialias: true,  // to enable anti-alias and get smoother output
    });

    // create scene
    const scene = new THREE.Scene();
    // user ./helper.ts for building the scene
    mesh = helper.setupGeometry(scene);
    helper.setupLight(scene);

    // create camera
    let camera = new THREE.PerspectiveCamera();
    // user ./helper.ts for setting up the camera
    helper.setupCamera(camera, scene);

    // create controls
    const controls = new OrbitControls(camera, rendererDiv);
    // user ./helper.ts for setting up the controls
    helper.setupControls(controls);

    // fill the Window (renderDiv). In RenderWidget happens all the magic.
    // It handles resizes, adds the fps widget and most important defines the main animate loop.
    // You dont need to touch this, but if feel free to overwrite RenderWidget.animate
    const wid = new RenderWidget(rendererDiv, renderer, camera, scene, controls);
    // start the draw loop (this call is async)
    wid.animate();

    document.addEventListener('keydown', event => {
        switch (event.key) {
            case "ArrowDown":
                scene.rotateOnWorldAxis(new Vector3(1, 0, 0), ROTATION_ANGLE_RAD)
                break
            case "ArrowUp":
                scene.rotateOnWorldAxis(new Vector3(-1, 0, 0), ROTATION_ANGLE_RAD)
                break
            case "ArrowLeft":
                scene.rotateOnWorldAxis(new Vector3(0, -1, 0), ROTATION_ANGLE_RAD)
                break
            case "ArrowRight":
                scene.rotateOnWorldAxis(new Vector3(0, 1, 0), ROTATION_ANGLE_RAD)
                break
            default:
                return
        }
    });
}

// call main entrypoint
main();
