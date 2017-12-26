import { Injectable } from "@angular/core";
import Stats = require("stats.js");
import { PerspectiveCamera, WebGLRenderer, Scene, AmbientLight } from "three";
import { Car } from "./car";

const FAR_CLIPPING_PLANE: number = 1000;
const NEAR_CLIPPING_PLANE: number = 1;
const FIELD_OF_VIEW: number = 70;

const ACCELERATE_KEYCODE: number = 87;  // w
const LEFT_KEYCODE: number = 65;        // a
const BRAKE_KEYCODE: number = 83;       // s
const RIGHT_KEYCODE: number = 68;       // d

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

    public async initialize(container: HTMLDivElement): Promise<void> {
        if (container) {
            this.container = container;
        }

        await this.createScene();
        this.initStats();
        this.startRenderingLoop();
    }

    private initStats(): void {
        this.stats = new Stats();
        this.stats.dom.style.position = "absolute";
        this.container.appendChild(this.stats.dom);
    }

    private update(): void {
        const timeSinceLastFrame: number = Date.now() - this.lastDate;
        this.car.update(timeSinceLastFrame);
        this.lastDate = Date.now();
    }

    private async createScene(): Promise<void> {
        this.scene = new Scene();

        this.camera = new PerspectiveCamera(
            FIELD_OF_VIEW,
            this.getAspectRatio(),
            NEAR_CLIPPING_PLANE,
            FAR_CLIPPING_PLANE
        );

        await this.car.init();
        this.camera.position.set(0, 25, 0);
        this.camera.lookAt(this.car.mesh.position);
        this.camera.position.set(0, 25, 0);
        this.scene.add(this.car.mesh);
        this.scene.add(new AmbientLight(0xFFFFFF, 0.5));
    }

    private getAspectRatio(): number {
        return this.container.clientWidth / this.container.clientHeight;
    }

    private startRenderingLoop(): void {
        this.renderer = new WebGLRenderer();
        this.renderer.setPixelRatio(devicePixelRatio);
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);

        this.lastDate = Date.now();
        this.container.appendChild(this.renderer.domElement);
        this.render();
    }

    private render(): void {
        requestAnimationFrame(() => this.render());
        this.update();
        this.renderer.render(this.scene, this.camera);
        this.stats.update();
    }

    public onResize(): void {
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
