import * as THREE from 'three';

import type {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import {
    JOINT_LEN,
    NECK_LEN,
    RADIUS,
    BODY_LEN,
    SHOULDER_LEN,
    ARM_LEN,
    LEG_LEN,
    TIGHT_LEN,
    Y_OFFSET
} from "./config";
import {Color, Matrix4, MeshBasicMaterial} from "three";
import {degToRad} from "./lib/utils";

export enum Shape {
    box = "Box",
    sphere = "Sphere",
}

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

let xSize = 4;
let ySize = 8;
let zSize = 5;


function mapTo3D(i : number) {
    let z = Math.floor(i / (xSize * ySize));
    i -= z * xSize * ySize;
    let y = Math.floor(i / xSize);
    let x = i % xSize;
    return { x: x, y: y, z: z };
}

function mapFrom3D(x : number, y : number, z : number) {
    return x + y * xSize + z * xSize * ySize;
}


function addGrid(scene: THREE.Scene){
    let n = xSize * ySize * zSize;
    let geometry = new THREE.BufferGeometry();

    let positions = [];
    for (let i = 0; i < n; i++) {
        let p = mapTo3D(i);
        positions.push((p.x - xSize / 2) / xSize);
        positions.push((p.y - ySize / 2) / ySize);
        positions.push((p.z - zSize / 2) / zSize);
    }
    let positionAttribute = new THREE.Float32BufferAttribute(positions, 3);
    geometry.addAttribute("position", positionAttribute);

    let indexPairs = [];
    for (let i = 0; i < n; i++) {
        let p = mapTo3D(i);
        if (p.x + 1 < xSize) {
            indexPairs.push(i);
            indexPairs.push(mapFrom3D(p.x + 1, p.y, p.z));
        }
        if (p.y + 1 < ySize) {
            indexPairs.push(i);
            indexPairs.push(mapFrom3D(p.x, p.y + 1, p.z));
        }
        if (p.z + 1 < zSize) {
            indexPairs.push(i);
            indexPairs.push(mapFrom3D(p.x, p.y, p.z + 1));
        }
    }
    geometry.setIndex(indexPairs);
    let lines = new THREE.LineSegments(geometry, new THREE.LineBasicMaterial());
    scene.add(lines);
}

export function matrixToString(matrix: THREE.Matrix4): string {
    const arr = matrix.toArray()
    return `\n[ ${arr[0]},${arr[4]},${arr[8]},${arr[12]}\n` +
        `  ${arr[1]},${arr[5]},${arr[9]},${arr[13]}\n` +
        `  ${arr[2]},${arr[6]},${arr[10]},${arr[14]}\n` +
        `  ${arr[3]},${arr[7]},${arr[11]},${arr[15]} ]`
}

export function logMatrixes(name: string, obj: THREE.Object3D) {
    console.log(`Matrix of ${name} is =` + matrixToString(obj.matrix))
    console.log(`Matrix world of ${name} is = ` + matrixToString(obj.matrixWorld))
}


function addObject(scene: THREE.Object3D, color: string, geometry: THREE.BufferGeometry, x: number, y: number, z: number): THREE.Object3D {
    const material = new THREE.MeshPhysicalMaterial({color: color});
    const mesh = new THREE.Mesh(geometry, material);
    const matrix = new THREE.Matrix4();
    matrix.set(
        1, 0, 0, x,
        0, 1, 0, y,
        0, 0, 1, z,
        0, 0, 0, 1
    )
    mesh.matrix.copy(new THREE.Matrix4().identity())
    mesh.matrixWorld.copy(matrix)
    logMatrixes(color, mesh)
    color.localeCompare('Matrix')
    scene.add(mesh);
    return mesh
}

function addSphere(obj: THREE.Object3D, color: string, x: number = 0, y: number = 0, z: number = 0): THREE.Object3D {
    return addObject(obj, color, new THREE.SphereGeometry(RADIUS, 30, 30), x, y, z)
}

function addBlock(scene: THREE.Object3D, color: string, x: number = 0, y: number = 0, z: number = 0): THREE.Object3D {
    return addObject(scene, color, new THREE.BoxGeometry(BODY_LEN / 2, BODY_LEN, BODY_LEN / 4), x, y, z)
}

function addBlock_(scene: THREE.Object3D, color: string, h: number, w : number, d : number, x: number = 0, y: number = 0, z: number = 0){
    return addObject(scene, color, new THREE.BoxGeometry(w, h, d), x, y, z)
}

export function constructSkeleton(scene: THREE.Scene): void {
    //let grid = new THREE.GridHelper(5, 10);
    //scene.add(grid)
    //addGrid(scene)
    let body = addBlock(scene, 'blue', 0, Y_OFFSET)
    let head_geometry = new THREE.SphereGeometry(1.5 * RADIUS, 30, 30)
    let neck = addBlock_(body, 'blue', 0.1, 0.05, 0.05, 0.1, 0.1, 0.1)
    let head = addObject(neck, 'blue', head_geometry, 0, NECK_LEN + Y_OFFSET, 0)
    let leftShoulder = addSphere(body, 'blue', -JOINT_LEN, BODY_LEN / 2 - JOINT_LEN / 2 + Y_OFFSET)
    let rightShoulder = addSphere(body, 'blue', JOINT_LEN, BODY_LEN / 2 - JOINT_LEN / 2 + Y_OFFSET)
    let leftElbow = addSphere(leftShoulder, 'blue', -SHOULDER_LEN, Y_OFFSET)
    let leftHand = addSphere(leftElbow, 'blue', -SHOULDER_LEN, -ARM_LEN / 2 + Y_OFFSET, ARM_LEN / 2)
    let rightElbow = addSphere(rightShoulder, 'blue', SHOULDER_LEN, Y_OFFSET)
    let rightHand = addSphere(rightElbow, 'blue', SHOULDER_LEN, -ARM_LEN / 2)
    let leftHip = addSphere(body, 'blue', -JOINT_LEN, -BODY_LEN / 2 + Y_OFFSET)
    let rightHip = addSphere(body, 'blue', JOINT_LEN, -BODY_LEN / 2 + Y_OFFSET)
    let leftKnee = addSphere(leftHip, 'blue', -JOINT_LEN, -TIGHT_LEN + Y_OFFSET)
    let leftFoot = addSphere(leftKnee, 'blue', -JOINT_LEN, -LEG_LEN - TIGHT_LEN + Y_OFFSET)
    let rightKnee = addSphere(rightHip, 'blue', JOINT_LEN, -TIGHT_LEN + Y_OFFSET, JOINT_LEN)
    let rightFoot = addSphere(rightKnee, 'blue', JOINT_LEN, -LEG_LEN - TIGHT_LEN + Y_OFFSET, 1.5 * JOINT_LEN)
}

export class KeyBoardInputHandler {

    activeNode: THREE.Object3D;

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

        console.log('Key Pressed: ', event.key)

        switch (event.key) {
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
                    ax.matrixWorld.multiplyMatrices(this.activeNode.matrixWorld, ax.matrix)
                    this.activeNode.add(ax)
                } else {
                    // remove axes
                    this.activeNode.remove(
                        this.activeNode.children.filter(i => i.type === 'AxesHelper')[0]
                    )
                }
                break
            case 'ArrowRight':
                let mr = KeyBoardInputHandler.rotateOnYMatrix(degToRad(30))
                this.activeNode.matrix.multiplyMatrices(mr, this.activeNode.matrix)
                this.activeNode.matrixWorld.multiplyMatrices(this.activeNode.matrixWorld, this.activeNode.matrix)
                break
            case 'ArrowLeft':
                let ml = KeyBoardInputHandler.rotateOnYMatrix(degToRad(-30))
                this.activeNode.matrix.multiplyMatrices(ml, this.activeNode.matrix)
                this.activeNode.matrixWorld.multiplyMatrices(this.activeNode.matrixWorld, this.activeNode.matrix)
                break
            case 'ArrowUp':
                let mu = KeyBoardInputHandler.rotateOnXMatrix(degToRad(-30))
                this.activeNode.matrix.multiplyMatrices(mu, this.activeNode.matrix)
                this.activeNode.matrixWorld.multiplyMatrices(this.activeNode.matrixWorld, this.activeNode.matrix)
                break
            case 'ArrowDown':
                let md = KeyBoardInputHandler.rotateOnXMatrix(degToRad(30))
                this.activeNode.matrix.multiplyMatrices(md, this.activeNode.matrix)
                this.activeNode.matrixWorld.multiplyMatrices(this.activeNode.matrixWorld, this.activeNode.matrix)
                break

        }

    }

    // refernce https://learnopengl.com/Getting-started/Transformations
    // x in radians
    private static rotateOnXMatrix(x: number): Matrix4 {
        let m = new Matrix4()
        m.set(
            1, 0, 0, 0,
            0, Math.cos(x), -Math.sin(x), 0,
            0, Math.sin(x), Math.cos(x), 0,
            0, 0, 0, 1
        )
        return m
    }

    private static rotateOnYMatrix(y: number): Matrix4 {
        let m = new Matrix4()
        m.set(
            Math.cos(y), 0, Math.sin(y), 0,
            0, 1, 0, 0,
            -Math.sin(y), 0, Math.cos(y), 0,
            0, 0, 0, 1
        )
        return m
    }

    private static rotateOnZMatrix(z: number): Matrix4 {
        let m = new Matrix4()
        m.set(
            Math.cos(z), -Math.sin(z), 0, 0,
            Math.sin(z), Math.cos(z), 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        )
        return m
    }


}
