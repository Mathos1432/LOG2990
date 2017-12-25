import { Injectable } from "@angular/core";
import Stats = require("stats.js");
import { PerspectiveCamera, WebGLRenderer, Scene, AmbientLight } from "three";
import { Car } from "./car";

const FAR_CLIPPING_PLANE = 1000;
const NEAR_CLIPPING_PLANE = 1;
const FIELD_OF_VIEW = 70;
const CAMERA_Z = 800;

const ACCELERATE_KEYCODE = 87;  // w
const LEFT_KEYCODE = 65;        // a
const BRAKE_KEYCODE = 83;       // s
const RIGHT_KEYCODE = 68;       // d

@Injectable()
export class RenderService {
    private camera: PerspectiveCamera;
    private container: HTMLDivElement;
    private car: Car;
    private renderer: WebGLRenderer;
    private scene: THREE.Scene;
    private stats: Stats;
    private lastDate: number;

    public constructor() {
        this.car = new Car();
    }

    public async initialize(container: HTMLDivElement) {
        if (container) {
            this.container = container;
        }

        await this.createScene();
        this.initStats();
        this.startRenderingLoop();
    }

    private initStats() {
        this.stats = new Stats();
        this.stats.dom.style.position = "absolute";
        this.container.appendChild(this.stats.dom);
    }

    private update() {
        const timeSinceLastFrame = Date.now() - this.lastDate;
        this.car.update(timeSinceLastFrame);
        this.lastDate = Date.now();
    }

    private async createScene() {
        this.scene = new Scene();

        this.camera = new PerspectiveCamera(
            FIELD_OF_VIEW,
            this.getAspectRatio(),
            NEAR_CLIPPING_PLANE,
            FAR_CLIPPING_PLANE
        );

        await this.car.init();
        this.camera.position.set(0, 10, 0);
        this.camera.lookAt(this.car.mesh.position);
        this.scene.add(this.car.mesh);
        this.scene.add(new AmbientLight(0xffffff, 0.5));
    }

    private getAspectRatio() {
        return this.container.clientWidth / this.container.clientHeight;
    }

    private startRenderingLoop() {
        this.renderer = new WebGLRenderer();
        this.renderer.setPixelRatio(devicePixelRatio);
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);

        this.lastDate = Date.now();
        this.container.appendChild(this.renderer.domElement);
        this.render();
    }

    private render() {
        requestAnimationFrame(() => this.render());
        this.update();
        this.renderer.render(this.scene, this.camera);
        this.stats.update();
    }

    public onResize() {
        this.camera.aspect = this.getAspectRatio();
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    }

    public handleKeyDown(event: KeyboardEvent): void {
        // TODO: determine behavior when a and d are pressed at the same time.
        switch (event.keyCode) {
            case ACCELERATE_KEYCODE:
                this.car.isAcceleratorPressed = true;
                break;
            case LEFT_KEYCODE:
                this.car.steerLeft();
                break;
            case RIGHT_KEYCODE:
                this.car.steerRight();
                break;
            case BRAKE_KEYCODE:
                this.car.brake();
                break;
            default:
                break;
        }
    }

    public handleKeyUp(event: KeyboardEvent): void {
        switch (event.keyCode) {
            case ACCELERATE_KEYCODE:
                this.car.isAcceleratorPressed = false;
                break;
            case LEFT_KEYCODE:
            case RIGHT_KEYCODE:
                this.car.releaseSteering();
                break;
            case BRAKE_KEYCODE:
                this.car.releaseBrakes();
                break;
            default:
                break;
        }
    }
}
