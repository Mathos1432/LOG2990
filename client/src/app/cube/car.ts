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
import { DEG_TO_RAD, MS_TO_SECONDS, GRAVITY } from "../constants";
import { directiveDef } from "@angular/core/src/view/provider";
import { INTERNAL_BROWSER_DYNAMIC_PLATFORM_PROVIDERS } from "@angular/platform-browser-dynamic/src/platform_providers";
import { concat } from "rxjs/operators/concat";
import { Wheel } from "./wheel";

const DEFAULT_DRAG_COEFFICIENT: number = -0.6;
const DEFAULT_ROLLING_RESISTANCE: number = 30 * DEFAULT_DRAG_COEFFICIENT;
const DEFAULT_MASS: number = 1515;
const DEFAULT_WHEELBASE: number = 2.78;
const SLIP_CONSTANT: number = 300;
const MAXIMUM_STEERING_ANGLE: number = Math.PI / 16;
const INITIAL_MODEL_ROTATION: Euler = new Euler(0, Math.PI / 2, 0);


export class Car extends Object3D {
    public isAcceleratorPressed: boolean;
    public mesh: Object3D;

    private readonly engine: Engine;
    private readonly mass: number;
    private readonly rearWheel: Wheel;
    private readonly wheelbase: number;
    private readonly dragCoefficient: number;
    private readonly rollingResistanceCoefficient: number;

    private _speed: Vector3;
    private isBraking: boolean;
    private modelLoaded: boolean;
    private steeringWheelDirection: number;
    private weightRear: number;

    private get direction(): Vector3 {
        const rotationMatrix: Matrix4 = new Matrix4();
        const carDirection: Vector3 = new Vector3(0, 0, -1);

        rotationMatrix.extractRotation(this.mesh.matrix);
        carDirection.applyMatrix4(rotationMatrix);

        return carDirection;
    }

    public get speed(): Vector3 {
        return this._speed.clone();
    }

    public get currentGear(): number {
        return this.engine.currentGear;
    }

    public constructor(
        engine: Engine = new Engine(),
        rearWheel: Wheel = new Wheel(),
        wheelbase: number = DEFAULT_WHEELBASE,
        mass: number = DEFAULT_MASS,
        dragCoefficient: number = DEFAULT_DRAG_COEFFICIENT,
        rollingResistanceCoefficient: number = DEFAULT_ROLLING_RESISTANCE) {
        super();

        this.engine = engine;
        this.rearWheel = rearWheel;
        this.wheelbase = wheelbase;
        this.mass = mass;
        this.dragCoefficient = this.dragCoefficient;
        this.rollingResistanceCoefficient = rollingResistanceCoefficient;

        this.isBraking = false;
        this.modelLoaded = false;
        this.steeringWheelDirection = 0;
        this.weightRear = 0.5;
        this._speed = new Vector3(0, 0, 0);
    }

    public async init(): Promise<void> {
        this.mesh = await this.load();
        this.mesh.setRotationFromEuler(INITIAL_MODEL_ROTATION);
        this.add(this.mesh);
    }

    public steerLeft(): void {
        this.steeringWheelDirection = MAXIMUM_STEERING_ANGLE;
    }

    public steerRight(): void {
        this.steeringWheelDirection = -MAXIMUM_STEERING_ANGLE;
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
        deltaTime = deltaTime / MS_TO_SECONDS;

        // Move to car coordinates
        const rotationMatrix: Matrix4 = new Matrix4();
        rotationMatrix.extractRotation(this.mesh.matrix);
        const rotationQuaternion: Quaternion = new Quaternion();
        rotationQuaternion.setFromRotationMatrix(rotationMatrix);
        const angle: Euler = this.mesh.rotation;
        this._speed.applyMatrix4(rotationMatrix);

        // Physics calculations
        this.physicsUpdate(deltaTime);

        // Move back to world coordinates
        this._speed = this.speed.applyQuaternion(rotationQuaternion.inverse());

        // Angular rotation of the car
        const R: number = DEFAULT_WHEELBASE / Math.sin(this.steeringWheelDirection * deltaTime);
        const omega: number = this._speed.length() / R;
        this.mesh.rotateY(omega);
    }

    private physicsUpdate(deltaTime: number): void {
        this.rearWheel.angularVelocity += this.getAngularAcceleration() * deltaTime;
        this.engine.update(this._speed, this.rearWheel.radius);
        this.weightRear = this.getWeightDistribution();
        this._speed.add(this.getDeltaSpeed(deltaTime));
        this._speed.setLength(this._speed.length() <= 0.05 ? 0 : this._speed.length());
        this.mesh.position.add(this.getDeltaPosition(deltaTime));
        this.rearWheel.update(this._speed.length());
    }

    // TODO: move loading code outside of car class.
    private async load(): Promise<Object3D> {
        return new Promise<Object3D>((resolve, reject) => {
            const loader: ObjectLoader = new ObjectLoader();
            loader.load("../../assets/camero/camero-2010-low-poly.json", (object) => {
                this.modelLoaded = true;
                resolve(object);
            });
        });
    }

    private getWeightDistribution(): number {
        const acceleration: number = this.getAcceleration().length();
        const distribution: number = this.mass * 0.5 + (1 / this.wheelbase) * this.mass * acceleration;

        return Math.min(Math.max(0, distribution), 1);
    }

    private getTractionForce(): number {
        const force: Vector3 = this.direction.clone().multiplyScalar(this.getEngineForce());
        const slipPeak: number = Math.min(SLIP_CONSTANT * this.getSlipRatio(), 6000);
        const maximumForce: number = slipPeak * this.weightRear;
        return maximumForce > force.length() ? maximumForce : force.length();
    }

    private getSlipRatio(): number {
        return this.rearWheel.getSlipRatio(this._speed);
    }

    private getAngularAcceleration(): number {
        return this.getTotalTorque() / (this.rearWheel.inertia * 2);
    }

    private getBrakeForce(): Vector3 {
        return this.direction.multiplyScalar(this.rearWheel.frictionCoefficient * this.mass * GRAVITY);
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
        return this.speed.multiplyScalar(this.dragCoefficient * this.speed.length());
    }

    private getRollingResistance(): Vector3 {
        return this.speed.multiplyScalar(this.rollingResistanceCoefficient);
    }

    private getLongitudinalForce(): Vector3 {
        if (!this.modelLoaded) {
            return new Vector3(0, 0, 0);
        }
        const resultingForce: Vector3 = new Vector3();

        const tractionForce: number = this.getTractionForce();
        const dragForce: Vector3 = this.getDragForce();
        const rollingResistance: Vector3 = this.getRollingResistance();
        const brakeForce: Vector3 = this.getBrakeForce();
        resultingForce.add(dragForce).add(rollingResistance);

        if (this.isAcceleratorPressed) {
            resultingForce.add(this.direction.multiplyScalar(tractionForce));
        } else if (this.isBraking && this.speed.normalize().dot(this.direction) > 0.2) {
            resultingForce.add(brakeForce);
        }

        return resultingForce;
    }

    private getAcceleration(): Vector3 {
        return this.getLongitudinalForce().divideScalar(this.mass);
    }

    private getDeltaSpeed(deltaTime: number): Vector3 {
        return this.getAcceleration().multiplyScalar(deltaTime);
    }

    private getDeltaPosition(deltaTime: number): Vector3 {
        return this.speed.multiplyScalar(deltaTime);
    }
}
