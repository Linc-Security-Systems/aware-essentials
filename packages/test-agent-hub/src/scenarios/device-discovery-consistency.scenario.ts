import { sDeviceDiscoveryDto } from "@awarevue/api-types";
import {
  Scenario,
  scenarioFail,
  scenarioPass,
  TAG_CORE,
  TAG_DEVICES,
} from "../scenario.types";

// ----------------------------------------------------------------
// Aware imports discovered devices keyed by (provider, foreignRef)
// and keeps only relations whose leftId / rightId are foreignRefs of
// imported devices (device-discovery.service). Discovery runs again
// whenever a user re-imports, so the same devices must come back
// with the same refs.
// ----------------------------------------------------------------

const s: Scenario = {
  name: "device-discovery-consistency",
  description:
    "Validates the get-available-devices response against the schema, checks foreignRefs are unique and relations point at discovered devices, and that a second discovery returns the same devices",
  tags: [TAG_CORE, TAG_DEVICES],

  async run(ctx) {
    await ctx.getReply({
      kind: "start",
      provider: ctx.provider,
      config: ctx.config,
      lastEventForeignRef: null,
      lastEventTimestamp: null,
    });

    const discover = () =>
      ctx.getReply({ kind: "get-available-devices", provider: ctx.provider });
    const first = await discover();
    const second = await discover();

    await ctx.getReply({ kind: "stop", provider: ctx.provider });

    const errors: string[] = [];

    const parsed = sDeviceDiscoveryDto.safeParse({
      devices: first.devices,
      relations: first.relations,
    });
    if (!parsed.success) {
      const issues = parsed.error.issues;
      errors.push(
        `Response does not match the discovery schema (${issues.length} issue(s)): ${issues
          .slice(0, 5)
          .map((i) => `${i.path.join(".")} - ${i.message}`)
          .join("; ")}`,
      );
    }

    const refs = first.devices.map((d) => d.foreignRef);
    const refSet = new Set(refs);
    ctx.log(
      `Discovered ${refs.length} device(s) and ${first.relations.length} relation(s)`,
    );

    const empty = first.devices.filter((d) => !d.foreignRef || !d.name);
    if (empty.length > 0) {
      errors.push(
        `${empty.length} device(s) with an empty foreignRef or name: ${JSON.stringify(empty.slice(0, 3))}`,
      );
    }

    const duplicates = [
      ...new Set(refs.filter((r, i) => refs.indexOf(r) !== i)),
    ];
    if (duplicates.length > 0) {
      errors.push(`Duplicate foreignRefs: ${duplicates.join(", ")}`);
    }

    const otherProvider = first.devices.filter(
      (d) => d.provider !== ctx.provider,
    );
    if (otherProvider.length > 0) {
      errors.push(
        `${otherProvider.length} device(s) not reported under provider '${ctx.provider}': ${otherProvider
          .slice(0, 3)
          .map((d) => `${d.foreignRef} (${d.provider})`)
          .join(", ")}`,
      );
    }

    const dangling = first.relations.filter(
      (r) => !refSet.has(r.leftId) || !refSet.has(r.rightId),
    );
    if (dangling.length > 0) {
      errors.push(
        `${dangling.length} relation(s) point at undiscovered devices, Aware drops them: ${dangling
          .slice(0, 3)
          .map((r) => `${r.leftId} -${r.kind}- ${r.rightId}`)
          .join(", ")}`,
      );
    }

    const secondTypes = new Map(
      second.devices.map((d) => [d.foreignRef, d.type]),
    );
    const changed = first.devices.filter(
      (d) => secondTypes.get(d.foreignRef) !== d.type,
    );
    const added = second.devices.filter((d) => !refSet.has(d.foreignRef));
    if (changed.length > 0 || added.length > 0) {
      errors.push(
        `Second discovery differs — missing or retyped: [${changed.map((d) => d.foreignRef)}], new: [${added.map((d) => d.foreignRef)}]`,
      );
    }

    return errors.length > 0 ? scenarioFail(...errors) : scenarioPass();
  },
};

export default s;
