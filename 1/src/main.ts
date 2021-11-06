// external dependencies
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

import RenderWidget from './lib/rendererWidget';
import { Application, createWindow, Window } from './lib/window';

import * as helper from './helper';
import {KeyBoardInputHandler} from "./helper";
// put your imports here

/*******************************************************************************
 * Main entrypoint. Previouly declared functions get managed/called here.
 * Start here with programming.
 ******************************************************************************/

var camera: THREE.PerspectiveCamera;
var controls: OrbitControls;
var rendererDiv: Window;

function main(){
    // setup/layout root Application.
    // Its the body HTMLElement with some additional functions.
    // More complex layouts are possible too.
    var root = Application("Robot");
  	root.setLayout([["renderer"]]);
    root.setLayoutColumns(["100%"]);
    root.setLayoutRows(["100%"]);

    // ---------------------------------------------------------------------------
    // create RenderDiv
    rendererDiv = createWindow("renderer");
    root.appendChild(rendererDiv);

    // create renderer
    var renderer = new THREE.WebGLRenderer({
        antialias: true,  // to enable anti-alias and get smoother output
    });

    // important exercise specific limitation, do not remove this line
    THREE.Object3D.DefaultMatrixAutoUpdate = false;

    // create scene
    var scene = new THREE.Scene();
    // manually set matrixWorld
    scene.matrixWorld.copy(scene.matrix);
    helper.logMatrixes('scene', scene)
    helper.constructSkeleton(scene)
    helper.setupLight(scene);

    // create camera
    camera = new THREE.PerspectiveCamera();
    helper.setupCamera(camera, scene);

    // create controls
    controls = new OrbitControls(camera, rendererDiv);
    helper.setupControls(controls);

    let habler = new KeyBoardInputHandler(scene);
    document.addEventListener('keydown', event => habler.handleKeyboard(event));

    // fill the renderDiv. In RenderWidget happens all the magic.
    // It handles resizes, adds the fps widget and most important defines the main animate loop.
    // You dont need to touch this, but if feel free to overwrite RenderWidget.animate
    var wid = new RenderWidget(rendererDiv, renderer, camera, scene, controls);
    wid.animate();
}

// call main entrypoint
main();
