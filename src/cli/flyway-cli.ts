import {FlywayCliSource, FlywayCommand, FlywayConfig} from "../types/types";
import {FlywayCommandLineOptions} from "../internal/flyway-command-line-options";
import {getLogger} from "../utility/logger";
import {FlywayRawExecutionResponse} from "../response/responses";
import {execute} from "../utility/utility";

export class FlywayCli {
    constructor(
        public readonly version: string,
        public readonly source: FlywayCliSource,
        public readonly location: string,
        public readonly executable: FlywayExecutable,
    ) {}
}

export class FlywayExecutable {
    private static readonly logger = getLogger("FlywayExecutable");

    constructor(public readonly path: string) { }

    // Helper method to build the command string for execution
    private buildCommand(
        flywayCommand: FlywayCommand,
        config: FlywayConfig
    ): string {
        const options = FlywayCommandLineOptions.build(config).convertToCommandLineString();
        return `${this.path} ${options} ${flywayCommand} -outputType=json`;
    }

    public async execute(
        flywayCommand: FlywayCommand,
        config: FlywayConfig
    ): Promise<FlywayRawExecutionResponse> {
        const command = this.buildCommand(flywayCommand, config);
        FlywayExecutable.logger.log(`Executing Flyway command: ${command}`);

        const response: FlywayRawExecutionResponse = await execute(command, {});
        if (response.success) {
            FlywayExecutable.logger.log(`Command executed successfully. Response: ${response.response}`);
        } else {
            FlywayExecutable.logger.log(`Command execution failed: ${command}`);
        }
        return response;

    }
}