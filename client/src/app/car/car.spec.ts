import { Car } from "./car";
import { Engine } from "./engine";

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
});
