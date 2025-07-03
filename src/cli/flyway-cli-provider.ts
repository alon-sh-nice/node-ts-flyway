import { getLogger } from "../utility/logger";
import { FlywayCli } from "./flyway-cli";


export abstract class FlywayCliProvider {
    protected static logger = getLogger("FlywayCliProvider");

    public abstract getFlywayCli(flywayVersion: string): Promise<FlywayCli | undefined>;

    /*
      Chains multiple providers so that if one fails, the next is tried.
    */
    public chain(provider: FlywayCliProvider): FlywayCliProvider {
        const self = this;
        return new class extends FlywayCliProvider {
            public async getFlywayCli(flywayVersion: string): Promise<FlywayCli | undefined> {
                try {
                    const cli = await self.getFlywayCli(flywayVersion);
                    return cli ?? await provider.getFlywayCli(flywayVersion);
                } catch (err: any) {
                    FlywayCliProvider.logger.log(
                        `${self.constructor.name}.getFlywayCli() error: ${err.stack}. Falling back to ${provider.constructor.name}.`
                    );
                    return provider.getFlywayCli(flywayVersion);
                }
            }
            public chain(newProvider: FlywayCliProvider): FlywayCliProvider {
                return this.getFlywayCli.bind(this) ? self.chain(provider).chain(newProvider) : newProvider;
            }
        }();
    }
}
