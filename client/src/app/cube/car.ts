import { Vector3, BoxGeometry, Mesh, MeshBasicMaterial, FaceColors, Matrix4, Object3D, ObjectLoader, Euler } from "three";
import { Engine } from "./engine";
import { DEG_TO_RAD } from "../constants";
import { directiveDef } from "@angular/core/src/view/provider";
import { INTERNAL_BROWSER_DYNAMIC_PLATFORM_PROVIDERS } from "@angular/platform-browser-dynamic/src/platform_providers";
import { concat } from "rxjs/operators/concat";

const DRAG_CONSTANT = 0.45;
const BRAKE_POWER = -10000;
const ROLLING_RESISTANCE = 13;
const MASS = 1730;              // 3814 pounds
const WHEEL_RADIUS = 0.45;      // 18 inches
const WHEEL_MASS = 10;
const TIRE_FRICTION_COEFFICIENT = 1;
const WHEELBASE = 2.78;
const MESH_ROTATION = new Euler(0, Math.PI / 2, 0);
const MESH_SCALE = new Vector3(1, 1, 1);
const SLIP_CONSTANT = 30000;

export class Car extends Object3D {
    public isAcceleratorPressed: boolean;
    public mesh: Object3D;

    private engine: Engine;
    private isBraking: boolean;
    private steeringWheelDirection: number;
    private speed: Vector3;
    private weightRear: number;
    private rearWheelAngularVelocity: number;

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
        this.weightRear = 0.5;
        this.speed = new Vector3(0, 0, 0);
        this.rearWheelAngularVelocity = 0;
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
        this.mesh.scale.copy(MESH_SCALE);
        this.add(this.mesh);
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
        if (this.isAcceleratorPressed) {
            this.rearWheelAngularVelocity += this.getAngularAcceleration() * deltaTime;
        }

        this.engine.update(this.speed, WHEEL_RADIUS);
        this.weightRear = this.getWeightDistribution();

        this.speed.add(this.getDeltaSpeed(deltaTime));
        this.mesh.position.add(this.getDeltaPosition(deltaTime));
    }

    private getWeightDistribution(): number {
        const acceleration = this.getAcceleration().length();
        const distribution = 0.5 * MASS + (1 / WHEELBASE) * MASS * acceleration;
        return Math.min(Math.max(0, distribution), 1);
    }

    public getTractionForce(): number {
        // TODO: determine if force has the right sign.
        const force = this.direction.clone().multiplyScalar(this.getEngineForce());
        const slipPeak = Math.min(SLIP_CONSTANT * this.getSlipRatio(), 3000);

        const maximumForce = slipPeak * this.weightRear;
        return maximumForce > force.length() ? maximumForce : force.length();
    }

    public getSlipRatio(): number {
        const slip = (this.rearWheelAngularVelocity * WHEEL_RADIUS - this.direction.x) / Math.abs(this.direction.x);
        return slip;
    }

    private getAngularAcceleration(): number {
        return this.getTotalTorque() / (this.getWheelInertia() * 2);
    }

    private getWheelInertia(): number {
        return WHEEL_MASS * WHEEL_RADIUS * WHEEL_RADIUS / 2;
    }

    public getBrakeForce(): Vector3 {
        return this.direction.multiplyScalar(BRAKE_POWER);
    }

    public getBrakeTorque(): number {
        // TODO: determine sign of the force.
        return this.getBrakeForce().length() * WHEEL_RADIUS;
    }

    public getTractionTorque(): number {
        return this.getTractionForce() * WHEEL_RADIUS;
    }

    public getTotalTorque(): number {
        return this.engine.getDriveTorque() + this.getTractionTorque() * 2 + this.getBrakeTorque();
    }

    public getEngineForce(): number {
        return this.engine.getDriveTorque() / WHEEL_RADIUS;
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
