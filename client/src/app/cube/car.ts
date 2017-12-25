import { Vector3, BoxGeometry, Mesh, MeshBasicMaterial, FaceColors, Matrix4, Object3D, ObjectLoader, Euler } from "three";
import { Engine } from "./engine";
import { DEG_TO_RAD } from "../constants";

const AERODYNAMIC_DRAG = -0.4;
const BRAKE_POWER = 10000;
const ROLLING_RESISTANCE = -0.4;
const MASS = 1730;              // 3814 pounds
const WHEEL_RADIUS = 0.4064;    // 16 inches

const MESH_ROTATION = new Euler(0, Math.PI / 2, 0);
const MESH_SCALE = new Vector3(1, 1, 1);

export class Car extends Object3D {
    public isAcceleratorPressed: boolean;
    public mesh: Object3D;

    private engine: Engine;
    private isBraking: boolean;
    private steeringWheelDirection: number;
    private speed: Vector3;

    private get direction(): Vector3 {
        const rotationMatrix = new Matrix4();
        rotationMatrix.extractRotation(this.mesh.matrix);
        const carDirection = new Vector3(0, 0, 1);
        carDirection.applyMatrix4(rotationMatrix);

        return carDirection;
    }

    public constructor() {
        super();
        this.isBraking = false;
        this.steeringWheelDirection = 0;
        this.engine = new Engine();
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
    }
}
