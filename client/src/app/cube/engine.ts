import { Vector3 } from "three";
import { PI, MIN_TO_SEC } from "../constants";

const DEFAULT_DRIVE_RATIO: number = 3.27;
const DEFAULT_DOWNSHIFT_RPM: number = 2000;
const DEFAULT_MIN_RPM: number = 800;
const DEFAULT_SHIFT_RPM: number = 5000;
const DEFAULT_TRANSMISSION_EFFICIENCY: number = 0.7;
const DEFAULT_GEAR_RATIOS: number[] = [
    4.62,
    3.04,
    2.07,
    1.66,
    1.26,
    1.00
];

export class Engine {
    private _currentGear: number;
    private _rpm: number;

    public get currentGear(): number {
        return this._currentGear;
    }

    public get rpm(): number {
        return this._rpm;
    }

    public constructor(
        private gearRatios: number[] = DEFAULT_GEAR_RATIOS,
        private driveRatio: number = DEFAULT_DRIVE_RATIO,
        private downshiftRPM: number = DEFAULT_DOWNSHIFT_RPM,
        private minRPM: number = DEFAULT_MIN_RPM,
        private shiftRPM: number = DEFAULT_SHIFT_RPM,
        private transmissionEfficiency: number = DEFAULT_TRANSMISSION_EFFICIENCY) {

        this._currentGear = 0;
        this._rpm = this.minRPM;
    }

    public update(speed: Vector3, wheelRadius: number): void {
        this._rpm = this.getRPM(speed, wheelRadius);
        this.handleTransmission(speed, wheelRadius);
    }

    public getDriveTorque(): number {
        return this.getTorque() * this.driveRatio * this.gearRatios[this._currentGear] * this.transmissionEfficiency;
    }

    private handleTransmission(speed: Vector3, wheelRadius: number) {
        if (this._rpm > this.shiftRPM && this._currentGear < this.gearRatios.length) {
            this._currentGear++;
            this._rpm = this.getRPM(speed, wheelRadius);
        } else if (this._rpm <= this.downshiftRPM && this._currentGear > 0) {
            this._currentGear--;
            this._rpm = this.getRPM(speed, wheelRadius);
        }
    }

    private getRPM(speed: Vector3, wheelRadius: number): number {
        const wheelAngularVelocity: number = speed.length() / wheelRadius;
        let rpm: number = (wheelAngularVelocity / (PI * 2)) * MIN_TO_SEC * this.driveRatio * this.gearRatios[this._currentGear];
        rpm = rpm < this.minRPM ? this.minRPM : rpm;

        return rpm;
    }

    private getTorque(): number {
        let torque: number = 295;
        const maxTorque: number = 295;

        if (this._rpm <= 1500) {
            torque = this._rpm / 20 + 100;
        } else if (this._rpm <= 3000) {
            torque = (this._rpm - 1500) / 10 + 195;
        } else if (this._rpm <= 5000) {
            torque = maxTorque;
        } else {
            return maxTorque - (this._rpm / 6000);
        }

        return torque;
    }
}
