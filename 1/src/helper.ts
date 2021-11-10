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

const defaultState: Map<number, State> = new Map<number, State>()

function addObject(scene: THREE.Object3D, color: string, geometry: THREE.BufferGeometry, m: Matrix4): THREE.Mesh {
    const material = new THREE.MeshPhysicalMaterial({color: color});
    const mesh = new THREE.Mesh(geometry, material);
    mesh.matrix.copy(m)
    mesh.matrixWorld.copy(computeWorldMatrix(mesh))
    color.localeCompare('Matrix')
    defaultState.set(mesh.id, new State(mesh.matrixWorld, mesh.matrix))
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

class State {
    world: Matrix4
    local: Matrix4

    constructor(world: Matrix4, local: Matrix4) {
        this.world = new Matrix4().copy(world);
        this.local = new Matrix4().copy(local);
    }
}

let left_arm_id = NaN
let right_arm_id = NaN

function addArm(body: Object3D, left: boolean) {
    let v = (left) ? -1 : 1
    let shoulder = addObject(body, 'blue',
        ARM_GEOMETRY.clone().applyMatrix4(linearTranslationMatrix(0, -0.1, 0)),
        linearTranslationMatrix(v * 0.08, 0.1, 0))
    let arm = addObject(shoulder, 'blue',
        ARM_GEOMETRY.clone().applyMatrix4(linearTranslationMatrix(0, -0.1, 0)),
        linearTranslationMatrix(v * 0.08, -0.025, 0)
    )
    if (left) {
        left_arm_id = arm.id
    } else {
        right_arm_id = arm.id
    }
}

let left_leg_id = NaN
let right_leg_id = NaN

function addLeg(body: Object3D, left: boolean) {
    let v = (left) ? -1 : 1
    let thigh = addObject(body, 'blue',
        LEG_GEOMETRY.clone().applyMatrix4(linearTranslationMatrix(0, -0.1, 0)),
        linearTranslationMatrix(v * 0.03, -0.15, 0))
    let leg = addObject(thigh, 'blue', LEG_GEOMETRY.clone().applyMatrix4(linearTranslationMatrix(0, -0.1, 0)),
        linearTranslationMatrix(v * 0.03, -0.285, 0))
    if (left) {
        left_leg_id = leg.id
    } else {
        right_leg_id = leg.id
    }
}

export function constructRobot(scene: THREE.Scene): KeyBoardInputHandler {
    let body_geometry = new THREE.BoxGeometry(0.2, 0.5, 0.1)
    let body = addObject(scene, 'blue', body_geometry, new Matrix4().identity())
    let head_geometry = new THREE.SphereGeometry(0.1, 30, 30)
    addObject(body, 'blue', head_geometry, linearTranslationMatrix(0, 0.2, 0))
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

    private static setColor(obj: THREE.Object3D<THREE.Event>) {
        if (obj.type === 'Mesh') {
            ((obj as THREE.Mesh)
                .material as MeshBasicMaterial)
                .color = new Color('red')
        }
    }

    public handleKeyboard(event: KeyboardEvent) {
        switch (event.key) {
            case 'r':
                resetRobot(findRootMesh(this.activeNode))
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
                    this.activeNode.remove(this.activeNode.children.filter(i => i.type === 'AxesHelper')[0])
                }
                break
            case 'ArrowRight':
                rotate(this.activeNode, rotateOnYMatrix(degToRad(ROTATION_ANGLE_DEG)))
                break
            case 'ArrowLeft':
                rotate(this.activeNode, rotateOnYMatrix(degToRad(-ROTATION_ANGLE_DEG)))
                break
            case 'ArrowUp':
                rotate(this.activeNode, rotateOnXMatrix(degToRad(-ROTATION_ANGLE_DEG)))
                break
            case 'ArrowDown':
                rotate(this.activeNode, rotateOnXMatrix(degToRad(ROTATION_ANGLE_DEG)))
                break
        }
    }

}

const ROTATION_ANGLE_DEG = 30

function findRootMesh(node: Object3D): Object3D {
    if (node.parent === null || node.parent.type !== 'Mesh') {
        return node
    }
    return findRootMesh(node.parent)
}

// works only if initial position didnt have any rotations
function resetRobot(node: Object3D) {
    if (defaultState.has(node.id)) {
        let state = defaultState.get(node.id)
        // @ts-ignore
        node.matrix.copy(state.local)
        // @ts-ignore
        node.matrixWorld.copy(state.world)
    }
    node.children.forEach(resetRobot)
    left_arm_moved = false
    right_arm_moved = false
    left_leg_moved = false
    right_leg_moved = false
}

function rotate(node: Object3D, M: Matrix4) {
    node.matrix.multiply(M)
    node.matrixWorld.multiply(M)
    node.children.forEach(propagateToChildren)
}

let left_arm_moved = false
let right_arm_moved = false
let left_arm_offset = linearTranslationMatrix(0.16, -0.2, 0)
let right_arm_offset = linearTranslationMatrix(-0.16, -0.19, 0)
let left_leg_moved = false
let right_leg_moved = false
let left_leg_offset = linearTranslationMatrix(0.06, 0.3, 0)
let right_leg_offset = linearTranslationMatrix(-0.06, 0.3, 0)

function propagateToChildren(node: Object3D) {
    if (node.parent === null) {
        // should never occur
        console.error('This must hever happen!')
        node.matrixWorld.copy(node.matrix)
    } else {
        // workaround for 1 move
        if (node.id === left_arm_id && !left_arm_moved) {
            node.matrix.multiply(left_arm_offset)
            left_arm_moved = true
        }
        if (node.id === right_arm_id && !right_arm_moved) {
            node.matrix.multiply(right_arm_offset)
            right_arm_moved = true
        }
        if (node.id === left_leg_id && !left_leg_moved) {
            node.matrix.multiply(left_leg_offset)
            left_leg_moved = true
        }
        if (node.id === right_leg_id && !right_leg_moved) {
            node.matrix.multiply(right_leg_offset)
            right_leg_moved = true
        }
        node.matrixWorld.multiplyMatrices(node.parent.matrixWorld, node.matrix)
    }
    //  not really needed as real depth is max 2
    node.children.forEach(propagateToChildren)
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
