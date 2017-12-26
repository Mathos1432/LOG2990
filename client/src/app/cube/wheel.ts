const WHEEL_RADIUS: number = 0.45;      // 18 inches
const WHEEL_MASS: number = 10;          // 10 kg
const TIRE_FRICTION_COEFFICIENT: number = 1;

export class Wheel {
    private _angularVelocity: number;

    public get angularVelocity(): number {
        return this._angularVelocity;
    }

    public set angularVelocity(value: number) {
        this._angularVelocity = value;
    }

    public get inertia(): number {
        return this._mass * this._radius * this._radius / 2;
    }

    public get radius(): number {
        return this._radius;
    }

    public get frictionCoefficient(): number {
        return this._frictionCoefficient;
    }

    public constructor(
        private _mass: number = WHEEL_MASS,
        private _radius: number = WHEEL_RADIUS,
        private _frictionCoefficient: number = TIRE_FRICTION_COEFFICIENT) { }

    public update(speed: number): void {
        this._angularVelocity = speed / this.radius;
    }
}
