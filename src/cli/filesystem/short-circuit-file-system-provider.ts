import { FlywayCliSource } from "../../types/types";
import { getLogger } from "../../utility/logger";
import { FlywayCli } from "../flyway-cli";
import { FlywayCliProvider } from "../flyway-cli-provider";
import { FlywayCliService } from "../service/flyway-cli-service";



export class ShortCircuitFileSystemFlywayCliProvider extends FlywayCliProvider {

    protected static logger = getLogger("ShortCircuitFileSystemFlywayCliProvider");

    constructor(
        private directory: string
    ) {
        super();
    }

    public async getFlywayCli(
        flywayVersion: string
    ): Promise<FlywayCli> {

        const executable = await FlywayCliService.getExecutableFromFlywayCliDirectory(this.directory);

        ShortCircuitFileSystemFlywayCliProvider.logger.log(
            `Successfully found a Flyway CLI at path: ${this.directory} using the optimized local CLI strategy.`
        );

        return new FlywayCli(
            flywayVersion,
            FlywayCliSource.FILE_SYSTEM,
            this.directory,
            executable
        );
    }
    
}
