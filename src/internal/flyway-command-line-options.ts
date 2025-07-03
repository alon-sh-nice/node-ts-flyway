import { isMap } from "util/types";
import { CommandLineOptionMap, FlywayAdvancedConfig, FlywayBasicConfig, FlywayConfig } from "../types/types";
import { platform } from "os";

export class FlywayCommandLineOptions {
    constructor(private readonly options: FlywayCommandLineOption[]) {}

    public static build(config: FlywayConfig): FlywayCommandLineOptions {
        const options = CommandLineOptionGenerator.generateCommandLineOptions(config);
        return new FlywayCommandLineOptions(options);
    }

    public getCommandLineOptions(): string[] {
        return this.options.map(option => option.convertToCommandLineString());
    }

    public convertToCommandLineString(): string {
        return this.options.map(option => option.convertToCommandLineString()).join(" ");
    }
}

interface FlywayCommandLineOption {
    convertToCommandLineString(): string;
}

class FlywayCommandLineStandardOption implements FlywayCommandLineOption {
    constructor(
        private key: CommandLineOptionMap[keyof CommandLineOptionMap],
        private value: string
    ) {}

    convertToCommandLineString(): string {
        const quote = platform() === "win32" ? '"' : "'";
        return `-${this.key}=${quote}${this.value}${quote}`;
    }
}

class FlywayCommandLineArrayOption<T> implements FlywayCommandLineOption {
    constructor(
        private key: CommandLineOptionMap[keyof CommandLineOptionMap],
        private values: T[]
    ) {}

    convertToCommandLineString(): string {
        const quote = platform() === "win32" ? '"' : "'";
        return `-${this.key}=${quote}${this.values.join(",")}${quote}`;
    }
}

class FlywayCommandLineMapOption implements FlywayCommandLineOption {
    constructor(
        private key: CommandLineOptionMap[keyof CommandLineOptionMap],
        private mapValues: Map<string, string>
    ) {}

    convertToCommandLineString(): string {
        const quote = platform() === "win32" ? '"' : "'";
        const parts: string[] = [];
        this.mapValues.forEach((val, mapKey) => {
            parts.push(`${this.key}.${mapKey}=${quote}${val}${quote}`);
        });
        return parts.join(" ");
    }
}

class CommandLineOptionGenerator {
    public static generateCommandLineOptions(config: FlywayConfig): FlywayCommandLineOption[] {
        const mergedConfig = this.mergeConfigProperties(config);
        const flatConfig = {
            url: mergedConfig.url,
            user: mergedConfig.user,
            password: mergedConfig.password,
            defaultSchema: mergedConfig.defaultSchema,
            migrationLocations: mergedConfig.migrationLocations,
            ...mergedConfig.advanced
        };

        const keys = Object.keys(flatConfig) as (keyof FlywayBasicConfig | keyof FlywayAdvancedConfig)[];
        return keys
            .filter(key => flatConfig[key] != null)
            .map(key => this.build(flatConfig, key, commandLineOptionMap))
            .filter(this.isDefined);
    }

    private static mergeConfigProperties(config: FlywayConfig): FlywayConfig {
        let defaultSchema = config.defaultSchema;
        let schemas = config.advanced?.schemas;
        if (defaultSchema != null && schemas != null) {
            schemas = schemas.filter(schema => schema !== defaultSchema);
        }
        return { ...config, advanced: config.advanced ? { ...config.advanced, schemas } : undefined };
    }

    private static build<T extends FlywayBasicConfig | FlywayAdvancedConfig>(
        config: T,
        key: keyof T,
        optionMapping: { [P in keyof T]: string }
    ): FlywayCommandLineOption | undefined {
        const value = config[key];
        if (value == null) return undefined;
        if (Array.isArray(value)) {
            return new FlywayCommandLineArrayOption(optionMapping[key], value);
        } else if (isMap(value)) {
            return new FlywayCommandLineMapOption(optionMapping[key], value as Map<string, string>);
        } else {
            return new FlywayCommandLineStandardOption(optionMapping[key], `${value}`);
        }
    }

    private static isDefined<T>(arg: T | undefined): arg is T {
        return arg !== undefined;
    }
}

const commandLineOptionMap: CommandLineOptionMap = {
    url: "url",
    user: "user",
    password: "password",
    defaultSchema: "defaultSchema",
    migrationLocations: "locations",
    driver: "driver",
    connectRetries: "connectRetries",
    connectRetriesInterval: "connectRetriesInterval",
    initSql: "initSql",
    callbacks: "callbacks",
    configFileEncoding: "configFileEncoding",
    configFiles: "configFiles",
    migrationEncoding: "encoding",
    groupPendingMigrations: "group",
    installedBy: "installedBy",
    jarDirs: "jarDirs",
    failOnMissingMigrationLocations: "failOnMissingLocations",
    lockRetryCount: "lockRetryCount",
    mixed: "mixed",
    applyNewMigrationsOutOfOrder: "outOfOrder",
    skipDefaultCallbacks: "skipDefaultCallbacks",
    skipDefaultResolvers: "skipDefaultResolvers",
    schemaHistoryTable: "table",
    schemaHistoryTableSpace: "tableSpace",
    target: "target",
    validateMigrationNaming: "validateMigrationNaming",
    validateOnMigrate: "validateOnMigrate",
    workingDirectory: "workingDirectory",
    createSchemas: "createSchemas",
    schemas: "schemas",
    baselineDescription: "baselineDescription",
    baselineOnMigrate: "baselineOnMigrate",
    baselineVersion: "baselineVersion",
    cleanDisabled: "cleanDisabled",
    cleanOnValidationError: "cleanOnValidationError",
    ignoreMigrationPatterns: "ignoreMigrationPatterns",
    repeatableSqlMigrationPrefix: "repeatableSqlMigrationPrefix",
    resolvers: "resolvers",
    sqlMigrationPrefix: "sqlMigrationPrefix",
    sqlMigrationSeparator: "sqlMigrationSeparator",
    sqlMigrationSuffixes: "sqlMigrationSuffixes",
    placeHolderReplacement: "placeHolderReplacement",
    placeHolderPrefix: "placeHolderPrefix",
    placeHolderSuffix: "placeHolderSuffix",
    placeHolders: "placeHolders",
    placeHolderSeparator: "placeHolderSeparator",
    scriptPlaceHolderPrefix: "scriptPlaceHolderPrefix",
    scriptPlaceHolderSuffix: "scriptPlaceHolderSuffix",
    edition: "edition",
    postgresqlTransactionLock: "postgresqlTransactionLock"
};
