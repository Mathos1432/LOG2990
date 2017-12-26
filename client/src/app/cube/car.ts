import {
    Vector3,
    BoxGeometry,
    Mesh,
    MeshBasicMaterial,
    FaceColors,
    Matrix4,
    Object3D,
    ObjectLoader,
    Euler,
    Quaternion,
    Matrix3
} from "three";
import { Engine } from "./engine";
import { DEG_TO_RAD } from "../constants";
import { directiveDef } from "@angular/core/src/view/provider";
import { INTERNAL_BROWSER_DYNAMIC_PLATFORM_PROVIDERS } from "@angular/platform-browser-dynamic/src/platform_providers";
import { concat } from "rxjs/operators/concat";
import { Wheel } from "./wheel";

const DRAG_CONSTANT: number = 0.45;
const BRAKE_POWER: number = -10000;
const ROLLING_RESISTANCE: number = 13.45;
const MASS: number = 1515;              // 3339 pounds

const WHEELBASE: number = 2.78;
const MESH_ROTATION: Euler = new Euler(0, Math.PI / 2, 0);
const SLIP_CONSTANT: number = 300;
const STEERING_ANGLE: number = Math.PI / 16;
const GRAVITY: number = -9.81;          // m/s

export class Car extends Object3D {
    public isAcceleratorPressed: boolean;
    public mesh: Object3D;

    private rearWheel: Wheel;
    private engine: Engine;
    private isBraking: boolean;
    private steeringWheelDirection: number;
    private speed: Vector3;
    private weightRear: number;

    private get VLong(): number {
        return this.speed.x;
    }

    private get VLat(): number {
        return this.speed.z;
    }

    private get direction(): Vector3 {
        const rotationMatrix: Matrix4 = new Matrix4();
        rotationMatrix.extractRotation(this.mesh.matrix);
        const carDirection: Vector3 = new Vector3(0, 0, -1);
        carDirection.applyMatrix4(rotationMatrix);

        return carDirection;
    }

    public constructor() {
        super();
        this.isBraking = false;
        this.steeringWheelDirection = 0;
        this.engine = new Engine();
        this.rearWheel = new Wheel();
        this.weightRear = 0.5;
        this.speed = new Vector3(0, 0, 0);
    }

    public async init(): Promise<void> {
        this.mesh = await this.load();
        this.mesh.setRotationFromEuler(MESH_ROTATION);
        this.add(this.mesh);
    }

    public steerLeft(): void {
        this.steeringWheelDirection = STEERING_ANGLE;
    }

    public steerRight(): void {
        this.steeringWheelDirection = -STEERING_ANGLE;
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

    public update(deltaTime: number): void {
        deltaTime = deltaTime / 1000;

        // Move to origin
        const rotationMatrix: Matrix4 = new Matrix4();
        rotationMatrix.extractRotation(this.mesh.matrix);
        const rotationQuaternion: Quaternion = new Quaternion();
        rotationQuaternion.setFromRotationMatrix(rotationMatrix);
        const angle: Euler = this.mesh.rotation;
        this.speed.applyMatrix4(rotationMatrix);

        // Physics calculations
        this.rearWheel.angularVelocity += this.getAngularAcceleration() * deltaTime;
        this.engine.update(this.speed, this.rearWheel.radius);
        this.weightRear = this.getWeightDistribution();
        this.speed.add(this.getDeltaSpeed(deltaTime));
        this.mesh.position.add(this.getDeltaPosition(deltaTime));
        this.rearWheel.update(this.speed.length());

        // Move back to good coordinates
        this.speed = this.speed.clone().applyQuaternion(rotationQuaternion.inverse());
        const R: number = WHEELBASE / Math.sin(this.steeringWheelDirection * deltaTime);
        const omega: number = this.speed.length() / R;
        this.mesh.rotateY(omega);
    }

    private async load(): Promise<Object3D> {
        return new Promise<Object3D>((resolve, reject) => {
            const loader: ObjectLoader = new ObjectLoader();
            loader.load("../../assets/camero/camero-2010-low-poly.json", (object) => {
                resolve(object);
            });
        });
    }

    private getWeightDistribution(): number {
        const acceleration: number = this.getAcceleration().length();
        const distribution: number = MASS * 0.5 + (1 / WHEELBASE) * MASS * acceleration;

        return Math.min(Math.max(0, distribution), 1);
    }

    private getTractionForce(): number {
        const force: Vector3 = this.direction.clone().multiplyScalar(this.getEngineForce());
        const slipPeak: number = Math.min(SLIP_CONSTANT * this.getSlipRatio(), 6000);
        const maximumForce: number = slipPeak * this.weightRear;

        return maximumForce > force.length() ? maximumForce : force.length();
    }

    private getSlipRatio(): number {
        return (this.rearWheel.angularVelocity * this.rearWheel.radius - this.direction.x) / Math.abs(this.direction.x);
    }

    private getAngularAcceleration(): number {
        return this.getTotalTorque() / (this.rearWheel.inertia * 2);
    }

    private getBrakeForce(): Vector3 {
        return this.direction.multiplyScalar(this.rearWheel.frictionCoefficient * MASS * GRAVITY);
    }

    private getBrakeTorque(): number {
        return this.getBrakeForce().length() * this.rearWheel.radius;
    }

    private getTractionTorque(): number {
        return this.getTractionForce() * this.rearWheel.radius;
    }

    private getTotalTorque(): number {
        return this.engine.getDriveTorque() + this.getTractionTorque() * 2 + this.getBrakeTorque();
    }

    private getEngineForce(): number {
        return this.engine.getDriveTorque() / this.rearWheel.radius;
    }

    private getDragForce(): Vector3 {
        return this.speed.clone().multiplyScalar(DRAG_CONSTANT * this.speed.length());
    }

    private getRollingResistance(): Vector3 {
        return this.speed.clone().multiplyScalar(ROLLING_RESISTANCE);
    }

    private getLongitudinalForce(): Vector3 {
        const resultingForce: Vector3 = new Vector3();

        const tractionForce: number = this.getTractionForce();
        const dragForce: Vector3 = this.getDragForce();
        const rollingResistance: Vector3 = this.getRollingResistance();
        const brakeForce: Vector3 = this.getBrakeForce();
        resultingForce.add(dragForce).add(rollingResistance);

        if (this.isAcceleratorPressed) {
            resultingForce.add(this.direction.multiplyScalar(tractionForce));
        } else if (this.isBraking && this.speed.clone().normalize().dot(this.direction) > 0.2) {
            resultingForce.add(brakeForce);
        }

        return resultingForce;
    }

    private getAcceleration(): Vector3 {
        return this.getLongitudinalForce().divideScalar(MASS);
    }

    private getDeltaSpeed(deltaTime: number): Vector3 {
        return this.getAcceleration().multiplyScalar(deltaTime);
    }

    private getDeltaPosition(deltaTime: number): Vector3 {
        return this.speed.clone().multiplyScalar(deltaTime);
    }
}
