import { Object3D, Vector3, BoxGeometry, Mesh, MeshBasicMaterial, FaceColors, Vector2 } from "three";

const MAX_SPEED = 10;
const ACCELERATOR_FORCE = new Vector3(5, 0, 0);
const MAX_REVERSE_SPEED = -10;
const MAX_FORWARD_SPEED = 15;
const STATIC_FRICTION = 0.2;
const BRAKE_POWER = 2;
const MASS = 10;

export class Car {
    public isAcceleratorPressed: boolean;
    public mesh: THREE.Mesh;

    private steeringWheelDirection: number;
    private speed: Vector3;
    private forces: Vector3[];

    constructor() {
        const geometry = new BoxGeometry(50, 50, 50);
        for (let i = 0; i < geometry.faces.length; i += 2) {
            const randomColor = Math.random() * 0xffffff;
            geometry.faces[i].color.setHex(randomColor);
            geometry.faces[i + 1].color.setHex(randomColor);
        }
        const material = new MeshBasicMaterial({ vertexColors: FaceColors, overdraw: 0.5 });
        this.mesh = new Mesh(geometry, material);

        this.speed = new Vector3(-25, 0, 0);
    }

    public update(deltaTime: number) {
        const forces = new Array<Vector3>();

        // TODO: Accelerate/slowdown and steer
        if (this.isAcceleratorPressed) {
            forces.push(ACCELERATOR_FORCE);
        }

        if (Math.abs(this.steeringWheelDirection) >= 0.001) {
            // Add steering force.
        }

        let friction = this.speed.clone().normalize();
        friction.multiplyScalar(-1 * STATIC_FRICTION * 10);
        forces.push(friction);

        if (forces.length > 0) {
            const sumOfForces = new Vector3(0, 0, 0);
            forces.forEach(force => {
                sumOfForces.add(force);
            });
            let acceleration = sumOfForces.divideScalar(MASS);
            this.speed.add(acceleration);
        }

        if (this.speed.length() <= 0.1) {
            this.speed = new Vector3(0, 0, 0);
        }
        this.speed.clampLength(MAX_REVERSE_SPEED, MAX_FORWARD_SPEED);
        // TODO: update speed

        this.mesh.position.add(this.speed);
        // TODO: Check for collision
    }
}