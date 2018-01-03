import { Car, DEFAULT_WHEELBASE, DEFAULT_MASS, DEFAULT_DRAG_COEFFICIENT } from "./car";
import { Engine } from "./engine";
import { Wheel } from "./wheel";

/* tslint:disable: no-magic-numbers */
class MockEngine extends Engine {
    public getDriveTorque(): number {
        return 10000;
    }
}

describe("Car", () => {
    let car: Car;

    beforeEach(async (done: () => void) => {
        car = new Car(new MockEngine());
        await car.init();

        car.isAcceleratorPressed = true;
        car.update(20);
        car.isAcceleratorPressed = false;
        done();
    });

    it("should be instantiable using default constructor", () => {
        car = new Car(new MockEngine());
        expect(car).toBeDefined();
        expect(car.speed.length()).toBe(0);
    });

    it("should accelerate when accelerator is pressed", () => {
        const initialSpeed: number = car.speed.length();
        car.isAcceleratorPressed = true;
        car.update(20);
        expect(car.speed.length()).toBeGreaterThan(initialSpeed);
    });

    it("should decelerate when brake is pressed", () => {
        car.isAcceleratorPressed = true;
        car.update(40);
        car.isAcceleratorPressed = false;

        const initialSpeed: number = car.speed.length();
        car.brake();
        car.update(20);
        expect(car.speed.length()).toBeLessThan(initialSpeed);
    });

    it("should decelerate without brakes", () => {
        const initialSpeed: number = car.speed.length();
        // TODO: remove air drag and rolling resistance for this test.
        car.releaseBrakes();
        car.update(20);
        expect(car.speed.length()).toBeLessThan(initialSpeed);
    });

    it("should turn left when left turn key is pressed", () => {
        const initialAngle: number = car.angle;
        car.isAcceleratorPressed = true;
        car.steerLeft();
        car.update(20);
        expect(car.angle).toBeLessThan(initialAngle);
    });

    it("should turn right when right turn key is pressed", () => {
        const initialAngle: number = car.angle;
        car.isAcceleratorPressed = true;
        car.steerRight();
        car.update(20);
        expect(car.angle).toBeLessThan(initialAngle);
    });

    it("should not turn when steering keys are released", () => {
        car.isAcceleratorPressed = true;
        car.steerRight();
        car.update(20);

        const initialAngle: number = car.angle;
        car.releaseSteering();
        car.update(20);
        expect(car.angle).toBe(initialAngle);
    });

    it("should use default engine parameter when none is provided", () => {
        car = new Car(undefined);
        expect(car["engine"]).toBeDefined();
    });

    it("should use default Wheel parameter when none is provided", () => {
        car = new Car(new MockEngine(), undefined);
        expect(car["rearWheel"]).toBeDefined()  ;
    });

    it("should check validity of wheelbase parameter", () => {
        car = new Car(new MockEngine(), new Wheel(), 0);
        expect(car["wheelbase"]).toBe(DEFAULT_WHEELBASE);
    });

    it("should check validity of mass parameter", () => {
        car = new Car(new MockEngine(), new Wheel(), DEFAULT_WHEELBASE, 0);
        expect(car["mass"]).toBe(DEFAULT_MASS);
    });

    it("should check validity of dragCoefficient parameter", () => {
        car = new Car(new MockEngine(), new Wheel(), DEFAULT_WHEELBASE, DEFAULT_MASS, -10);
        expect(car["dragCoefficient"]).toBe(DEFAULT_DRAG_COEFFICIENT);
    });
});
