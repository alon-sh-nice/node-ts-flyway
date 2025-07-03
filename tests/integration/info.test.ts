import { describe, expect, it, beforeEach } from '@jest/globals';
import { cleanDatabase } from "./setup/setup";
import { Flyway } from "../../src";
import { basicMigrations, testConfiguration } from "./utility/utility";


describe("info()", () => {

    beforeEach(() => {
        return cleanDatabase();
    });

    it('can get info on applied migrations', async () => {
        const flyway = new Flyway({
            ...testConfiguration,
            migrationLocations: [basicMigrations]
        });
        await flyway.migrate();
        const response = await flyway.info();
        expect(response.success).toBe(true);
    });
});
