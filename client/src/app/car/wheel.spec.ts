import { TestBed, inject } from "@angular/core/testing";
import { Wheel, DEFAULT_WHEEL_MASS, DEFAULT_WHEEL_RADIUS, DEFAULT_FRICTION_COEFFICIENT } from "./wheel";

describe("Wheel", () => {
    it("should be instantiated correctly using default constructor", () => {
        const wheel = new Wheel();
        expect(wheel).toBeDefined();
    });

    it("should be instantiated correctly when passing parameters", () => {
        const mass = 100;
        const radius = 2;
        const frictionCoefficient = 0.2;
        const wheel = new Wheel(mass, radius, frictionCoefficient);
        expect(wheel).toBeDefined();
        expect(wheel.frictionCoefficient).toBeCloseTo(frictionCoefficient);
        expect(wheel.radius).toBeCloseTo(radius);
        expect(wheel.mass).toBeCloseTo(mass);
        expect(wheel.angularVelocity).toBeCloseTo(0);
    });

    it("can't be instantiated with a negative mass", () => {
        const mass = -100;
        const wheel = new Wheel(mass);
        expect(wheel).toBeDefined();
        expect(wheel.mass).toBeCloseTo(DEFAULT_WHEEL_MASS);
    });

    it("can't be instantiated with a negative friction coefficient", () => {
        const friction = -100;
        const wheel = new Wheel(10, 10, friction);
        expect(wheel).toBeDefined();
        expect(wheel.frictionCoefficient).toBeCloseTo(DEFAULT_FRICTION_COEFFICIENT);
    });

    it("can't be instantiated with a negative radius", () => {
        const radius = -100;
        const wheel = new Wheel(10, radius);
        expect(wheel).toBeDefined();
        expect(wheel.radius).toBeCloseTo(DEFAULT_WHEEL_RADIUS);
    });

    it("inertia should be properly calculated", () => {
        const mass = 100;
        const radius = 1;
        const expectedInertia = 50;
        const wheel = new Wheel(mass, radius);
        expect(wheel.inertia).toBeCloseTo(expectedInertia);
    });

    it("angular velocity is properly modified should be properly calculated", () => {
        const wheel = new Wheel();
        expect(wheel.angularVelocity).toBeCloseTo(0);

        const newAngularVelocity = 100;
        wheel.angularVelocity = newAngularVelocity;
        expect(wheel.angularVelocity).toBeCloseTo(newAngularVelocity);
    });
});
