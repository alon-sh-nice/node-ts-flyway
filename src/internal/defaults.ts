import { homedir } from "os";
import { join } from "path";
import { FlywayCliStrategy } from "../types/types";

export const DEFAULT_FLYWAY_CLI_DIRECTORY: string = join(homedir(), ".node-flyway");
export const DEFAULT_FLYWAY_CLI_STRATEGY: FlywayCliStrategy = FlywayCliStrategy.DOWNLOAD_CLI_AND_CLEAN;
export const DEFAULT_FLYWAY_VERSION: string = "V9.22.3";
