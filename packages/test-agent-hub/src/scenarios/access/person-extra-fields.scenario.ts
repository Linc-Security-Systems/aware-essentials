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
  personDtoExtras,
  personsMatch,
  updateTestPerson,
} from "./_utils";

// Aware sends credentials with the note the user typed against them
// (person-dto-builder toCredentialDto), although the schema omits it
const withNote = (
  credentials: ExternalPersonProps["credentials"],
): ExternalPersonProps["credentials"] =>
  credentials.map((c) => ({ ...c, note: `note for ${c.value}` }));

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
  if (
    !personsMatch({ provider: got, aware: person.state.props, warn: ctx.warn })
  ) {
    throw new Error(
      `${label}: person mismatch. Expected: ${JSON.stringify(person.state.props)}, Got: ${JSON.stringify(got)}`,
    );
  }
  ctx.log(`${label}: person described as expected`);
};

// ----------------------------------------------------------------
// Scenario definition
//   1. create with a noted card
//   2. props with only fields outside the schema (an edit of
//      position / custom fields / staff flag)       → nothing changes
//   3. {credentials (noted), position}              → card added
//   4. the whole person DTO as props (a resync)     → nothing changes
// ----------------------------------------------------------------

const s: Scenario = {
  tags: [TAG_ACCESS],
  name: "Access Sync: Ignores person fields outside the agent schema",
  description:
    "Verifies that person merges carrying the extra fields Aware sends (credential notes, position, custom fields, staff flag, DTO metadata) are accepted and do not disturb the person",
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
          `${TAG_ACCESS_PROPS} tag not present — checking that the merges are accepted, not their effect`,
        );
      }
      const extras = personDtoExtras(ctx.provider);

      const person = await createTestPerson(
        ctx,
        newPerson(withNote([{ type: "card", value: "74185296" }])),
      );
      ctx.log(`Created person with a noted card`);
      if (verify) await assertDescribed(ctx, "Create", person);

      const onlyExtras = "Edit fields outside the schema";
      await updateTestPerson(
        ctx,
        onlyExtras,
        person,
        {
          position: extras.position,
          staffMember: extras.staffMember,
          customFields: extras.customFields,
          type: extras.type,
          lastModifiedOn: new Date().toISOString(),
        },
        {},
      );
      ctx.log(`${onlyExtras}: applied`);
      if (verify) await assertDescribed(ctx, onlyExtras, person);

      const addCard = "Add a noted card alongside a position edit";
      const credentials = withNote([
        ...person.state.props.credentials,
        { type: "card", value: "96385274" },
      ]);
      await updateTestPerson(
        ctx,
        addCard,
        person,
        {
          credentials,
          position: "Bosun",
          lastModifiedOn: new Date().toISOString(),
        },
        { credentials },
      );
      ctx.log(`${addCard}: applied`);
      if (verify) await assertDescribed(ctx, addCard, person);

      const fullDto = "Merge the whole person DTO";
      await updateTestPerson(
        ctx,
        fullDto,
        person,
        { ...person.state.props, ...extras },
        {},
      );
      ctx.log(`${fullDto}: applied`);
      if (verify) await assertDescribed(ctx, fullDto, person);
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
