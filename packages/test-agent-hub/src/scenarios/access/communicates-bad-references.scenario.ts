import { v4 } from "uuid";
import { Scenario, scenarioFail, scenarioPass } from "../../scenario.types";
import { newPerson, newSchedule } from "./_utils";

const s: Scenario = {
  tags: ["access"],
  name: "Access Sync: Communicates Bad References",
  description: "Access Sync: Communicates Bad References",
  run: async (ctx) => {
    await ctx.getReply({
      kind: "start",
      provider: ctx.provider,
      config: ctx.config,
      lastEventForeignRef: null,
      lastEventTimestamp: null,
    });

    const awareId = v4();
    const personInfo = newPerson();
    const validateResult = await ctx.getReply({
      kind: "validate-change",
      provider: ctx.provider,
      refMap: {
        person: {
          [awareId]: ["1112"],
        },
      },
      devices: {},
      mutations: [
        {
          kind: "merge",
          objectId: awareId,
          objectKind: "person",
          original: personInfo,
          props: personInfo,
        },
      ],
    });

    if (validateResult.issues.length !== 1) {
      return scenarioFail(
        `Expected 1 issue, got ${validateResult.issues.length}`,
      );
    }

    const issue = validateResult.issues[0];
    if (issue.code !== "BAD_REFERENCE") {
      return scenarioFail(
        `Expected issue code 'BAD_REFERENCE', got '${issue.code}'`,
      );
    }

    const scheduleId = v4();
    const scheduleInfo = newSchedule();
    const validateScheduleResult = await ctx.getReply({
      kind: "validate-change",
      provider: ctx.provider,
      refMap: {
        schedule: {
          [scheduleId]: ["313131"],
        },
      },
      devices: {},
      mutations: [
        {
          kind: "merge",
          objectId: scheduleId,
          objectKind: "schedule",
          original: scheduleInfo,
          props: scheduleInfo,
        },
      ],
    });

    if (validateScheduleResult.issues.length !== 1) {
      return scenarioFail(
        `Expected 1 issue, got ${validateScheduleResult.issues.length}`,
      );
    }

    const scheduleIssue = validateScheduleResult.issues[0];
    if (scheduleIssue.code !== "BAD_REFERENCE") {
      return scenarioFail(
        `Expected issue code 'BAD_REFERENCE', got '${scheduleIssue.code}'`,
      );
    }

    ctx.log(
      `Validation correctly identified bad references for both person and schedule`,
    );

    await ctx.getReply({
      kind: "stop",
      provider: ctx.provider,
    });

    return scenarioPass();
  },
};

export default s;
