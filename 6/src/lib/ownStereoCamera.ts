import { PerspectiveCamera, Scene } from "three";

export class OwnStereoCamera extends PerspectiveCamera {

    public cameraLeft = new PerspectiveCamera();
    public cameraRight = new PerspectiveCamera();
    public eyeWidth = 0;
    //@ts-ignore
    public scene: Scene;

    public updateEyes(): void {
        this.cameraRight.position.set(this.position.x + this.eyeWidth / 2, this.position.y, this.position.z);
        this.cameraRight.lookAt(this.scene.position);
        this.cameraLeft.position.set(this.position.x - this.eyeWidth / 2, this.position.y, this.position.z);
        this.cameraLeft.lookAt(this.scene.position);
    }
}
