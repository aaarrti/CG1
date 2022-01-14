// external dependencies
// @ts-ignore

import * as THREE from 'three';
import {PlaneGeometry, RawShaderMaterial} from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import basicVertexShader from "./shaders/vertex_shader.glsl";
import basicFragmentShader from "./shaders/fragment_shader.glsl";

// local from us provided utilities
import type * as utils from './lib/utils';
import RenderWidget from './lib/rendererWidget';
import {Application, createWindow} from './lib/window';

// helper lib, provides exercise dependent prewritten Code
import * as helper from './helper';
import {
    createBox,
    createBunny,
    createKnot,
    createSphere,
    Geometries,
    initTextures,
    selectImage,
    selectTexture,
    Textures
} from './helper';
import ImageWidget from './imageWidget';


function callback(changed: utils.KeyValuePair<helper.Settings>) {
    switch (changed.key) {
        case "geometry":
            switch (changed.value) {
                case Geometries.sphere:
                    rendered_model.geometry = createSphere()
                    break;
                case Geometries.quad:
                    rendered_model.geometry = new PlaneGeometry()
                    break
                case Geometries.box:
                    rendered_model.geometry = createBox()
                    break
                case Geometries.knot:
                    rendered_model.geometry = createKnot()
                    break
                case Geometries.bunny:
                    rendered_model.geometry = createBunny()
                    break
            }
            break;
        case "texture":
            imageWidget.setImage(selectImage(changed.value))
            // @ts-ignore
            rendered_model.material = new RawShaderMaterial({
                vertexShader: basicVertexShader,
                fragmentShader: basicFragmentShader,
                uniforms: {
                    sampler: {value: selectTexture(changed.value)}
                }
            })
            break;
        case "shader":

            break;
        case "environment":

            break;
        case "normalmap":

            break;
        default:
            break;
    }
}



var imageWidget: ImageWidget;
var scene: THREE.Scene;
var rendered_model: THREE.Mesh;


function main() {
    let root = Application("Texturing");
    root.setLayout([["texture", "renderer"]]);
    root.setLayoutColumns(["50%", "50%"]);
    root.setLayoutRows(["100%"]);

    // ---------------------------------------------------------------------------
    // create Settings and create GUI settings
    let settings = new helper.Settings();
    let gui = helper.createGUI(settings);
    // adds the callback that gets called on settings change
    settings.addCallback(callback);

    // ---------------------------------------------------------------------------
    let textureDiv = createWindow("texture");
    root.appendChild(textureDiv);

    // the image widget. Change the image with setImage
    // you can enable drawing with enableDrawing
    // and it triggers the event "updated" while drawing
    imageWidget = new ImageWidget(textureDiv);
    imageWidget.setImage('textures/earth.jpg')

    // ---------------------------------------------------------------------------
    // create RenderDiv
    let rendererDiv = createWindow("renderer");
    root.appendChild(rendererDiv);

    // create renderer
    let renderer = new THREE.WebGLRenderer({
        antialias: true,  // to enable anti-alias and get smoother output
    });


    // create scene
    scene = new THREE.Scene();
    initTextures()
    const geometry = new PlaneGeometry()
    var material = new THREE.RawShaderMaterial({
        vertexShader: basicVertexShader,
        fragmentShader: basicFragmentShader,
        uniforms: {
            sampler: {value: selectTexture(Textures.earth)}
        }
    })
    rendered_model = new THREE.Mesh(geometry, material)
    scene.add(rendered_model)

    // create camera
    let camera = new THREE.PerspectiveCamera();
    helper.setupCamera(camera, scene);

    // create controls
    let controls = new OrbitControls(camera, rendererDiv);
    helper.setupControls(controls);

    let wid = new RenderWidget(rendererDiv, renderer, camera, scene, controls);
    wid.animate();
}


// call main entrypoint
main();