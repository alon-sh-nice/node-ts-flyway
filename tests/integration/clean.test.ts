import { describe, expect, it, beforeEach } from '@jest/globals';
import { cleanDatabase } from "./setup/setup";
import { Flyway } from "../../src";
import { basicMigrations, testConfiguration } from "./utility/utility";


describe("clean()", () => {

    beforeEach(() => {
        return cleanDatabase();
    });


    it('can perform a basic clean', async () => {

        const flyway = new Flyway(
            {
                ...testConfiguration,
                migrationLocations: [basicMigrations]
            }
        );

        await flyway.migrate();

        const response = await flyway.clean({advanced: {cleanDisabled: false}});


        expect(response.success).toBe(true);
    });



    it('clean will fail when it is disabled', async () => {

        const flyway = new Flyway(
            {
                ...testConfiguration,
                migrationLocations: [basicMigrations]
            }
        );

        await flyway.migrate();

        const response = await flyway.clean();

        expect(response.success).toBe(false);
    });

});
