import { Vector3, BoxGeometry, Mesh, MeshBasicMaterial, FaceColors, Matrix4 } from "three";
import { Engine } from "./engine";
import { DEG_TO_RAD } from "../constants";

const AERODYNAMIC_DRAG = -0.4;
const BRAKE_POWER = -10000;
const ROLLING_RESISTANCE = -0.4;
const MASS = 1730;              // 3814 pounds
const WHEEL_RADIUS = 0.4064;    // 16 inches

export class Car {
    public isAcceleratorPressed: boolean;
    public mesh: THREE.Mesh;

    private engine: Engine;
    private isBraking: boolean;
    private steeringWheelDirection: number;
    private speed: Vector3;

    private get rotation(): Vector3 {
        return this.mesh.rotation.toVector3();
    }

    private set rotation(newRotation: Vector3) {
        this.mesh.rotation.setFromVector3(newRotation);
    }

    private get direction(): Vector3 {
        const rotationMatrix = new Matrix4();
        rotationMatrix.extractRotation(this.mesh.matrix);
        const carDirection = new Vector3(0, 0, 1);
        carDirection.applyMatrix4(rotationMatrix);

        return carDirection;
    }

    public constructor() {
        const geometry = new BoxGeometry(50, 50, 50);
        for (let i = 0; i < geometry.faces.length; i += 2) {
            const randomColor = Math.random() * 0xffffff;
            geometry.faces[i].color.setHex(randomColor);
            geometry.faces[i + 1].color.setHex(randomColor);
        }
        const material = new MeshBasicMaterial({ vertexColors: FaceColors, overdraw: 0.5 });
        this.mesh = new Mesh(geometry, material);
        this.mesh.rotateX(DEG_TO_RAD * 90);

        this.isBraking = false;
        this.steeringWheelDirection = 0;
        this.engine = new Engine();
        this.speed = new Vector3(0, 0, 0);
    }

    public steerLeft(): void {
        this.steeringWheelDirection = 1;
    }

    public steerRight(): void {
        this.steeringWheelDirection = -1;
    }

    public releaseSteering(): void {
        this.steeringWheelDirection = 0;
    }

    public releaseBrakes(): void {
        this.isBraking = false;
    }

    public brake(): void {
        this.isBraking = true;
    }

    public update(deltaTime: number) {
        deltaTime = deltaTime / 1000;
        this.engine.update(this.speed, WHEEL_RADIUS);

        const forces = new Array<Vector3>();

        forces.push(this.getTractionForce());
        forces.push(this.getRollingResistance());
        forces.push(this.getAerodynamicDrag());

        if (this.isBraking && this.speed.length() > 0) {
            forces.push(this.getBrakingForce());
        }

        const acceleration = this.getAcceleration(forces);
        const deltaSpeed = this.getDeltaSpeed(acceleration, deltaTime);
        this.speed.add(deltaSpeed);

        if (this.speed.length() <= 0.001) {
            this.speed = new Vector3(0, 0, 0);
        }

        const deltaPosition = this.getDeltaPosition(this.speed, deltaTime);
        this.mesh.position.add(deltaPosition);
        this.mesh.rotateY(this.steeringWheelDirection / 10);
    }

    private getDeltaPosition(speed: Vector3, deltaTime: number): Vector3 {
        if (deltaTime < 0) {
            throw new Error("Invalid value for deltaTime, cannot be negative.");
        }
        if (!speed) {
            throw new Error("speed cannot be undefined");
        }

        return speed.clone().multiplyScalar(deltaTime).add(this.speed);
    }

    private getDeltaSpeed(acceleration: Vector3, deltaTime: number): Vector3 {
        if (deltaTime < 0) {
            throw new Error("Invalid value for deltaTime, cannot be negative.");
        }
        if (!acceleration) {
            throw new Error("acceleration cannot be undefined");
        }

        return acceleration.multiplyScalar(deltaTime);
    }

    private getAcceleration(forces: Vector3[]): Vector3 {
        if (!forces) {
            throw new Error("forces cannot be undefined");
        }
        if (forces.length > 0) {
            const sumOfForces = new Vector3(0, 0, 0);
            forces.forEach((force) => {
                sumOfForces.add(force);
            });

            return sumOfForces.divideScalar(MASS);
        }

        return new Vector3();
    }

    private getRollingResistance(): Vector3 {
        return this.speed.clone().multiplyScalar(ROLLING_RESISTANCE);
    }

    private getTractionForce(): Vector3 {
        const tractionForce = this.getWheelTorque().divideScalar(WHEEL_RADIUS);

        return tractionForce;
    }

    private getBrakingForce(): Vector3 {
        return this.direction.normalize().multiplyScalar(BRAKE_POWER);
    }

    private getAerodynamicDrag(): Vector3 {
        const dragForce = this.speed.clone();
        dragForce.multiplyScalar(dragForce.length() * AERODYNAMIC_DRAG);

        return dragForce;
    }

    private getWheelTorque(): Vector3 {
        if (this.isAcceleratorPressed) {
            const torque = this.direction.multiplyScalar(this.engine.getWheelTorque());

            return torque;
        } else {
            return new Vector3(0, 0, 0);
        }
    }
}
