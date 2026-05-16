import { v4 } from "uuid";
import {
  Scenario,
  ScenarioContext,
  scenarioFail,
  scenarioPass,
  ACCESS_PROPS_TAG,
} from "../../scenario.types";
import { newPerson, newSchedule, personsMatch, schedulesMatch } from "./_utils";

const mergePerson = async (ctx: ScenarioContext) => {
  const awareId = v4();
  const personProps = newPerson();
  const validateResult = await ctx.getReply({
    kind: "validate-change",
    provider: ctx.provider,
    refMap: {
      person: {
        [awareId]: [],
      },
    },
    devices: {},
    mutations: [
      {
        kind: "merge",
        objectId: awareId,
        objectKind: "person",
        original: personProps,
        props: personProps,
      },
    ],
  });

  if (validateResult.issues.length > 0) {
    return scenarioFail(
      `Expected 0 issues, got ${validateResult.issues.length}`,
    );
  }

  ctx.log(`Validation passed with 0 issues as expected`);

  const applyResult = await ctx.getReply({
    kind: "apply-change",
    provider: ctx.provider,
    refMap: {
      person: {
        [awareId]: [],
      },
    },
    devices: {},
    mutations: [
      {
        kind: "merge",
        objectId: awareId,
        objectKind: "person",
        original: personProps,
        props: personProps,
      },
    ],
  });

  const references = applyResult.refs.person?.[awareId] || [];
  if (references.length < 1) {
    return scenarioFail(`Expected 1 reference, got ${references.length}`);
  }

  ctx.log(`Apply succeeded with ${references.length} reference(s) as expected`);

  if (ctx.tags.includes(ACCESS_PROPS_TAG)) {
    const describeResult = await ctx.getReply({
      kind: "describe-object",
      provider: ctx.provider,
      objectKind: "person",
      objectAssignedRef: references.join(","),
    });

    if (describeResult.object === null) {
      throw new Error(
        `describe-object returned null for person with ref(s): ${references.join(",")}`,
      );
    }

    if (!personsMatch(describeResult.object.data as any, personProps)) {
      throw new Error(
        `Person props mismatch after save. Expected: ${JSON.stringify(personProps)}, Got: ${JSON.stringify(describeResult.object.data)}`,
      );
    }

    ctx.log(`Props comparison passed: agent returned correct person props`);
  }

  // delete the person to clean up after test
  await ctx.getReply({
    kind: "apply-change",
    provider: ctx.provider,
    refMap: {
      person: {
        [awareId]: references,
      },
    },
    devices: {},
    mutations: [
      {
        kind: "delete",
        objectId: awareId,
        objectKind: "person",
        original: {
          ...personProps,
        },
      },
    ],
  });

  ctx.log(`Deleted person to clean up after test`);
};

const mergeSchedule = async (ctx: ScenarioContext) => {
  const awareId = v4();
  const scheduleProps = newSchedule();
  const validateResult = await ctx.getReply({
    kind: "validate-change",
    provider: ctx.provider,
    refMap: {
      schedule: {
        [awareId]: [],
      },
    },
    devices: {},
    mutations: [
      {
        kind: "merge",
        objectId: awareId,
        objectKind: "schedule",
        original: scheduleProps,
        props: scheduleProps,
      },
    ],
  });

  if (validateResult.issues.length > 0) {
    return scenarioFail(
      `Expected 0 issues, got ${validateResult.issues.length}`,
    );
  }

  ctx.log(`Validation passed with 0 issues as expected`);

  const applyResult = await ctx.getReply({
    kind: "apply-change",
    provider: ctx.provider,
    refMap: {
      schedule: {
        [awareId]: [],
      },
    },
    devices: {},
    mutations: [
      {
        kind: "merge",
        objectId: awareId,
        objectKind: "schedule",
        original: scheduleProps,
        props: scheduleProps,
      },
    ],
  });

  const references = applyResult.refs.schedule?.[awareId] || [];
  if (references.length < 1) {
    return scenarioFail(`Expected 1 reference, got ${references.length}`);
  }

  ctx.log(`Apply succeeded with ${references.length} reference(s) as expected`);

  if (ctx.tags.includes(ACCESS_PROPS_TAG)) {
    const describeResult = await ctx.getReply({
      kind: "describe-object",
      provider: ctx.provider,
      objectKind: "schedule",
      objectAssignedRef: references.join(","),
    });

    if (describeResult.object === null) {
      throw new Error(
        `describe-object returned null for schedule with ref(s): ${references.join(",")}`,
      );
    }

    if (!schedulesMatch(describeResult.object.data as any, scheduleProps)) {
      throw new Error(
        `Schedule props mismatch after save. Expected: ${JSON.stringify(scheduleProps)}, Got: ${JSON.stringify(describeResult.object.data)}`,
      );
    }

    ctx.log(`Props comparison passed: agent returned correct schedule props`);
  }

  // delete the schedule to clean up after test
  await ctx.getReply({
    kind: "apply-change",
    provider: ctx.provider,
    refMap: {
      schedule: {
        [awareId]: references,
      },
    },
    devices: {},
    mutations: [
      {
        kind: "delete",
        objectId: awareId,
        objectKind: "schedule",
        original: {
          ...scheduleProps,
        },
      },
    ],
  });

  ctx.log(`Deleted schedule to clean up after test`);
};

const mergeZone = async () => {
  // TODO implement when we have a test provider that supports zones
};

const s: Scenario = {
  tags: ["access"],
  name: "Access Sync: Merges Access Objects it supports",
  description: "Access Sync: Merges Access Objects it supports",
  run: async (ctx) => {
    await ctx.getReply({
      kind: "start",
      provider: ctx.provider,
      config: ctx.config,
      lastEventForeignRef: null,
      lastEventTimestamp: null,
    });

    const accessObjects = ctx.registerPayload.accessControlProviders
      ? ctx.registerPayload.accessControlProviders[ctx.provider].accessObjects
      : [];

    if (accessObjects.includes("person")) {
      ctx.log(`Provider supports 'person' access object, testing merge...`);
      await mergePerson(ctx);
    }

    if (accessObjects.includes("schedule")) {
      ctx.log(`Provider supports 'schedule' access object, testing merge...`);
      await mergeSchedule(ctx);
    }

    if (accessObjects.includes("zone")) {
      ctx.log(`Provider supports 'zone' access object, testing merge...`);
      await mergeZone();
    }

    await ctx.getReply({
      kind: "stop",
      provider: ctx.provider,
    });

    return scenarioPass();
  },
};

export default s;
