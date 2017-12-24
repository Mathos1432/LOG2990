import { Injectable } from '@angular/core';
import Stats = require('stats.js');
import { Vector3, PerspectiveCamera, WebGLRenderer, Scene } from 'three';
import { Car } from './car';

const FAR_CLIPPING_PLANE = 1000;
const NEAR_CLIPPING_PLANE = 1;
const FIELD_OF_VIEW = 70;
const CAMERA_Z = 800;

@Injectable()
export class RenderService {
    private camera: PerspectiveCamera;
    private container: HTMLDivElement;
    private car: Car;
    private renderer: WebGLRenderer;
    private scene: THREE.Scene;
    private stats: Stats;
    private lastDate: number;

    constructor() {
        this.car = new Car();
    }

    public initialize(container: HTMLDivElement) {
        if (container) {
            this.container = container;
        }

        this.createScene();
        this.initStats();
        this.startRenderingLoop();
    }

    private initStats() {
        this.stats = new Stats();
        this.stats.dom.style.position = 'absolute';
        this.container.appendChild(this.stats.dom);
    }

    private update() {
        const timeSinceLastFrame = Date.now() - this.lastDate;
        this.car.update(timeSinceLastFrame);
        this.lastDate = Date.now();
    }

    private createScene() {
        this.scene = new Scene();

        this.camera = new PerspectiveCamera(
            FIELD_OF_VIEW,
            this.getAspectRatio(),
            NEAR_CLIPPING_PLANE,
            FAR_CLIPPING_PLANE
        );

        this.camera.position.z = CAMERA_Z;
        this.scene.add(this.car.mesh);
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

    // TODO: Move out of render service.
    public acceleratorPressed(): void {
        this.car.isAcceleratorPressed = true;
    }

    public acceleratorReleased(): void {
        this.car.isAcceleratorPressed = false;
    }
}
