import { v4 } from "uuid";
import { Scenario, ScenarioContext, scenarioFail, scenarioPass } from "../../scenario.types";
import { newPerson, newSchedule } from "./_utils";

const mergePerson = async (ctx: ScenarioContext) => {
  const awareId = v4();
  const personProps = newPerson();
  const validateResult = await ctx.getReply({
    kind: 'validate-change',
    provider: ctx.provider,
    refMap: {
      person: {
        [awareId]: [],
      }
    },
    devices: {},
    mutations: [{
      kind: 'merge',
      objectId: awareId,
      objectKind: 'person',
      original: null,
      props: personProps,
    }],
  });

  if (validateResult.issues.length > 0) {
    return scenarioFail(`Expected 0 issues, got ${validateResult.issues.length}`);
  }

  ctx.log(`Validation passed with 0 issues as expected`);

  const applyResult = await ctx.getReply({
    kind: 'apply-change',
    provider: ctx.provider,
    refMap: {
      person: {
        [awareId]: [],
      }
    },
    devices: {},
    mutations: [{
      kind: 'merge',
      objectId: awareId,
      objectKind: 'person',
      original: null,
      props: personProps,
    }],
  });

  const references = applyResult.refs.person?.[awareId] || [];
  if (references.length < 1) {
    return scenarioFail(`Expected 1 reference, got ${references.length}`);
  }

  ctx.log(`Apply succeeded with ${references.length} reference(s) as expected`);

  // delete the person to clean up after test
  await ctx.getReply({
    kind: 'apply-change',
    provider: ctx.provider,
    refMap: {
      person: {
        [awareId]: references,
      }
    },
    devices: {},
    mutations: [{
      kind: 'delete',
      objectId: awareId,
      objectKind: 'person',
      original: {
        ...personProps,
      },
    }],
  });

  ctx.log(`Deleted person to clean up after test`);
};

const mergeSchedule = async (ctx: ScenarioContext) => {
  const awareId = v4();
  const scheduleProps = newSchedule();
  const validateResult = await ctx.getReply({
    kind: 'validate-change',
    provider: ctx.provider,
    refMap: {
      schedule: {
        [awareId]: [],
      }
    },
    devices: {},
    mutations: [{
      kind: 'merge',
      objectId: awareId,
      objectKind: 'schedule',
      original: null,
      props: scheduleProps,
    }],
  });

  if (validateResult.issues.length > 0) {
    return scenarioFail(`Expected 0 issues, got ${validateResult.issues.length}`);
  }

  ctx.log(`Validation passed with 0 issues as expected`);

  const applyResult = await ctx.getReply({
    kind: 'apply-change',
    provider: ctx.provider,
    refMap: {
      schedule: {
        [awareId]: [],
      }
    },
    devices: {},
    mutations: [{
      kind: 'merge',
      objectId: awareId,
      objectKind: 'schedule',
      original: null,
      props: scheduleProps,
    }],
  });

  const references = applyResult.refs.schedule?.[awareId] || [];
  if (references.length < 1) {
    return scenarioFail(`Expected 1 reference, got ${references.length}`);
  }

  ctx.log(`Apply succeeded with ${references.length} reference(s) as expected`);

  // delete the schedule to clean up after test
  await ctx.getReply({
    kind: 'apply-change',
    provider: ctx.provider,
    refMap: {
      schedule: {
        [awareId]: references,
      }
    },
    devices: {},
    mutations: [{
      kind: 'delete',
      objectId: awareId,
      objectKind: 'schedule',
      original: {
        ...scheduleProps,
      },
    }],
  });

  ctx.log(`Deleted schedule to clean up after test`);
};

const mergeZone = async (ctx: ScenarioContext) => {
  // TODO implement when we have a test provider that supports zones
};

const mergeAccessRule = async (ctx: ScenarioContext) => {
  // TODO implement when we have a test provider that supports access rules
};

const s: Scenario = {
  tags: ['access'],
  name: 'Access Sync: Merges Access Objects it supports',
  description: 'Access Sync: Merges Access Objects it supports',
  run: async (ctx) => {
    await ctx.getReply({
      kind: 'start',
      provider: ctx.provider,
      config: ctx.config,
      lastEventForeignRef: null,
      lastEventTimestamp: null,
    });

    const accessObjects = ctx.registerPayload.accessControlProviders ? ctx.registerPayload.accessControlProviders[ctx.provider].accessObjects : [];

    if (accessObjects.includes('person')) {
      ctx.log(`Provider supports 'person' access object, testing merge...`);
      await mergePerson(ctx);
    }

    if (accessObjects.includes('schedule')) {
      ctx.log(`Provider supports 'schedule' access object, testing merge...`);
      await mergeSchedule(ctx);
    }

    if (accessObjects.includes('zone')) {
      ctx.log(`Provider supports 'zone' access object, testing merge...`);
      await mergeZone(ctx);
    }

    if (accessObjects.includes('accessRule')) {
      ctx.log(`Provider supports 'accessRule' access object, testing merge...`);
      await mergeAccessRule(ctx);
    }

    await ctx.getReply({
      kind: 'stop',
      provider: ctx.provider,
    });

    return scenarioPass();
  },
};

export default s;
