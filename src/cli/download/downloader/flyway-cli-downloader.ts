import {join} from "path";
import {getUrlComponentsForFlywayVersion} from "../../../internal/flyway-version";
import {DownloaderHelper} from "node-downloader-helper";
import {getLogger, Logger} from "../../../utility/logger";
import {
    CpuArchitecture,
    getHostCpuArchitecture,
    getHostOperatingSystem,
    OperatingSystem
} from "../../../utility/utility";

/*
    Takes a flyway version and a save directory.
    Downloads a compressed flyway CLI directory and saves it to the specified directory.
    Return the path of the compressed version
*/

export interface FlywayCliDownloader {

    getFlywayCliDownloadLocation(
        string: string,
        saveDirectory: string
    ): string

    downloadFlywayCli(
        string: string, 
        saveDirectory: string
    ): Promise<string>

}

export class DirectFlywayCliDownloader implements FlywayCliDownloader {

    private logger: Logger = getLogger("DirectFlywayCliDownloader");


    public async downloadFlywayCli(
        string: string,
        saveDirectory: string
    ): Promise<string> {
        const url = this.buildUrl(string);
        await this.download(url.url, saveDirectory);
        return join(saveDirectory, url.fileName);
    }

    getFlywayCliDownloadLocation(string: string, saveDirectory: string): string {
        const url = this.buildUrl(string);
        return join(saveDirectory, url.fileName);
    }

    private buildUrl(string: string): FlywayCliUrl {
        const operatingSystem = getHostOperatingSystem();
        const cpuArchitecture = getHostCpuArchitecture();
        return FlywayCliUrlBuilder.buildUrl(string, operatingSystem, cpuArchitecture);
    }

    private async download(url: string, saveDirectory: string): Promise<void> {
        const downloader = new DownloaderHelper(url, saveDirectory);
        return new Promise((resolve, reject) => {
            downloader.on("end", () => resolve());
            downloader.on("error", (err) => reject(err));
            downloader.on("progress.throttled", (downloadEvents) => {
                this.logger.log(`Downloaded: ${(Math.min(downloadEvents.progress, 100).toPrecision(2))}%`);
            });
            downloader.start();
        });
    }

}

export type FlywayCliUrl = {
    url: string, fileName: string
};

export class FlywayCliUrlBuilder {

    public static buildUrl(
        string: string,
        operatingSystem: OperatingSystem,
        cpuArchitecture: CpuArchitecture
    ): FlywayCliUrl  {
        const urlComponents = getUrlComponentsForFlywayVersion(string);
        const fileName = this.buildFilename(string, operatingSystem, cpuArchitecture);
        
        return {
            url: `https://repo1.maven.org/maven2/org/flywaydb/flyway-commandline/${urlComponents.versionString}/${fileName}`,
            fileName
        }
    }

    private static buildFilename(
        string: string,
        operatingSystem: OperatingSystem,
        cpuArchitecture: CpuArchitecture
    ): string {
        // Use destructuring to simplify access to versionString and flag.
        const {versionString, operatingSystemSpecificUrl} = getUrlComponentsForFlywayVersion(string);
        if (operatingSystemSpecificUrl) {
            return operatingSystem !== "windows"
                ? `flyway-commandline-${versionString}-${operatingSystem}-${cpuArchitecture}.tar.gz`
                : `flyway-commandline-${versionString}-${operatingSystem}-${cpuArchitecture}.zip`;
        }
        return `flyway-commandline-${versionString}.tar.gz`;
    }
}


/**
 * Downloads CLI via Maven.
 */
export class MavenFlywayCliDownloader implements FlywayCliDownloader {
    
    downloadFlywayCli(
        string: string, saveDirectory: string
    ): Promise<string> {
        throw new Error("Method not implemented.");
    }

    getFlywayCliDownloadLocation(string: string, saveDirectory: string): string {
        throw new Error("Method not implemented.");
    }



}
