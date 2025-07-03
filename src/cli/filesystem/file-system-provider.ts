import { readdir } from "fs/promises";
import { FlywayCliSource } from "../../types/types";
import { getLogger } from "../../utility/logger";
import { FlywayCli } from "../flyway-cli";
import { FlywayCliProvider } from "../flyway-cli-provider";
import { FlywayCliService } from "../service/flyway-cli-service";
import path = require("path");


export class FileSystemFlywayCliProvider extends FlywayCliProvider {
    
    protected static logger = getLogger("FileSystemFlywayCliProvider");
    
    constructor(
        private flywayCliDirectory: string
    ) {
        super();
    }

    /**
     *  Checks whether the provided directory is a matching Flyway CLI.
     *  Otherwise, checks nested directories to find a suitable Flyway CLI candidate.
     *  If no suitable CLI candidates are found, throws an exception.
     */
    public async getFlywayCli(
        flywayVersion: string
    ): Promise<FlywayCli | undefined> {

        const existingVersion = await FlywayCliService.getFlywayCliDetails(this.flywayCliDirectory);
        
        if (existingVersion != null) {
            if (existingVersion === flywayVersion) {
                const executable = await FlywayCliService.getExecutableFromFlywayCliDirectory(this.flywayCliDirectory);
                return new FlywayCli(
                    existingVersion,
                    FlywayCliSource.FILE_SYSTEM,
                    this.flywayCliDirectory,
                    executable
                );
            } else {
                throw new Error(`Filesystem location is a Flyway CLI directory. However the Flyway CLI version is ${existingVersion} whereas the requested version is ${flywayVersion}`);
            }
        }

        FileSystemFlywayCliProvider.logger.log(
            `Provided directory ${this.flywayCliDirectory} is not a Flyway CLI. Searching nested directories to find a Flyway CLI candidate with version ${flywayVersion}.`
        );
        
        const otherVersions: string[] = [];
        // Iterate through all child directories searching for CLI with matching version
        const directories: string[] = (await readdir(this.flywayCliDirectory, { withFileTypes: true }))
            .filter(file => file.isDirectory())
            .map(dir => path.join(this.flywayCliDirectory, dir.name));

        const targetFlywayDir = (await Promise.all(
            directories.map(async directory => {
                const details = await FlywayCliService.getFlywayCliDetails(directory);
                if (details == null) return undefined;
                if (this.flywayCliVersionsMatch(details, flywayVersion)) {
                    return directory;
                } else {
                    otherVersions.push(details);
                }
            })
        )).find(directory => !!directory);

        if (targetFlywayDir == null) {
            throw otherVersions.length === 0
                ? new Error(`No child directory of ${this.flywayCliDirectory} is a Flyway CLI with version ${flywayVersion}.`)
                : new Error(`No child directory of ${this.flywayCliDirectory} is a Flyway CLI with version ${flywayVersion}. Only found versions: ${otherVersions}.`);
        }
        
        const executable = await FlywayCliService.getExecutableFromFlywayCliDirectory(targetFlywayDir);
        return new FlywayCli(
            flywayVersion,
            FlywayCliSource.FILE_SYSTEM,
            targetFlywayDir,
            executable
        );
    }

    private flywayCliVersionsMatch(
        version1: string | undefined,
        version2: string | undefined
    ): boolean {    
        FileSystemFlywayCliProvider.logger.log(`Comparing Flyway versions. Target version: ${version2 ? version2 : "undefined"}. Found version: ${version1 ? version1 : "undefined"}.`);
        if (version1 == null || version2 == null) {
            return false;
        }
        return version1 === version2;
    }
    
}
