// external dependencies
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
// local from us provided utilities
import type * as utils from './lib/utils';
import RenderWidget from './lib/rendererWidget';
import {Application, createWindow} from './lib/window';

// helper lib, provides exercise dependent prewritten Code
import * as helper from './helper';
import {createTeddyBear} from "./helper";


function callback(changed: utils.KeyValuePair<helper.Settings>) {
    switch (changed.key) {
        case 'translateX':
            bear.position.x = changed.value
            break
        case 'translateY':
            bear.position.y = changed.value
            break
        case 'translateZ':
            bear.position.z = changed.value
            break
        case 'rotateX':
            bear.rotation.x = changed.value
            break
        case 'rotateZ':
            bear.rotation.z = changed.value
            break
        case 'rotateY':
            bear.rotation.y = changed.value
            break
    }

}

/*******************************************************************************
 * Main entrypoint.
 ******************************************************************************/

var settings: helper.Settings;
var bear: THREE.Object3D;

function main() {
    var root = Application("Camera");
    root.setLayout([["world", "canonical", "screen"]]);
    root.setLayoutColumns(["1fr", "1fr", "1fr"]);
    root.setLayoutRows(["100%"]);


    var screenDiv = createWindow("screen");
    root.appendChild(screenDiv);

    // create RenderDiv
    var worldDiv = createWindow("world");
    root.appendChild(worldDiv);

    // create canonicalDiv
    var canonicalDiv = createWindow("canonical");
    root.appendChild(canonicalDiv);

    // ---------------------------------------------------------------------------
    // create Settings and create GUI settings
    settings = new helper.Settings();
    helper.createGUI(settings);
    settings.addCallback(callback);

    bear = createTeddyBear()

    // ---------------------------------------------------------------------------
    // create screen view (right)
    let screenRenderer = new THREE.WebGLRenderer({
        antialias: true,  // to enable anti-alias and get smoother output
    });
    let screenScene = new THREE.Scene();
    const screenCamera = new THREE.PerspectiveCamera()
    helper.setupCamera(screenCamera, screenScene, 0.01, 10, 70)
    let screenControls = new OrbitControls(screenCamera, screenDiv)
    helper.setupControls(screenControls)
    screenScene.add(bear)
    new RenderWidget(screenDiv, screenRenderer, screenCamera, screenScene, screenControls).animate()
}

// call main entrypoint
main();
