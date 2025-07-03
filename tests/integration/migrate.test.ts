import { describe, expect, it, beforeEach, afterEach } from '@jest/globals';
import { cleanDatabase } from "./setup/setup";
import { Flyway, FlywayCliStrategy } from "../../src";
import {
    basicMigrations,
    disconnectDatabase,
    failingMigrations,
    getDatabaseConnection,
    missingMigrations,
    multipleSchemaMigrations,
    outOfOrderMigrations,
    testConfiguration
} from "./utility/utility";
import { DEFAULT_FLYWAY_VERSION } from "../../src/internal/defaults";
import { DirectFlywayCliDownloader } from "../../src/cli/download/downloader/flyway-cli-downloader";
import _temp from "temp";
import { enableLogging } from "../../src/utility/logger";

describe("migrate()", () => {

    beforeEach(async () => {
        await cleanDatabase();
    });

    afterEach(async () => {
        await disconnectDatabase();
    });

    it('can perform a basic migrate', async () => {
        const flyway = new Flyway({
            ...testConfiguration,
            migrationLocations: [basicMigrations]
        });
        const response = await flyway.migrate();
        expect(response.success).toBe(true);
    });

    it('can perform a basic migrate specifying connect retries', async () => {
        const flyway = new Flyway({
            ...testConfiguration,
            migrationLocations: [basicMigrations],
            advanced: {
                connectRetries: 1,
                connectRetriesInterval: 2
            }
        });
        const response = await flyway.migrate();
        expect(response.success).toBe(true);
    });

    it('can perform a basic migrate with initial sql', async () => {
        const flyway = new Flyway({
            ...testConfiguration,
            defaultSchema: "random",
            migrationLocations: [basicMigrations],
            advanced: {
                createSchemas: true,
                // initSql: "CREATE TABLE public.some_table (id INTEGER PRIMARY KEY, some_column TEXT NOT NULL);"
            }
        });
        const response = await flyway.migrate();
        expect(response.success).toBe(true);
    });

    it('can perform out of order migrations', async () => {
        const flyway = new Flyway({
            ...testConfiguration,
            migrationLocations: [`${outOfOrderMigrations}/part_1`]
        });
        await flyway.migrate();
        const response = await flyway.migrate({
            migrationLocations: [`${outOfOrderMigrations}/part_1`, `${outOfOrderMigrations}/part_2`],
            advanced: {
                applyNewMigrationsOutOfOrder: true
            }
        });
        expect(response.success).toBe(true);
    });

    it('can use config files', async () => {
        const flyway = new Flyway({
            url: testConfiguration.url,
            user: testConfiguration.user,
            migrationLocations: [basicMigrations],
            advanced: {
                configFileEncoding: "UTF-8",
                configFiles: ["test/integration/config-files/example-1.conf", "test/integration/config-files/example-2.conf"],
                connectRetries: 2,
                connectRetriesInterval: 2
            }
        });
        const response = await flyway.migrate();
        expect(response.success).toBe(true);
    });

    it('can group pending migrations', async () => {
        const flyway = new Flyway({
            ...testConfiguration,
            migrationLocations: [basicMigrations]
        });
        const response1 = await flyway.migrate({
            advanced: {
                groupPendingMigrations: true,
                migrationEncoding: "UTF-8",
                installedBy: "Dom Dinnes",
                mixed: true
            }
        });
        expect(response1.success).toBe(true);
        const response2 = await flyway.migrate({
            migrationLocations: [failingMigrations],
            advanced: {
                groupPendingMigrations: true,
                migrationEncoding: "UTF-8",
                installedBy: "Dom Dinnes",
                mixed: true
            }
        });
        expect(response2.success).toBe(false);
    });

    it('can specify to fail on missing locations', async () => {
        const flyway = new Flyway({
            ...testConfiguration,
            migrationLocations: [basicMigrations, missingMigrations],
            advanced: {
                failOnMissingMigrationLocations: true
            }
        });
        const response = await flyway.migrate();
        expect(response.success).toBe(false);
    });

    it('can specify the schema history table', async () => {
        const flyway = new Flyway({
            ...testConfiguration,
            migrationLocations: [basicMigrations],
            advanced: {
                schemaHistoryTable: "renamed_schema_history"
            }
        });
        const response = await flyway.migrate();
        expect(response.success).toBe(true);
    });

    it('can specify the migration target', async () => {
        const flyway = new Flyway({
            ...testConfiguration,
            migrationLocations: [basicMigrations],
            advanced: {
                target: "2"
            }
        });
        const response = await flyway.migrate();
        expect(response.success).toBe(true);
    });

    it('can perform migrations across multiple schemas', async () => {
        const flyway = new Flyway({
            ...testConfiguration,
            migrationLocations: [multipleSchemaMigrations],
            advanced: {
                schemas: ["random"]
            }
        });
        const response = await flyway.migrate();
        expect(response.success).toBe(true);
    });

    it('can migrate a schema when configuration contains shell-expansion characters', async () => {
        const flyway = new Flyway({
            ...testConfiguration,
            migrationLocations: [basicMigrations],
            advanced: {
                schemas: ["__test_$PWD_schema"]
            }
        });
        await flyway.migrate();
        const connection = await getDatabaseConnection(testConfiguration.password, testConfiguration.port);
        const results = await connection.query(`
            SELECT CATALOG_NAME, SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = '__test_$PWD_schema'
        `);
        expect(results.rowCount).toBe(1);
    });

    it('can download a Flyway CLI and perform a basic migration when incomplete download exists in CLI', async () => {
        const defaultVersion = DEFAULT_FLYWAY_VERSION;
        enableLogging("default");
        const flywayDownloader = new DirectFlywayCliDownloader();
        const temp = _temp.track();
        await flywayDownloader.downloadFlywayCli(defaultVersion, temp.dir);
        const flyway = new Flyway({
            ...testConfiguration,
            migrationLocations: [basicMigrations]
        }, {
            flywayCliStrategy: FlywayCliStrategy.DOWNLOAD_CLI_ONLY
        });
        const response = await flyway.migrate();
        expect(response.success).toBe(true);
    });
});
