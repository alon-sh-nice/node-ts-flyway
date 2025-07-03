/**
 * Gets the URL components needed to download a specific Flyway version
 *
 * @param flywayVersion The Flyway version
 * @returns URL components for the version
 */
export const getUrlComponentsForFlywayVersion = (flywayVersion: string): {
    versionString: string,
    operatingSystemSpecificUrl: boolean
} => {
    switch (flywayVersion) {
        case "V4.0.0": {
            return {
                versionString: "4.0",
                operatingSystemSpecificUrl: true
            };
        }
        case "V5.0.0": {
            return {
                versionString: flywayVersion.substring(1),
                operatingSystemSpecificUrl: false
            }
        }
        default: {
            return {
                versionString: flywayVersion.substring(1),
                operatingSystemSpecificUrl: true
            };
        }
    }
}
