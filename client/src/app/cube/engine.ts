import { Vector3 } from "three";
import { MIN_TO_SEC } from "../constants";

const DEFAULT_DRIVE_RATIO: number = 3.27;
const DEFAULT_DOWNSHIFT_RPM: number = 2500;
const DEFAULT_MIN_RPM: number = 800;
const DEFAULT_SHIFT_RPM: number = 5500;
const DEFAULT_TRANSMISSION_EFFICIENCY: number = 0.7;
const DEFAULT_MAX_RPM: number = 7000;
/* tslint:disable: no-magic-numbers */
const DEFAULT_GEAR_RATIOS: number[] = [
    4.4,
    2.59,
    1.8,
    1.34,
    1,
    0.75
];
/* tslint:enable: no-magic-numbers */

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
        if (this._rpm > this.shiftRPM && this._currentGear < this.gearRatios.length - 1) {
            this._currentGear++;
            this._rpm = this.getRPM(speed, wheelRadius);
        } else if (this._rpm <= this.downshiftRPM && this._currentGear > 0) {
            this._currentGear--;
            this._rpm = this.getRPM(speed, wheelRadius);
        }
    }

    private getRPM(speed: Vector3, wheelRadius: number): number {
        const wheelAngularVelocity: number = speed.length() / wheelRadius;
        // tslint:disable-next-line: no-magic-numbers
        let rpm: number = (wheelAngularVelocity / (Math.PI * 2)) * MIN_TO_SEC * this.driveRatio * this.gearRatios[this._currentGear];
        rpm = rpm < this.minRPM ? this.minRPM : rpm;

        return rpm > DEFAULT_MAX_RPM ? DEFAULT_MAX_RPM : rpm;
    }

    private getTorque(): number {
        // Polynomial function to approximage a torque curve from the rpm.
        // tslint:disable-next-line: no-magic-numbers
        const torque = -0.0000000000000000001 * Math.pow(this._rpm, 6)
            + 0.000000000000003 * Math.pow(this._rpm, 5)
            - 0.00000000003 * Math.pow(this._rpm, 4)
            + 0.0000002 * Math.pow(this.rpm, 3)
            - 0.0006 * Math.pow(this._rpm, 2)
            + 0.9905 * this._rpm
            - 371.88;
        return torque;
    }
}
