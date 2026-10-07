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
  daysFromToday,
  describeObject,
  newPerson,
  personsMatch,
  representsDate,
  updateTestPerson,
} from "./_utils";

// ----------------------------------------------------------------
// assertDescribedDates — the provider must hold the date-only values
//   Aware sent. A value that parses to the previous or next day (a
//   UTC/local conversion slip) fails. null dates follow personsMatch:
//   provider null, or open-ended (from ≤ today, to ≥ 5 years ahead).
// ----------------------------------------------------------------

const assertDescribedDates = async (
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

  const wrong = (["validFrom", "validTo"] as const).filter((field) =>
    expected[field] === null
      ? // personsMatch only looks at this field when the rest is equal
        !personsMatch({
          provider: { ...expected, [field]: got[field] },
          aware: expected,
          warn: ctx.warn,
        })
      : !representsDate(got[field], expected[field] as string),
  );
  if (wrong.length > 0) {
    throw new Error(
      `${label}: wrong ${wrong.join(", ")}. Expected validFrom=${expected.validFrom} validTo=${expected.validTo}, Got validFrom=${got.validFrom} validTo=${got.validTo}`,
    );
  }
  ctx.log(
    `${label}: provider holds validFrom=${got.validFrom} validTo=${got.validTo}`,
  );
};

// ----------------------------------------------------------------
// Scenario definition
//   Aware sends validFrom / validTo as date-only strings (YYYY-MM-DD),
//   in props and in original:
//   1. create with validFrom = today, validTo = in a year
//   2. {validTo}   → in 30 days
//   3. {validFrom} → tomorrow (not yet valid)
//   4. {validFrom: null, validTo: null} → open-ended
// ----------------------------------------------------------------

const s: Scenario = {
  tags: [TAG_ACCESS],
  name: "Access Sync: Person validity dates sent as date-only strings",
  description:
    "Verifies that person validFrom / validTo sent as YYYY-MM-DD strings, as Aware sends them, are accepted, stored on the right day, changed and cleared",
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
          `${TAG_ACCESS_PROPS} tag not present — checking that date-only values are accepted, not how they are stored`,
        );
      }

      const person = await createTestPerson(ctx, {
        ...newPerson([]),
        validFrom: daysFromToday(0),
        validTo: daysFromToday(365),
      });
      ctx.log(
        `Created person valid from ${person.state.props.validFrom} to ${person.state.props.validTo}`,
      );
      if (verify) await assertDescribedDates(ctx, "Create", person);

      const steps: [string, Partial<ExternalPersonProps>][] = [
        ["Change validTo", { validTo: daysFromToday(30) }],
        ["Change validFrom to a future day", { validFrom: daysFromToday(1) }],
        ["Clear both dates", { validFrom: null, validTo: null }],
      ];
      for (const [label, changes] of steps) {
        await updateTestPerson(
          ctx,
          label,
          person,
          { ...changes, lastModifiedOn: new Date().toISOString() },
          changes,
        );
        ctx.log(`${label}: applied ${JSON.stringify(changes)}`);
        if (verify) await assertDescribedDates(ctx, label, person);
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
