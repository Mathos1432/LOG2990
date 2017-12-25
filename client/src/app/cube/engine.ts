import { Vector3 } from "three";
import { PI, MIN_TO_SEC } from "../constants";

const GEAR_RATIOS = [
    4.06,
    2.3,
    1.6,
    1.25,
    1.00,
    0.8
];
const DRIVE_RATIO = 3.8;

const DOWNSHIFT_RPM = 1000;
const MIN_RPM = 500;
const SHIFT_RPM = 5000;

export class Engine {
    private currentGear: number;
    private RPM: number;        // Rotations per minute

    public constructor() {
        this.currentGear = 0;
        this.RPM = MIN_RPM;
    }

    public update(speed: Vector3, wheelRadius: number) {
        let currentRPM = this.getRPM(speed, wheelRadius);

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
        const wheelAngularVelocity = speed.length() / wheelRadius;
        let rpm = (wheelAngularVelocity / (PI * 2)) * MIN_TO_SEC * DRIVE_RATIO * GEAR_RATIOS[this.currentGear];
        rpm = rpm < MIN_RPM ? MIN_RPM : rpm;

        return rpm;
    }

    public getWheelTorque() {
        const wheelTorque = this.getTorque() * DRIVE_RATIO * GEAR_RATIOS[this.currentGear];

        return wheelTorque;
    }

    private getTorque() {
        let torque: number;
        if (this.RPM <= 1000) {
            torque = this.RPM / 1000 + 350;
        } else if (this.RPM <= 4500) {
            torque = (this.RPM / 50) + 350;
        } else if (this.RPM <= 6000) {
            torque = 450;
        } else {
            return 450 - (this.RPM / 6000);
        }
        
        return torque;
    }
}
