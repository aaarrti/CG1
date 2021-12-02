// external dependencies
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

// local from us provided utilities
import RenderWidget from "./lib/rendererWidget";
import { Application, createWindow } from "./lib/window";
import type * as utils from "./lib/utils";

// helper lib, provides exercise dependent prewritten Code
import * as helper from "./helper";


// feel free to declar certain variables outside the main function to change them somewhere else
// e.g. settings, light or material
function main() {
    // setup/layout root Application.
    // Its the body HTMLElement with some additional functions.
    // More complex layouts are possible too.
    var root = Application("Shader");
    root.setLayout([["renderer"]]);
    root.setLayoutColumns(["100%"]);
    root.setLayoutRows(["100%"]);

    // ---------------------------------------------------------------------------
    // create Settings and create GUI settings
    helper.createGUI();
    // adds the callback that gets called on params change

    // ---------------------------------------------------------------------------
    // create RenderDiv
    var rendererDiv = createWindow("renderer");
    root.appendChild(rendererDiv);

    // create renderer
    var renderer = new THREE.WebGLRenderer({
        antialias: true  // to enable anti-alias and get smoother output
    });

    // create scene
    var scene = new THREE.Scene();
    var { material } = helper.setupGeometry(scene);

    // add light proxy
    var lightgeo = new THREE.SphereGeometry(0.1, 32, 32);
    var lightMaterial = new THREE.MeshBasicMaterial({ color: 0xff8010 });
    var light = new THREE.Mesh(lightgeo, lightMaterial);
    light.name = 'light';
    scene.add(light);

    // create camera
    var camera = new THREE.PerspectiveCamera();
    helper.setupCamera(camera, scene);

    // create controls
    var controls = new OrbitControls(camera, rendererDiv);
    helper.setupControls(controls);

    // fill the renderDiv. In RenderWidget happens all the magic.
    // It handles resizes, adds the fps widget and most important defines the main animate loop.
    // You dont need to touch this, but if feel free to overwrite RenderWidget.animate
    var wid = new RenderWidget(rendererDiv, renderer, camera, scene, controls);
    // start the draw loop (this call is async)
    wid.animate();
}

// call main entrypoint
main();
