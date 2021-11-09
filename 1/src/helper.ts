import * as THREE from 'three';

import type {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import {Color, Matrix4, Mesh, MeshBasicMaterial, Object3D, SphereGeometry, Vector3} from "three";
import {degToRad} from "./lib/utils";

export function setupLight(scene: THREE.Scene) {
    // add two point lights and a basic ambient light
    // https://threejs.org/docs/#api/lights/PointLight
    var light = new THREE.PointLight(0xffffcc, 1, 100);
    light.position.set(10, 30, 15);
    light.matrixAutoUpdate = true;
    scene.add(light);

    var light2 = new THREE.PointLight(0xffffcc, 1, 100);
    light2.position.set(10, -30, -15);
    light2.matrixAutoUpdate = true;
    scene.add(light2);

    //https://threejs.org/docs/#api/en/lights/AmbientLight
    scene.add(new THREE.AmbientLight(0x999999));
    return scene;
}

// define camera that looks into scene
export function setupCamera(camera: THREE.PerspectiveCamera, scene: THREE.Scene) {
    // https://threejs.org/docs/#api/cameras/PerspectiveCamera
    camera.near = 0.01;
    camera.far = 10;
    camera.fov = 70;
    camera.position.z = 1;
    camera.lookAt(scene.position);
    camera.updateProjectionMatrix();
    camera.matrixAutoUpdate = true;
    return camera
}

// define controls (mouse interaction with the renderer)
export function setupControls(controls: OrbitControls) {
    // https://threejs.org/docs/#examples/en/controls/OrbitControls
    controls.rotateSpeed = 1.0;
    controls.zoomSpeed = 1.2;
    controls.enableZoom = true;
    controls.enableKeys = false;
    controls.minDistance = 0.1;
    controls.maxDistance = 5;
    return controls;
}


function addObject(scene: THREE.Object3D, color: string, geometry: THREE.BufferGeometry, m: Matrix4): THREE.Mesh {
    const material = new THREE.MeshPhysicalMaterial({color: color});
    const mesh = new THREE.Mesh(geometry, material);
    mesh.matrix.copy(m)
    mesh.matrixWorld.copy(computeWorldMatrix(mesh))
    color.localeCompare('Matrix')
    scene.add(mesh);
    return mesh
}


// use to caclulate matrixWorld of Node
function chainParentsMatrices(node: THREE.Object3D): THREE.Matrix4 {
    if (node.parent === null) {
        return node.matrix
    }
    return chainParentsMatrices(node.parent).multiply(node.matrix)
}

// M - local tranformation Matrix
function computeWorldMatrix(node: THREE.Object3D): THREE.Matrix4 {
    return chainParentsMatrices(node).multiply(node.matrix)
}

function linearTranslationMatrix(x: number, y: number, z: number) {
    let m = new Matrix4()
    m.set(
        1, 0, 0, x,
        0, 1, 0, y,
        0, 0, 1, z,
        0, 0, 0, 1
    )
    return m
}

const ARM_GEOMETRY = new THREE.BoxGeometry(0.05, 0.22, 0.05)
const LEG_GEOMETRY = new THREE.BoxGeometry(0.07, 0.25, 0.07)

function addArm(body: Object3D, left: boolean){
    let v = (left) ? -1 : 1
    let shoulder = addObject(body, 'blue',
        ARM_GEOMETRY.clone().applyMatrix4(linearTranslationMatrix(0, - 0.1, 0)),
        linearTranslationMatrix(v * 0.08, 0.1, 0))
    addObject(shoulder, 'blue',
        ARM_GEOMETRY.clone().applyMatrix4(linearTranslationMatrix(0, - 0.1, 0)),
        linearTranslationMatrix(v * 0.08,  -0.025, 0)
    )
}

function addLeg(body: Object3D, left: boolean){
    let v = (left) ? -1 : 1
    let thigh = addObject(body, 'blue',
        LEG_GEOMETRY.clone().applyMatrix4(linearTranslationMatrix(0, -0.1, 0)),
        linearTranslationMatrix(v* 0.03, - 0.15, 0))
    addObject(thigh, 'blue', LEG_GEOMETRY.clone().applyMatrix4(linearTranslationMatrix(0, -0.1, 0)),
        linearTranslationMatrix(v * 0.03, -0.285,  0))
}

export function constructRobot(scene: THREE.Scene): KeyBoardInputHandler{
    let body_geometry = new THREE.BoxGeometry(0.2, 0.5, 0.1)
    let body = addObject(scene, 'blue', body_geometry, new Matrix4().identity())
    let head_geometry = new THREE.SphereGeometry(0.1, 30, 30)
    let head = addObject(body, 'blue', head_geometry, linearTranslationMatrix(0, 0.2, 0))
    addArm(body, true)
    addArm(body, false)
    addLeg(body, true)
    addLeg(body, false)
    return new KeyBoardInputHandler(scene);
}

export class KeyBoardInputHandler {

    private activeNode: THREE.Object3D;

    constructor(obj: THREE.Scene) {
        this.activeNode = obj
    }

    private resetColor() {
        if (this.activeNode.type === 'Mesh') {
            // reset color
            ((this.activeNode as THREE.Mesh)
                .material as MeshBasicMaterial).color = new Color('blue')
        }
    }

    //private getOriginalPosition() : Matrix4 {
    //    return this.nodeMeta.get(this.activeNode.id).originalPosition
    //}

    private static setColor(obj: THREE.Object3D<THREE.Event>) {
        if (obj.type === 'Mesh') {
            ((obj as THREE.Mesh)
                .material as MeshBasicMaterial)
                .color = new Color('red')
        }
    }

    public handleKeyboard(event: KeyboardEvent) {

        console.log('Key Pressed: ', event.key)

        switch (event.key) {
            case 'r':
                //let root = this.findRootMesh(this.activeNode);
                //this.restoreDefault(root)
                break
            case 'w':
                const parent = this.activeNode.parent;
                if (parent === null) {
                    return;
                }
                this.resetColor()
                if (parent?.type === 'Mesh') {
                    KeyBoardInputHandler.setColor(parent)
                }
                this.activeNode = parent
                break
            case 's':
                const meshChildren = this.activeNode.children.filter(i => i.type == 'Mesh')
                if (meshChildren.length === 0) {
                    return;
                }
                this.resetColor()
                const child = meshChildren[0] as THREE.Mesh
                (child.material as MeshBasicMaterial).color = new Color('red')
                this.activeNode = meshChildren[0]
                break
            case 'a':
                const parent_s = this.activeNode.parent;
                if (parent_s === null) {
                    return;
                }
                const mesh_siblings_l = parent_s.children.filter(i => i.type === 'Mesh').filter(i => i !== this.activeNode)
                if (mesh_siblings_l.length === 0) {
                    return;
                }
                const curr_index_l = parent_s.children.indexOf(this.activeNode)
                if (curr_index_l === 0) {
                    return;
                }
                const left_sibling = parent_s.children[curr_index_l - 1];
                this.resetColor()
                KeyBoardInputHandler.setColor(left_sibling)
                this.activeNode = left_sibling
                break
            case 'd':
                const parent_r = this.activeNode.parent;
                if (parent_r === null) {
                    return;
                }
                const mesh_siblings = parent_r.children.filter(i => i.type === 'Mesh').filter(i => i !== this.activeNode)
                if (mesh_siblings.length === 0) {
                    return;
                }
                const curr_index_r = parent_r.children.indexOf(this.activeNode)
                if (parent_r.children.length === curr_index_r + 1) {
                    return;
                }
                const right_sibling = parent_r.children[curr_index_r + 1];
                this.resetColor()
                KeyBoardInputHandler.setColor(right_sibling)
                this.activeNode = right_sibling
                break
            case 'c':
                if (this.activeNode.type != 'Mesh') {
                    break
                }
                if (this.activeNode.children.filter(i => i.type === 'AxesHelper').length === 0) {
                    // add axes
                    let ax = new THREE.AxesHelper(0.5)
                    ax.setColors(new Color('red'), new Color('green'), new Color('blue'))
                    ax.matrixWorld.copy(this.activeNode.matrixWorld)
                    this.activeNode.add(ax)
                } else {
                    // remove axes
                    this.activeNode.remove(
                        this.activeNode.children.filter(i => i.type === 'AxesHelper')[0]
                    )
                }
                break
            case 'ArrowRight':
                //this.saveDefaultState()
                rotate(this.activeNode, rotateOnZMatrix(degToRad(ROTATION_ANGLE_DEG)))
                break
            case 'ArrowLeft':
                //this.saveDefaultState()
                rotate(this.activeNode, rotateOnZMatrix(degToRad(-ROTATION_ANGLE_DEG)))
                break
            case 'ArrowUp':
                //this.saveDefaultState()
                rotate(this.activeNode, rotateOnXMatrix(degToRad(-ROTATION_ANGLE_DEG)))
                break
            case 'ArrowDown':
                //this.saveDefaultState()
                rotate(this.activeNode, rotateOnXMatrix(degToRad(ROTATION_ANGLE_DEG)))
                //rotate(this.activeNode, md)
                break
        }

    }

    private findRootMesh(node: Object3D) : Object3D{
        if (node.parent === null || node.parent.type !== 'Mesh'){
            return this.activeNode
        }
        return this.findRootMesh(node.parent)
    }

    //private restoreDefault(root: Object3D){
    //    if (this.defaultState[root.id] !== null){
    //        // @ts-ignore
    //        root.matrix = this.defaultState[root.id][0]
    //        // @ts-ignore
    //        root.matrixWorld = this.defaultState[root.id][1]
    //        this.defaultState[root.id] = null
    //    }
    //}

    //private saveDefaultState(){
    //    if (this.defaultState[this.activeNode.id] === null){
    //        this.defaultState[this.activeNode.id] = [this.activeNode.matrix, this.activeNode.matrixWorld]
    //    }
    //}

}

const ROTATION_ANGLE_DEG = 30


function rotate(node: Object3D, M: Matrix4){
    //let v = findPivot(node)
    //_rotateThroughPoint(node, M, v.x, v.y, v.z)
    let newM = node.matrix.clone().multiply(M)
    node.matrixWorld = newM.multiply(
        node.matrixWorld.clone().multiply(node.matrix.invert())
    )
}

function propagateToChildren(node: Object3D, parentMW : Matrix4){
    node.children.forEach(i => propagateToChildren(i, node.matrixWorld))
    node.matrixWorld = new Matrix4().identity().multiplyMatrices(parentMW, node.matrix)
}

// refernce https://learnopengl.com/Getting-started/Transformations
// x in radians
function rotateOnXMatrix(rad: number): Matrix4 {
    let m = new Matrix4()
    m.set(
        1, 0, 0, 0,
        0, Math.cos(rad), -Math.sin(rad), 0,
        0, Math.sin(rad), Math.cos(rad), 0,
        0, 0, 0, 1
    )
    return m
}

function rotateOnYMatrix(y: number): Matrix4 {
    let m = new Matrix4()
    m.set(
        Math.cos(y), 0, Math.sin(y), 0,
        0, 1, 0, 0,
        -Math.sin(y), 0, Math.cos(y), 0,
        0, 0, 0, 1
    )
    return m
}

function rotateOnZMatrix(z: number): Matrix4 {
    let m = new Matrix4()
    m.set(
        Math.cos(z), -Math.sin(z), 0, 0,
        Math.sin(z), Math.cos(z), 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    )
    return m
}
