import { Injectable } from '@angular/core';
import * as THREE from 'three';
import Stats = require('stats.js');
import { Vector3, Vector2 } from 'three';

const FAR_CLIPPING_PLANE = 1000;
const NEAR_CLIPPING_PLANE = 1;
const FIELD_OF_VIEW = 70;
const CAMERA_Z = 400;
const DEFAULT_ROTATION_SPEED = new Vector3(0.005, 0.01, 0);

@Injectable()
export class RenderService {
    private camera: THREE.PerspectiveCamera;
    private container: HTMLDivElement;
    private cube: THREE.Mesh;
    private renderer: THREE.WebGLRenderer;
    private rotationSpeed: Vector3;
    private scene: THREE.Scene;
    private stats: Stats;

    constructor() {
        this.rotationSpeed = DEFAULT_ROTATION_SPEED;
    }

    public initialize(container: HTMLDivElement, rotationSpeed: Vector3) {
        if (container) {
            this.container = container;
        }
        
        if (rotationSpeed) {
            this.rotationSpeed = rotationSpeed;
        }
        
        this.createScene();
        this.createCube();
        this.initStats();
        this.startRenderingLoop();
    }

    private initStats() {
        this.stats = new Stats();
        this.stats.dom.style.position = 'absolute';
        this.container.appendChild(this.stats.dom);
    }

    private update() {
        const currentCubeRotation = this.cube.rotation;

        const newRotation = new Vector3(
            currentCubeRotation.x + this.rotationSpeed.x,
            currentCubeRotation.y + this.rotationSpeed.y,
            currentCubeRotation.z + this.rotationSpeed.z);

        this.cube.rotation.setFromVector3(newRotation);
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
        this.scene = new THREE.Scene();

        this.camera = new THREE.PerspectiveCamera(
            FIELD_OF_VIEW,
            this.getAspectRatio(),
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

    public onResize() {
        this.camera.aspect = this.getAspectRatio();
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    }
}
