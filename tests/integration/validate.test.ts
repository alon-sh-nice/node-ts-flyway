import { describe, expect, it, beforeEach } from '@jest/globals';
import { cleanDatabase } from "./setup/setup";
import { Flyway } from "../../src";
import { migrationsToBeValidated, testConfiguration } from "./utility/utility";


describe("validate()", () => {

    beforeEach(() => {
        return cleanDatabase();
    });


    it('can validate migrations passing validation', async () => {

        const flyway = new Flyway(
            {
                ...testConfiguration,
                migrationLocations: [`${migrationsToBeValidated}/part_1`]
            }
        );

        const response = await flyway.validate();

        expect(response.success).toBe(true);
    });



    it('can validate migrations failing validation', async () => {

        const flyway = new Flyway(
            {
                ...testConfiguration,
                migrationLocations: [`${migrationsToBeValidated}/part_2`]
            }
        );

        const response = await flyway.validate();

        expect(response.success).toBe(true);
    });

});
