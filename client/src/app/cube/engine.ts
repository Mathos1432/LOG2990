import { Vector3 } from "three";
import { PI, MIN_TO_SEC } from "../constants";

const GEAR_RATIOS: number[] = [
    4.62,
    3.04,
    2.07,
    1.66,
    1.26,
    1.00
];
const DRIVE_RATIO: number = 3.27;

const DOWNSHIFT_RPM: number = 1000;
const MIN_RPM: number = 800;
const SHIFT_RPM: number = 5000;
const TRANSMISSION_EFFICIENCY: number = 1;

export class Engine {
    private currentGear: number;
    private RPM: number;        // Rotations per minute

    public constructor() {
        this.currentGear = 0;
        this.RPM = MIN_RPM;
    }

    public update(speed: Vector3, wheelRadius: number): void {
        let currentRPM: number = this.getRPM(speed, wheelRadius);

        if (currentRPM > SHIFT_RPM && this.currentGear < GEAR_RATIOS.length) {
            this.currentGear++;
            currentRPM = this.getRPM(speed, wheelRadius);
        } else if (currentRPM <= DOWNSHIFT_RPM && this.currentGear > 0) {
            this.currentGear--;
            currentRPM = this.getRPM(speed, wheelRadius);
        }

        this.RPM = currentRPM;
    }

    private getRPM(speed: Vector3, wheelRadius: number): number {
        const wheelAngularVelocity: number = speed.length() / wheelRadius;
        let rpm: number = (wheelAngularVelocity / (PI * 2)) * MIN_TO_SEC * DRIVE_RATIO * GEAR_RATIOS[this.currentGear];
        rpm = rpm < MIN_RPM ? MIN_RPM : rpm;

        return rpm;
    }

    public getDriveTorque(): number {
        return this.getTorque() * DRIVE_RATIO * GEAR_RATIOS[this.currentGear] * TRANSMISSION_EFFICIENCY;
    }

    private getTorque(): number {
        let torque: number = 295;
        const maxTorque: number = 295;

        if (this.RPM <= 1500) {
            torque = this.RPM / 20 + 100;
        } else if (this.RPM <= 3000) {
            torque = (this.RPM - 1500) / 10 + 195;
        } else if (this.RPM <= 5000) {
            torque = maxTorque;
        } else {
            return maxTorque - (this.RPM / 6000);
        }

        return torque;
    }
}
