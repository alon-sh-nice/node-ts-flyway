import {describe, expect, test} from '@jest/globals';
import { FlywayCliProvider } from '../../../src/cli/flyway-cli-provider';
import { FlywayCli, FlywayExecutable } from '../../../src/cli/flyway-cli';
import { FlywayCliSource } from '../../../src/types/types';

describe("FlywayCliProvider", () => {

    class ExampleFlywayCliProvider extends FlywayCliProvider {

        public getFlywayCli(): Promise<FlywayCli | undefined> {
            return Promise.resolve(
                new FlywayCli(
                    "V4.0.0",
                    FlywayCliSource.FILE_SYSTEM,
                    "example-location",
                    new FlywayExecutable("/some/path/flyway")
                )
            );
        }

    }


    class UndefinedFlywayCliProvider extends FlywayCliProvider {

        public getFlywayCli(): Promise<FlywayCli | undefined> {
            return Promise.resolve(undefined);
        }

    }

    class ThrowingFlywayCliProvider extends FlywayCliProvider {

        public getFlywayCli(): Promise<FlywayCli | undefined> {
            throw new Error('Method intentionally not implemented.');
        }

    }

    test("can be chained together with other providers", async () => {

        const returningProvider = new ExampleFlywayCliProvider();
        const undefinedProvider = new UndefinedFlywayCliProvider();

        const cli = await undefinedProvider
            .chain(undefinedProvider)
            .chain(returningProvider)
            .chain(undefinedProvider)
            .getFlywayCli('V4.0.0');

        expect(cli?.executable.path).toEqual("/some/path/flyway");
    });


    test("will execute next in the chain even if previous provider throws an error", async () => {

        const returningProvider = new ExampleFlywayCliProvider();
        const undefinedProvider = new UndefinedFlywayCliProvider();
        const throwingProvider = new ThrowingFlywayCliProvider();

        const cli = await undefinedProvider
            .chain(throwingProvider)
            .chain(undefinedProvider)
            .chain(returningProvider)
            .chain(throwingProvider)
            .getFlywayCli('V4.0.0');

        expect(cli?.executable.path).toEqual("/some/path/flyway");
    });

});
