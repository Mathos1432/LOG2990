import { Vector3, BoxGeometry, Mesh, MeshBasicMaterial, FaceColors, Matrix4, Object3D, ObjectLoader, Euler, Quaternion, Matrix3 } from "three";
import { Engine } from "./engine";
import { DEG_TO_RAD } from "../constants";
import { directiveDef } from "@angular/core/src/view/provider";
import { INTERNAL_BROWSER_DYNAMIC_PLATFORM_PROVIDERS } from "@angular/platform-browser-dynamic/src/platform_providers";
import { concat } from "rxjs/operators/concat";
import { Wheel } from "./wheel";

const DRAG_CONSTANT = 0.45;
const BRAKE_POWER = -10000;
const ROLLING_RESISTANCE = 13.45;
const MASS = 1515;              // 3339 pounds

const WHEELBASE = 2.78;
const MESH_ROTATION = new Euler(0, Math.PI / 2, 0);
const SLIP_CONSTANT = 300;
const STEERING_ANGLE = Math.PI / 16;
const GRAVITY = -9.81;          // m/s

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
        const rotationMatrix = new Matrix4();
        rotationMatrix.extractRotation(this.mesh.matrix);
        const carDirection = new Vector3(0, 0, -1);
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

    private async load(): Promise<Object3D> {
        return new Promise<Object3D>((resolve, reject) => {
            const loader = new ObjectLoader();
            loader.load("../../assets/camero/camero-2010-low-poly.json", (object) => {
                resolve(object);
            });
        });
    }

    public async init() {
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

    public update(deltaTime: number) {
        deltaTime = deltaTime / 1000;

        // Move to origin
        let rotationMatrix = new Matrix4();
        rotationMatrix.extractRotation(this.mesh.matrix);
        let rotationQuaternion = new Quaternion();
        rotationQuaternion.setFromRotationMatrix(rotationMatrix);
        let angle = this.mesh.rotation;
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
        const R = WHEELBASE / Math.sin(this.steeringWheelDirection * deltaTime);
        const omega = this.speed.length() / R;
        this.mesh.rotateY(omega)
    }

    private getWeightDistribution(): number {
        const acceleration = this.getAcceleration().length();
        const distribution = 0.5 * MASS + (1 / WHEELBASE) * MASS * acceleration;
        return Math.min(Math.max(0, distribution), 1);
    }

    public getTractionForce(): number {
        const force = this.direction.clone().multiplyScalar(this.getEngineForce());
        const slipPeak = Math.min(SLIP_CONSTANT * this.getSlipRatio(), 6000);
        const maximumForce = slipPeak * this.weightRear;
        return maximumForce > force.length() ? maximumForce : force.length();
    }

    public getSlipRatio(): number {
        return (this.rearWheel.angularVelocity * this.rearWheel.radius - this.direction.x) / Math.abs(this.direction.x);
    }

    private getAngularAcceleration(): number {
        return this.getTotalTorque() / (this.rearWheel.inertia * 2);
    }

    public getBrakeForce(): Vector3 {
        return this.direction.multiplyScalar(this.rearWheel.frictionCoefficient * MASS * GRAVITY)
    }

    public getBrakeTorque(): number {
        return this.getBrakeForce().length() * this.rearWheel.radius;
    }

    public getTractionTorque(): number {
        return this.getTractionForce() * this.rearWheel.radius;
    }

    public getTotalTorque(): number {
        return this.engine.getDriveTorque() + this.getTractionTorque() * 2 + this.getBrakeTorque();
    }

    public getEngineForce(): number {
        return this.engine.getDriveTorque() / this.rearWheel.radius;
    }

    public getDragForce(): Vector3 {
        return this.speed.clone().multiplyScalar(DRAG_CONSTANT * this.speed.length());
    }

    public getRollingResistance(): Vector3 {
        return this.speed.clone().multiplyScalar(ROLLING_RESISTANCE);
    }

    public getLongitudinalForce(): Vector3 {
        const resultingForce = new Vector3();

        const tractionForce = this.getTractionForce();
        const dragForce = this.getDragForce();
        const rollingResistance = this.getRollingResistance();
        const brakeForce = this.getBrakeForce();
        resultingForce.add(dragForce).add(rollingResistance);

        if (this.isAcceleratorPressed) {
            resultingForce.add(this.direction.multiplyScalar(tractionForce));
        }
        else if (this.isBraking && this.speed.clone().normalize().dot(this.direction) > 0.2) {
            resultingForce.add(brakeForce);
        }
        return resultingForce;
    }

    public getAcceleration(): Vector3 {
        return this.getLongitudinalForce().divideScalar(MASS);
    }

    public getDeltaSpeed(deltaTime: number): Vector3 {
        return this.getAcceleration().multiplyScalar(deltaTime);
    }

    public getDeltaPosition(deltaTime: number): Vector3 {
        return this.speed.clone().multiplyScalar(deltaTime);
    }

}
