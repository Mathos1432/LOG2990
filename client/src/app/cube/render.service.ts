import { Injectable } from '@angular/core';
import * as THREE from 'three';
import Stats = require('stats.js');

const FAR_CLIPPING_PLANE = 1000;
const NEAR_CLIPPING_PLANE = 1;
const FIELD_OF_VIEW = 70;
const CAMERA_Z = 400;

@Injectable()
export class RenderService {

    private container: HTMLDivElement;
    private camera: THREE.PerspectiveCamera;
    private stats: Stats;
    private cube: THREE.Mesh;
    private renderer: THREE.WebGLRenderer;
    private scene: THREE.Scene;
    public rotationSpeedX = 0.005;
    public rotationSpeedY = 0.01;

    private update() {
        this.cube.rotation.x += this.rotationSpeedX;
        this.cube.rotation.y += this.rotationSpeedY;
    }

    private createCube() {
        const geometry = new THREE.BoxGeometry(50, 50, 50);

        for (let i = 0; i < geometry.faces.length; i += 2) {
            const randomColor = Math.random() * 0xffffff;
            geometry.faces[i].color.setHex(randomColor);
            geometry.faces[i + 1].color.setHex(randomColor);
        }

        const material = new THREE.MeshBasicMaterial({ vertexColors: THREE.FaceColors, overdraw: 0.5 });
        this.cube = new THREE.Mesh(geometry, material);
        this.scene.add(this.cube);
    }

    private createScene() {
        /* Scene */
        this.scene = new THREE.Scene();

        /* Camera */
        const aspectRatio = this.getAspectRatio();
        this.camera = new THREE.PerspectiveCamera(
            FIELD_OF_VIEW,
            aspectRatio,
            NEAR_CLIPPING_PLANE,
            FAR_CLIPPING_PLANE
        );
        this.camera.position.z = CAMERA_Z;
    }

    private getAspectRatio() {
        return this.container.clientWidth / this.container.clientHeight;
    }

    private startRenderingLoop() {
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setPixelRatio(devicePixelRatio);
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);

        this.container.appendChild(this.renderer.domElement);
        this.render();
    }

    private render() {
        requestAnimationFrame(() => this.render());
        this.update();
        this.renderer.render(this.scene, this.camera);
        this.stats.update();
    }

    private initStats() {
        this.stats = new Stats();
        this.stats.dom.style.position = 'absolute';
        this.container.appendChild(this.stats.dom);
    }

    public onResize() {
        this.camera.aspect = this.getAspectRatio();
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    }

    public initialize(container: HTMLDivElement, rotationX: number, rotationY: number) {
        this.container = container;
        this.rotationSpeedX = rotationX;
        this.rotationSpeedY = rotationY;

        this.createScene();
        this.createCube();
        this.initStats();
        this.startRenderingLoop();
    }
}
