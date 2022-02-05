import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DirectionalLight, PointLight } from "three";

// define Scene
export function setupGeometry(scene: THREE.Scene) {
    // Instantiate a loader
    const loader = new GLTFLoader();

    // Load a glTF resource
    loader.load(
        // resource URL
        "models/scene.gltf",
        // called when the resource is loaded
        function(gltf) {
            console.log(gltf);
            let root = gltf.scene;
            root.scale.set(0.008, 0.008, 0.008);
            root.position.set(0, -0.5, 0);
            scene.add(root);
        },
        function(xhr) {
            console.log((xhr.loaded / xhr.total * 100) + "% loaded");
        },
        // called when loading has errors
        function(error) {
            console.log("An error happened");
        }
    );
}

export function setupLight(scene: THREE.Scene) {
    let light_front = new DirectionalLight("white", 1);
    light_front.position.set(0, 0, 0.5);
    scene.add(light_front);

    let light_under = new PointLight("white", 2);
    light_under.position.set(0.5, 0.5, 0);
    scene.add(light_under);
    return scene;
}

// define camera that looks into scene
export function setupCamera(camera: THREE.PerspectiveCamera, scene: THREE.Scene) {
    // https://threejs.org/docs/#api/cameras/PerspectiveCamera
    camera.near = 0.01;
    camera.far = 10;
    camera.fov = 70;
    camera.position.z = 3;
    camera.lookAt(scene.position);
    camera.updateProjectionMatrix();
    return camera;
}

