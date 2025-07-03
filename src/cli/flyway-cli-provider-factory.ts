import {getLogger} from "../utility/logger";
import {FlywayCliStrategy} from "../types/types";
import {DownloadProvider} from "./download/download-provider";
import {DirectFlywayCliDownloader} from "./download/downloader/flyway-cli-downloader";
import {SelfCleaningDownloadProvider} from "./download/self-cleaning-download-provider";
import {FileSystemFlywayCliProvider} from "./filesystem/file-system-provider";
import {FlywayCliProvider} from "./flyway-cli-provider";

const logger = getLogger("FlywayCliProviderFactory");

export class FlywayCliProviderFactory {
    static createFlywayCliProvider(
        strategy: FlywayCliStrategy,
        flywayCliDirectory: string
    ): FlywayCliProvider {
        if (strategy === FlywayCliStrategy.DOWNLOAD_CLI_AND_CLEAN) {
            return new SelfCleaningDownloadProvider(new DirectFlywayCliDownloader());
        } else if (strategy === FlywayCliStrategy.DOWNLOAD_CLI_ONLY) {
            return new DownloadProvider(
                flywayCliDirectory,
                new DirectFlywayCliDownloader()
            );
        } else {
            logger.log(`Unknown strategy: ${strategy}. Falling back to default provider...`);
            return this.createFileSystemProviderWithDownloadFallback(flywayCliDirectory);
        }
    }

    static createFileSystemProviderWithDownloadFallback(cliDirectory: string): FlywayCliProvider {
        const fileSystemProvider = new FileSystemFlywayCliProvider(cliDirectory);
        const downloadProvider = new DownloadProvider(
            cliDirectory,
            new DirectFlywayCliDownloader()
        );
        return fileSystemProvider.chain(downloadProvider);
    }
}