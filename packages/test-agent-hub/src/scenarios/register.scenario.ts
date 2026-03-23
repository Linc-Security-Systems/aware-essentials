import { Scenario, scenarioPass, scenarioFail } from "../scenario.types";

/**
 * Validates that the agent sent a well-formed `register` message
 * with at least one provider and valid provider specs.
 */
const scenario: Scenario = {
  name: "register",
  description:
    "Validates that the agent sends a valid register message with at least one provider",
  tags: ["core"],

  async run(ctx) {
    const { registerPayload } = ctx;

    // Check that providers exist
    const providerNames = Object.keys(registerPayload.providers);
    if (providerNames.length === 0) {
      return scenarioFail("Agent registered with zero providers");
    }

    ctx.log(`Providers: ${providerNames.join(", ")}`);

    // Validate each provider has a title and config schema
    const errors: string[] = [];

    for (const name of providerNames) {
      const spec = registerPayload.providers[name];

      if (!spec.title || spec.title.trim().length === 0) {
        errors.push(`Provider '${name}' is missing a title`);
      }

      if (!spec.configSchema || typeof spec.configSchema !== "object") {
        errors.push(`Provider '${name}' is missing a configSchema`);
      }
    }

    if (errors.length > 0) {
      return scenarioFail(...errors);
    }

    return scenarioPass();
  },
};

export default scenario;
