const WHEEL_RADIUS = 0.45;      // 18 inches
const WHEEL_MASS = 10;          // 10 kg
const TIRE_FRICTION_COEFFICIENT = 1;

export class Wheel {
    private _angularVelocity: number;

    public get angularVelocity(): number {
        return this._angularVelocity;
    }

    public set angularVelocity(value: number) {
        this._angularVelocity = value;
    }

    public get inertia(): number {
        return this._mass * this._radius * this._radius / 2
    }

    public get radius(): number {
        return this._radius;
    }

    public get frictionCoefficient(): number {
        return this._frictionCoefficient;
    }

    public constructor(
        private _mass = WHEEL_MASS,
        private _radius = WHEEL_RADIUS,
        private _frictionCoefficient = TIRE_FRICTION_COEFFICIENT) { }

    public update(speed: number) {
        this._angularVelocity = speed / this.radius;
    }
}