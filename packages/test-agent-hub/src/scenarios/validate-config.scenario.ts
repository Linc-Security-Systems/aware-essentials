import { ConfigurationIssue } from "@awarevue/api-types";
import {
  Scenario,
  ScenarioContext,
  scenarioFail,
  scenarioPass,
  TAG_CORE,
} from "../scenario.types";

type JsonSchema = {
  required?: string[];
  properties?: Record<string, { type?: string | string[] }>;
};

// A value of the wrong JSON type for each JSON schema type
const WRONG_VALUE: Record<string, unknown> = {
  string: 12345,
  number: "not-a-number",
  integer: "not-a-number",
  boolean: "not-a-boolean",
  object: "not-an-object",
  array: "not-an-array",
};

// Aware highlights the config form fields named in `paths`
const pointsAt = (issues: ConfigurationIssue[], key: string) =>
  issues.some((i) =>
    i.paths.some((p) => p.split(/[^A-Za-z0-9_$-]+/).includes(key)),
  );

const validate = async (
  ctx: ScenarioContext,
  config: Record<string, unknown>,
) =>
  (
    await ctx.getReply({
      kind: "validate-config",
      provider: ctx.provider,
      config,
    })
  ).issues;

// ----------------------------------------------------------------
// Aware sends validate-config while a user edits the provider config,
// whether or not the provider is running, and shows the issues
// against the fields named in their paths:
//   1. the working config        → no issues
//   2. a required field removed  → an issue pointing at it
//   3. a field of the wrong type → an issue pointing at it
// Steps 2 and 3 use the provider's configSchema to pick the field.
// ----------------------------------------------------------------

const s: Scenario = {
  tags: [TAG_CORE],
  name: "validate-config",
  description:
    "Sends validate-config without starting the provider: the working config must have no issues, and a config missing a required field or with a wrongly typed field must get issues pointing at that field",
  async run(ctx) {
    const errors: string[] = [];

    const valid = await validate(ctx, ctx.config);
    if (valid.length > 0) {
      errors.push(
        `Working config reported ${valid.length} issue(s): ${JSON.stringify(valid)}`,
      );
    } else {
      ctx.log(`Working config: no issues`);
    }

    const schema = (ctx.registerPayload.providers[ctx.provider]?.configSchema ??
      {}) as JsonSchema;

    const requiredKey = (schema.required ?? []).find((k) => k in ctx.config);
    if (requiredKey) {
      const config = { ...ctx.config };
      delete config[requiredKey];
      const issues = await validate(ctx, config);
      if (!pointsAt(issues, requiredKey)) {
        errors.push(
          `Config without required '${requiredKey}': expected an issue with '${requiredKey}' in its paths, got: ${JSON.stringify(issues)}`,
        );
      } else {
        ctx.log(`Missing '${requiredKey}': reported`);
      }
    } else {
      ctx.log(
        `configSchema lists no required field set in the config — skipping missing field check`,
      );
    }

    const typed = Object.entries(schema.properties ?? {}).find(
      ([key, prop]) =>
        key in ctx.config &&
        typeof prop.type === "string" &&
        prop.type in WRONG_VALUE,
    );
    if (typed) {
      const [key, prop] = typed;
      const config = { ...ctx.config, [key]: WRONG_VALUE[prop.type as string] };
      const issues = await validate(ctx, config);
      if (!pointsAt(issues, key)) {
        errors.push(
          `Config with ${prop.type} '${key}' set to ${JSON.stringify(config[key])}: expected an issue with '${key}' in its paths, got: ${JSON.stringify(issues)}`,
        );
      } else {
        ctx.log(`Wrongly typed '${key}': reported`);
      }
    } else {
      ctx.log(
        `configSchema lists no typed property set in the config — skipping wrong type check`,
      );
    }

    return errors.length > 0 ? scenarioFail(...errors) : scenarioPass();
  },
};

export default s;
