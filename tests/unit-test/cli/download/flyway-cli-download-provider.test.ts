import {describe, expect, test} from '@jest/globals';
import { stat } from "fs/promises";
import { join } from "path";
import _temp from "temp";
import { DownloadProvider } from "../../../../src/cli/download/download-provider";
import { MockFlywayCliDownloader } from "../../utility/mock-flyway-cli-downloader";

describe("FlywayCliDownloadProvider", () => {

    const temp = _temp.track();

    test("can download and extract a Flyway CLI", async () => {
        const temporaryDirectory = await temp.mkdir();
        const downloadProvider = new DownloadProvider(
            temporaryDirectory,
            new MockFlywayCliDownloader()
        );
        const cli = await downloadProvider.getFlywayCli("V8.5.0");
        expect(cli.executable.path).toEqual(join(temporaryDirectory, "flyway-8.5.0", "flyway"));
        await temp.cleanup();
    });

    test("won't error when a pre-existing Flyway CLI directory exists for the desired version at the location", async () => {
        const temporaryDirectory = await temp.mkdir();
        const downloadProvider = new DownloadProvider(
            temporaryDirectory,
            new MockFlywayCliDownloader()
        );

        // CLI has already been added to location and extracted
        await downloadProvider.getFlywayCli("V8.5.0");

        const cli = await downloadProvider.getFlywayCli("V8.5.0");
        expect(cli.executable.path).toEqual(join(temporaryDirectory, "flyway-8.5.0", "flyway"));
        await temp.cleanup();
    });

    test("won't error when a pre-existing archive exists at the location", async () => {
        const temporaryDirectory = await temp.mkdir();
        const mockFlywayCliDownloader = new MockFlywayCliDownloader();
        const downloadProvider = new DownloadProvider(
            temporaryDirectory,
            mockFlywayCliDownloader
        );

        // Archive has already been added to location
        await mockFlywayCliDownloader.downloadFlywayCli("V8.5.0", temporaryDirectory);

        const cli = await downloadProvider.getFlywayCli("V8.5.0");
        expect(cli.executable.path).toEqual(join(temporaryDirectory, "flyway-8.5.0", "flyway"));
        await temp.cleanup();
    });

    test("will clean up .tar.gz file for Flyway CLI", async () => {
        const temporaryDirectory = await temp.mkdir();
        const mockFlywayCliDownloader = new MockFlywayCliDownloader();
        const downloadProvider = new DownloadProvider(
            temporaryDirectory,
            mockFlywayCliDownloader
        );

        // Archive has already been added to location
        await mockFlywayCliDownloader.downloadFlywayCli("V8.5.0", temporaryDirectory);
        await stat(join(temporaryDirectory, mockFlywayCliDownloader.getCompressedFlywayCliFileName()));

        await downloadProvider.getFlywayCli("V8.5.0");

        let error;
        try {
            await stat(join(temporaryDirectory, mockFlywayCliDownloader.getCompressedFlywayCliFileName()));
        } catch (err) {
            error = err;
        }

        expect(error).not.toBeNull();

        await temp.cleanup();
    });

});
