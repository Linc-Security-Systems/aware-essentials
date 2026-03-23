import { v4 } from "uuid";
import { Scenario, scenarioFail, scenarioPass } from "../../scenario.types";
import { newRule } from "./_utils";

const s: Scenario = {
  tags: ["access"],
  name: "Access Sync: Communicates Not Found When access objects referred to do not have references",
  description:
    "Access Sync: Communicates Not Found When access objects referred to do not have references",
  run: async (ctx) => {
    await ctx.getReply({
      kind: "start",
      provider: ctx.provider,
      config: ctx.config,
      lastEventForeignRef: null,
      lastEventTimestamp: null,
    });

    const devices = await ctx.getReply({
      kind: "get-available-devices",
      provider: ctx.provider,
    });

    const [reader] = devices.devices.filter((d) => d.type === "reader");
    const readerId = v4();
    const accessRuleId = "test-access-rule-123";
    const accessRuleProps = {
      ...newRule(),
      appliedTo: ["p1", "p2"],
      permissions: [{ deviceId: readerId, scheduleId: "s1" }],
    };

    const validateResult = await ctx.getReply({
      kind: "validate-change",
      provider: ctx.provider,
      refMap: {
        accessRule: {},
        person: {},
        schedule: {},
      },
      devices: {
        reader: {
          [readerId]: [reader.foreignRef],
        },
      },
      mutations: [
        {
          kind: "merge",
          objectId: accessRuleId,
          objectKind: "accessRule",
          original: null,
          props: accessRuleProps,
        },
      ],
    });

    if (validateResult.issues.length !== 3) {
      return scenarioFail(
        `Expected 3 issues for missing references, got ${validateResult.issues.length}`,
      );
    }

    const expectedMissingRefs = [
      { kind: "schedule", id: "s1" },
      { kind: "person", id: "p1" },
      { kind: "person", id: "p2" },
    ];

    for (const expectedRef of expectedMissingRefs) {
      const issue = validateResult.issues.find((i) => i.code === "NOT_FOUND");
      if (!issue) {
        return scenarioFail(
          `Expected NOT_FOUND issue for ${expectedRef.kind} '${expectedRef.id}' was not found`,
        );
      }
    }

    ctx.log(
      `Validation correctly identified missing references for schedule and persons`,
    );
    await ctx.getReply({
      kind: "stop",
      provider: ctx.provider,
    });

    return scenarioPass();
  },
};

export default s;
