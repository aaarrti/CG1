import * as THREE from 'three';
import type {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import {OBJLoader} from 'three/examples/jsm/loaders/OBJLoader.js';
import * as dat from 'dat.gui';

// local from us provided utilities
import * as utils from './lib/utils';
import bunny from './models/bunny.obj';
import {BufferGeometry, BufferGeometryUtils, Float32BufferAttribute, Uint16BufferAttribute} from "three";


/*******************************************************************************
 * helper functions to build scene (geometry, light), camera and controls.
 ******************************************************************************/

// enum(s)
export enum Geometries { quad = "Quad", box = "Box", sphere = "Sphere", knot = "Knot", bunny = "Bunny" }

export enum Textures {
    earth = "Earth",
    colors = "Colors",
    disturb = "Disturb",
    checker = "Checker",
    terracotta = "Terracotta",
    plastic = "Plastic",
    wood_ceiling = "Wood",
    lava = "Lava",
    rock = "Rock",
    indoor = "Environment"
}

export enum NormalMaps {
    uniform_normals = "Uniform",
    terracotta_normals = "Terracotta",
    plastic_normals = "Plastic",
    wood_ceiling_normals = "Wood",
    lava_normals = "Lava",
    rock_normals = "Rock"
}

export enum Shaders {
    uv = "UV attribute",
    spherical = "Spherical",
    fixSpherical = "Spherical (fixed)",
    envMapping = "Environment Mapping",
    normalmap = "Normal Map"
}


export class Settings extends utils.Callbackable {
    texture: Textures = Textures.earth;
    geometry: Geometries = Geometries.quad;
    shader: Shaders = Shaders.uv;
    pen: () => void = () => {
    };
    environment: boolean = false;
    normalmap: NormalMaps = NormalMaps.uniform_normals;
}

export function createGUI(params: Settings): dat.GUI {
    var gui: dat.GUI = new dat.GUI();

    gui.add(params, 'texture', utils.enumOptions(Textures)).name('Texture')
    gui.add(params, 'geometry', utils.enumOptions(Geometries)).name('Geometry')
    gui.add(params, 'shader', utils.enumOptions(Shaders)).name('Shader')
    gui.add(params, 'normalmap', utils.enumOptions(NormalMaps)).name('Normal Map')
    gui.add(params, "pen").name("Clear Drawing")
    gui.add(params, "environment").name("Environment")

    return gui;
}

export function createBunny() {
    const loader = new OBJLoader();
    var geometry = new THREE.BufferGeometry();
    var mesh = loader.parse(bunny).children[0];
    if (mesh instanceof THREE.Mesh) {
        geometry = mesh.geometry as THREE.BufferGeometry;
    }
    geometry.setIndex([...Array(geometry.attributes.position.count).keys()]);
    return geometry;
}

export function createBox() {
    var geometry = new THREE.BoxGeometry(1, 1, 1);
    return geometry;
}

export function createSphere() {
    var geometry = new THREE.SphereGeometry(0.6, 30, 30);
    return geometry;
}

export function createKnot() {
    var geometry = new THREE.TorusKnotGeometry(0.4, 0.1, 100, 32);
    return geometry;
}

// define camera that looks into scene
export function setupCamera(camera: THREE.PerspectiveCamera, scene: THREE.Scene) {
    // https://threejs.org/docs/#api/cameras/PerspectiveCamera
    camera.near = 0.01;
    camera.far = 1000;
    camera.fov = 70;
    camera.position.z = 2;
    camera.lookAt(scene.position);
    camera.updateProjectionMatrix()
    return camera
}

// define controls (mouse interaction with the renderer)
export function setupControls(controls: OrbitControls) {
    // https://threejs.org/docs/#examples/en/controls/OrbitControls
    controls.rotateSpeed = 1.0;
    controls.zoomSpeed = 1.2;
    controls.enableZoom = true;
    controls.keys = {LEFT: '65', UP: '87', RIGHT: '68', BOTTOM: '83'};
    controls.minDistance = 0.1;
    controls.maxDistance = 9;
    return controls;
};

export function selectImage(type: Textures): string {
    return _selectImage(type.toString())
}

function _selectImage(type: string): string {
    let imageName;
    if (type.toLowerCase() === 'wood') {
        imageName = 'textures/wood_ceiling.jpg'
    } else if (type.toLowerCase() === 'environment') {
        imageName = 'textures/indoor.jpg'
    } else {
        imageName = `textures/${type.toLowerCase()}.jpg`
    }
    return imageName;
}

export function loadTexture(name: string) {
    const path = _selectImage(name)
    return new THREE.TextureLoader().load(path);
}

// @ts-ignore
export var loadedTextures;
// @ts-ignore
export var loadedNormalMaps;

export function initTextures() {
    loadedTextures = {
        earth: loadTexture('earth'),
        colors: loadTexture('colors'),
        disturb: loadTexture('disturb'),
        checker: loadTexture('checker'),
        terracotta: loadTexture('terracotta'),
        plastic: loadTexture('plastic'),
        rock: loadTexture('rock'),
        wood: loadTexture('wood_ceiling'),
        lava: loadTexture('lava'),
        indoor: loadTexture('indoor')
    }

    loadedNormalMaps = {
        terracotta: loadTexture('terracotta_normals'),
        plastic: loadTexture('plastic_normals'),
        wood: loadTexture('wood_ceiling_normals'),
        lava: loadTexture('lava_normals'),
        rock: loadTexture('rock_normals')
    }
}


export function selectTexture(type: Textures): THREE.Texture {
    switch (type) {
        case Textures.checker:
            return loadedTextures.checker
        case Textures.colors:
            return loadedTextures.colors
        case Textures.disturb:
            return loadedTextures.disturb
        case Textures.earth:
            return loadedTextures.earth
        case Textures.indoor:
            return loadedTextures.indoor
        case Textures.lava:
            return loadedTextures.lava
        case Textures.plastic:
            return loadedTextures.plastic
        case Textures.rock:
            return loadedTextures.rock
        case Textures.terracotta:
            return loadedTextures.terracotta
        case Textures.wood_ceiling:
            return loadedTextures.wood
    }
}

export function constructQuad(): THREE.BufferGeometry {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new Float32BufferAttribute([-0.5, 0.5, 0., 0.5, 0.5, 0., -0.5, -0.5, 0, 0.5, -0.5, 0.], 3))
    geo.setAttribute('uv', new Float32BufferAttribute([0., 1., 1., 1., 0., 0., 1., 0.], 2))
    geo.setAttribute('normal', new Float32BufferAttribute([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1], 3))
    geo.setIndex(new Uint16BufferAttribute([0, 2, 1, 2, 3, 1], 1))
    return geo;
}


export function mapShaderToInt(shader: Shaders) {
    switch (shader) {
        case Shaders.uv:
            return 0;
        case Shaders.spherical:
            return 1;
        case Shaders.fixSpherical:
            return 2;
        case Shaders.envMapping:
            return 3;
        case Shaders.normalmap:
            return 4;
    }
}

export function selectNormalMap(map: NormalMaps): Textures {
    switch (map) {
        case NormalMaps.lava_normals:
            return loadedNormalMaps.lava;
        case NormalMaps.plastic_normals:
            return loadedNormalMaps.plastic;
        case NormalMaps.rock_normals:
            return loadedNormalMaps.rock;
        case NormalMaps.terracotta_normals:
            return loadedNormalMaps.terracotta;
        case NormalMaps.wood_ceiling_normals:
            return loadedNormalMaps.wood;
        case NormalMaps.uniform_normals:
            // @ts-ignore
            return null;
    }

}