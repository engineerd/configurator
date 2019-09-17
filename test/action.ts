import "mocha";
import { assert } from "chai";

const testEnvVars = {
    INPUT_VERSION: 'v0.5.3',
};

describe("checking input parsing", function () {
    beforeEach(() => {
        for (const key in testEnvVars)
            process.env[key] = testEnvVars[key as keyof typeof testEnvVars]
    });

    it("correctly parse input", () => {
        assert.equal('v0.5.3', testEnvVars.INPUT_VERSION);
    });
});