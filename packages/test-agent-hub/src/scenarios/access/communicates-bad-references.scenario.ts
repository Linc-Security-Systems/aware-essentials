import { CreatePersonRequest } from "@awarevue/api-types";
import { v4 } from "uuid";
import { Scenario, scenarioFail, scenarioPass } from "../../scenario.types";

export const newPerson = (): CreatePersonRequest => ({
  firstName: v4(),
  lastName: v4(),
  position: null,
  type: 'staff',
  validFrom: null,
  validTo: null,
  accessSuspended: false,
  accessRules: [],
  credentials: [],
  avatarId: null,
  staffMember: false,
  customFields: {},
});


const s: Scenario = {
  tags: ['access'],
  name: 'Access Sync: Communicates Bad References',
  description: 'Access Sync: Communicates Bad References',
  run: async (ctx) => {
    await ctx.getReply({
      kind: 'start',
      provider: ctx.provider,
      config: ctx.config,
      lastEventForeignRef: null,
      lastEventTimestamp: null,
    });

    const awareId = "test-person-123";
    const validateResult = await ctx.getReply({
      kind: 'validate-change',
      provider: ctx.provider,
      refMap: {
        person: {
          [awareId]: ["ffff234f"],
        }
      },
      devices: {},
      mutations: [{
        kind: 'merge',
        objectId: awareId,
        objectKind: 'person',
        original: null,
        props: newPerson(),
      }],
    });

    if (validateResult.issues.length !== 1) {
      return scenarioFail(`Expected 1 issue, got ${validateResult.issues.length}`);
    }

      const issue = validateResult.issues[0];
      if (issue.code !== 'BAD_REFERENCE') {
        return scenarioFail(`Expected issue code 'BAD_REFERENCE', got '${issue.code}'`);
      }

    await ctx.getReply({
      kind: 'stop',
      provider: ctx.provider,
    });

    return scenarioPass();
  },
};

export default s;
