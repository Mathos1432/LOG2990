import { TestBed, inject } from "@angular/core/testing";
import { Engine } from "./engine";

describe("Engine", () => {
    it("should be instantiable using default constructor", () => {
        const engine = new Engine();
        expect(engine).toBeDefined();
        expect(engine.currentGear).toBe(0);
    });

    it("should be instantiated correctly when passing parameters", () => {
        const gearRatios = [6, 5, 4, 3, 2];
        const driveRatio = 2;
        const downShiftRPM = 2000;
        const minimumRPM = 100;
        const shiftRPM = 4000;
        const transmissionEfficiency = 0.5;
        const engine = new Engine(gearRatios, driveRatio, downShiftRPM, minimumRPM, shiftRPM, transmissionEfficiency);
        expect(engine).toBeDefined();
        expect(engine.currentGear).toBe(0);
        expect(engine.rpm).toBeGreaterThanOrEqual(minimumRPM);
    });

    it("should check validity of input parameters", () => {
        fail();
    });

    it("torque", () => {
        fail();
    });

    it("get rpm", () => {
        fail();
    });
});
