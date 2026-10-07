import { ExternalPersonProps } from "@awarevue/api-types";
import {
  Scenario,
  ScenarioContext,
  scenarioPass,
  scenarioSkip,
  TAG_ACCESS,
  TAG_ACCESS_PROPS,
} from "../../scenario.types";
import {
  accessObjectsOf,
  createTestPerson,
  describeObject,
  newPerson,
  personsMatch,
  updateTestPerson,
} from "./_utils";

const assertDescribed = async (
  ctx: ScenarioContext,
  label: string,
  person: { state: { props: ExternalPersonProps; refs: string[] } },
) => {
  const got = (await describeObject(
    ctx,
    "person",
    person.state.refs,
  )) as ExternalPersonProps;
  const expected = person.state.props;
  // personsMatch does not look at accessSuspended
  if (got.accessSuspended !== expected.accessSuspended) {
    throw new Error(
      `${label}: expected accessSuspended=${expected.accessSuspended}, got ${got.accessSuspended}`,
    );
  }
  if (!personsMatch({ provider: got, aware: expected, warn: ctx.warn })) {
    throw new Error(
      `${label}: other props changed. Expected: ${JSON.stringify(expected)}, Got: ${JSON.stringify(got)}`,
    );
  }
  ctx.log(`${label}: provider reports accessSuspended=${got.accessSuspended}`);
};

// ----------------------------------------------------------------
// Scenario definition
//   1. create person with a card
//   2. {accessSuspended: true}  → suspended, card kept
//   3. {accessSuspended: false} → reinstated, card kept
// ----------------------------------------------------------------

const s: Scenario = {
  tags: [TAG_ACCESS],
  name: "Access Sync: Suspends and reinstates a person",
  description:
    "Verifies that a partial merge toggling accessSuspended suspends and then reinstates a person without losing their other props",
  run: async (ctx) => {
    let skipped: string | undefined;

    await ctx.getReply({
      kind: "start",
      provider: ctx.provider,
      config: ctx.config,
      lastEventForeignRef: null,
      lastEventTimestamp: null,
    });

    if (accessObjectsOf(ctx).includes("person")) {
      const verify = ctx.tags.includes(TAG_ACCESS_PROPS);
      if (!verify) {
        ctx.log(
          `${TAG_ACCESS_PROPS} tag not present — checking that the changes are accepted, not their effect`,
        );
      }

      const person = await createTestPerson(
        ctx,
        newPerson([{ type: "card", value: "36925814" }]),
      );
      ctx.log(`Created person with 1 card`);

      for (const accessSuspended of [true, false]) {
        const label = accessSuspended ? "Suspend" : "Reinstate";
        await updateTestPerson(
          ctx,
          label,
          person,
          { accessSuspended, lastModifiedOn: new Date().toISOString() },
          { accessSuspended },
        );
        ctx.log(`${label}: applied`);
        if (verify) await assertDescribed(ctx, label, person);
      }
    } else {
      skipped = `Provider does not support 'person'`;
    }

    await ctx.runCleanups();

    await ctx.getReply({
      kind: "stop",
      provider: ctx.provider,
    });

    return skipped ? scenarioSkip(skipped) : scenarioPass();
  },
};

export default s;
