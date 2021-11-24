// external dependencies
import * as THREE from 'three';
import {BufferAttribute, Color, Matrix4, Mesh} from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
// local from us provided utilities
import type * as utils from './lib/utils';
import RenderWidget from './lib/rendererWidget';
import {Application, createWindow} from './lib/window';

// helper lib, provides exercise dependent prewritten Code
import * as helper from './helper';
import {createTeddyBear} from './helper';


function callback(changed: utils.KeyValuePair<helper.Settings>) {
    switch (changed.key) {
        case 'translateX':
            bear.position.x = changed.value
            ndcBear.position.x = changed.value
            break
        case 'translateY':
            bear.position.y = changed.value
            ndcBear.position.y = changed.value
            break
        case 'translateZ':
            bear.position.z = changed.value
            ndcBear.position.z = changed.value
            break
        case 'rotateX':
            bear.rotation.x = changed.value
            ndcBear.rotation.x = changed.value
            break
        case 'rotateZ':
            bear.rotation.z = changed.value
            ndcBear.rotation.z = changed.value
            break
        case 'rotateY':
            bear.rotation.y = changed.value
            ndcBear.rotation.y = changed.value
            break
        case 'near':
            screenCamera.near = changed.value
            screenCamera.updateProjectionMatrix()
            cameraHelper.update()
            updateNdc()
            break
        case 'far':
            screenCamera.far = changed.value
            screenCamera.updateProjectionMatrix()
            cameraHelper.update()
            updateNdc()
            break
        case 'fov':
            screenCamera.fov = changed.value
            screenCamera.updateProjectionMatrix()
            cameraHelper.update()
            updateNdc()
    }

}



/*******************************************************************************
 * Main entrypoint.
 ******************************************************************************/

var settings: helper.Settings;
var bear: THREE.Object3D;
var screenCamera: THREE.PerspectiveCamera;
var cameraHelper: THREE.CameraHelper;
var ndcBear: THREE.Object3D;
var ndcCamera: THREE.OrthographicCamera;
var ndcScene: THREE.Scene;



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
    screenScene.background = new Color('white')
    //screenScene.background = new Color('white')
    screenCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    helper.setupCamera(screenCamera, screenScene)
    let screenControls = new OrbitControls(screenCamera, screenDiv)
    helper.setupControls(screenControls)
    screenScene.add(bear)
    new RenderWidget(screenDiv, screenRenderer, screenCamera, screenScene, screenControls).animate()


    // ---------------------------------------------------------------------------
    // create world view (left)
    let worldRenderer = new THREE.WebGLRenderer({
        antialias: true  // to enable anti-alias and get smoother output
    });
    let worldCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    let worldControls = new OrbitControls(worldCamera, worldDiv)
    helper.setupCamera(worldCamera, screenScene)
    helper.setupControls(worldControls)
    cameraHelper = new THREE.CameraHelper(screenCamera)
    screenScene.add(cameraHelper)
    new RenderWidget(worldDiv, worldRenderer, worldCamera, screenScene, worldControls).animate()


    // ---------------------------------------------------------------------------
    // NDC view
    let ndcRenderer = new THREE.WebGLRenderer({antialias: true})
    ndcScene = new THREE.Scene()
    ndcScene.background = new Color('white')
    ndcScene.matrixAutoUpdate = false
    ndcCamera = helper.createCanonicalCamera()
    let ndcControls = new OrbitControls(ndcCamera, canonicalDiv)
    helper.setupCube(ndcScene)
    ndcBear = helper.createTeddyBear()
    ndcScene.add(ndcBear)
    new RenderWidget(canonicalDiv, ndcRenderer, ndcCamera, ndcScene, ndcControls).animate()
    screenControls.addEventListener('change', updateNdc)
}


function updateVertices(obj: THREE.Object3D) {
    obj.matrixAutoUpdate = false
    obj.matrix.identity()
    if (obj instanceof Mesh) {
        let vertices: BufferAttribute = obj.geometry.getAttribute('position')
        // len = itemSize * numVertices = 3 * numVertices
        let numVertices = vertices.array.length / vertices.itemSize
        for (let i = 0; i != numVertices; i++) {
            let v3 = new Vector3(vertices.getX(i), vertices.getY(i), vertices.getZ(i))
            // flip axis
            v3.z = -1 * v3.z

            // apply obj W as normal matrix
            v3.multiplyWithMatrix(obj.matrixWorld)

            // apply camera Wˆ-1 as normal matrix
            v3.multiplyWithMatrix(screenCamera.matrixWorldInverse)

            // apply camera P as projective mapping
            let v4 = v3.mapToHomogeneousSpace()
            v4.multiplyWithMatrix(screenCamera.projectionMatrix)
            v3 = v4.mapToAffineSpace()

            // flip axis

            vertices.setX(i, v3.x)
            vertices.setY(i, v3.y)
            vertices.setZ(i, v3.z)
        }
        vertices.needsUpdate = true
    }
}

class Vector3 {

    x : number
    y: number
    z: number


    constructor(x: number, y: number, z: number) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    public multiplyWithMatrix(M: Matrix4){
        let arr = M.toArray()
        // indexes in array are like this
        // [0, 1, 2, 3
        //  4, 5, 6, 7,
        //  8, 9, 10, 11,
        //  12, 13, 14, 15]
        this.x = this.x * arr[0] + this.x * arr[1] + this.x * arr[2] + this.x * arr[3]
        this.y = this.y * arr[4] + this.y * arr[5] + this.y * arr[6] + this.y * arr[7]
        this.z = this.z * arr[8] + this.z * arr[9] + this.z * arr[10] + this.z * arr[11]
    }

    public mapToHomogeneousSpace() : Vector4 {
        return new Vector4(this.x, this.y, this.z, 1)
    }
}


class Vector4 extends Vector3 {

    w: number

    constructor(x: number, y: number, z: number, w: number) {
        super(x, y, z)
        this.w = w
    }



    public multiplyWithMatrix(M: Matrix4){
        let arr = M.toArray()
        // indexes in array are like this
        // [0, 1, 2, 3
        //  4, 5, 6, 7,
        //  8, 9, 10, 11,
        //  12, 13, 14, 15]
        this.x = this.x * arr[0] + this.x * arr[1] + this.x * arr[2] + this.x * arr[3]
        this.y = this.y * arr[4] + this.y * arr[5] + this.y * arr[6] + this.y * arr[7]
        this.z = this.z * arr[8] + this.z * arr[9] + this.z * arr[10] + this.z * arr[11]
        this.w = this.w * arr[12] + this.w * arr[13] + this.w * arr[14] + this.w * arr[15]
    }



    public mapToAffineSpace() : Vector3{
       return new Vector3(this.x / this.w, this.y / this.w , this.z / this.w)
    }
}

function invertAxis(m: Matrix4): Matrix4 {
    let arr = m.toArray()
    arr[10] = -1* arr[10]
    m.fromArray(arr)
    return m
}

function updateNdc(){
    ndcScene.remove(ndcBear)
    ndcBear = helper.createTeddyBear()
    ndcBear.position.set(bear.position.x, bear.position.y, bear.position.z)
    ndcBear.rotation.set(bear.rotation.x, bear.rotation.y, bear.rotation.z)
    ndcScene.add(ndcBear)
    ndcBear.traverse(updateVertices)
}



// call main entrypoint
main();
