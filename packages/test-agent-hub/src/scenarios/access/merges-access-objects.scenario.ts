import { v4 } from "uuid";
import {
  Scenario,
  ScenarioContext,
  scenarioFail,
  scenarioPass,
  TAG_ACCESS_PROPS,
  TAG_ACCESS,
} from "../../scenario.types";
import {
  newPerson,
  newRule,
  newSchedule,
  personsMatch,
  schedulesMatch,
} from "./_utils";

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

  if (ctx.tags.includes(TAG_ACCESS_PROPS)) {
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

  if (ctx.tags.includes(TAG_ACCESS_PROPS)) {
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

const mergeAccessRule = async (ctx: ScenarioContext) => {
  const s1 = newSchedule();
  const s2 = newSchedule();
  const s1Id = v4();
  const s2Id = v4();

  const p1 = newPerson();
  const p2 = { ...newPerson(), credentials: [] };
  const p1Id = v4();
  const p2Id = v4();

  // Request available devices
  const devicesResponse = await ctx.getReply({
    kind: "get-available-devices",
    provider: ctx.provider,
  });

  // get all found readers
  const readers = devicesResponse.devices.filter((d) => d.type === "reader");
  if (readers.length < 2) {
    ctx.log(`Less than 2 readers found, skipping access rule merge test`);
    return;
  }
  const [reader1, reader2] = readers;
  ctx.log(
    `Found ${readers.length} readers, using them to test access rule merge`,
  );

  const reader1Id = v4();
  const reader2Id = v4();

  const ruleId = v4();
  const ruleProps = {
    ...newRule(),
    appliedTo: [p1Id, p2Id],
    permissions: [
      {
        deviceId: reader1Id,
        scheduleId: s1Id,
      },
      {
        deviceId: reader2Id,
        scheduleId: s2Id,
      },
    ],
    groupPermissions: [],
  };

  const validateResult = await ctx.getReply({
    kind: "validate-change",
    provider: ctx.provider,
    refMap: {
      person: {
        [p1Id]: [],
        [p2Id]: [],
      },
      schedule: {
        [s1Id]: [],
        [s2Id]: [],
      },
      device: {
        [reader1Id]: [reader1.foreignRef],
        [reader2Id]: [reader2.foreignRef],
      },
    },
    devices: {
      [reader1Id]: reader1,
      [reader2Id]: reader2,
    },
    mutations: [
      {
        kind: "merge",
        objectId: ruleId,
        objectKind: "accessRule",
        original: ruleProps,
        props: ruleProps,
      },
    ],
  });


};

const s: Scenario = {
  tags: [TAG_ACCESS],
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

    if (accessObjects.includes("accessRule")) {
      ctx.log(`Provider supports 'accessRule' access object, testing merge...`);
      await mergeAccessRule(ctx);
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
