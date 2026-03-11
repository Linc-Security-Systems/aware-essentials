import { v4 } from "uuid";
import {
  Scenario,
  ScenarioContext,
  ScenarioResult,
  scenarioFail,
  scenarioPass,
} from "../../scenario.types";
import { newPerson } from "./_utils";

const isScenarioFailResult = (
  v: unknown,
): v is Omit<ScenarioResult, "durationMs"> =>
  typeof v === "object" && v !== null && "passed" in v;

const createPerson = async (
  ctx: ScenarioContext,
  person: { awareId: string; person: ReturnType<typeof newPerson> },
) => {
  const validateResult = await ctx.getReply({
    kind: "validate-change",
    provider: ctx.provider,
    refMap: {
      person: {
        [person.awareId]: [],
      },
    },
    devices: {},
    mutations: [
      {
        kind: "merge",
        objectId: person.awareId,
        objectKind: "person",
        original: null,
        props: person.person,
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
        [person.awareId]: [],
      },
    },
    devices: {},
    mutations: [
      {
        kind: "merge",
        objectId: person.awareId,
        objectKind: "person",
        original: null,
        props: person.person,
      },
    ],
  });

  const references = applyResult.refs.person?.[person.awareId] || [];
  if (references.length < 1) {
    return scenarioFail(`Expected 1 reference, got ${references.length}`);
  }

  ctx.log(`Apply succeeded with ${references.length} reference(s) as expected`);

  return references;
};

//Create 4 people and ensure they all have unique references
const createPeople = async (ctx: ScenarioContext) => {
  const person1 = { awareId: v4(), person: newPerson() };
  const person2 = { awareId: v4(), person: newPerson() };
  const person3 = { awareId: v4(), person: newPerson() };
  const person4 = { awareId: v4(), person: newPerson() };

  ctx.log(`Creating four people`);

  const ref1 = await createPerson(ctx, person1);
  const ref2 = await createPerson(ctx, person2);
  const ref3 = await createPerson(ctx, person3);
  const ref4 = await createPerson(ctx, person4);

  //If any of the refs is a ScenarioResult indicating failure return it
  if (isScenarioFailResult(ref1)) return ref1;
  if (isScenarioFailResult(ref2)) return ref2;
  if (isScenarioFailResult(ref3)) return ref3;
  if (isScenarioFailResult(ref4)) return ref4;

  const flatRefs = [ref1, ref2, ref3, ref4].flat();
  const uniqueRefs = new Set(flatRefs);
  if (uniqueRefs.size !== flatRefs.length) {
    return scenarioFail(
      `Expected all references to be unique, but found duplicates`,
    );
  }

  ctx.log(`All created people have unique references as expected`);

  return [
    { person: person1, refs: ref1 },
    { person: person2, refs: ref2 },
    { person: person3, refs: ref3 },
    { person: person4, refs: ref4 },
  ];
};

// const deletePerson = async (ctx: ScenarioContext, awareId: string) => {
//     // delete the person to clean up after test
//   await ctx.getReply({
//     kind: "apply-change",
//     provider: ctx.provider,
//     refMap: {
//       person: {
//         [awareId]: references,
//       },
//     },
//     devices: {},
//     mutations: [
//       {
//         kind: "delete",
//         objectId: awareId,
//         objectKind: "person",
//         original: {
//           ...personProps,
//         },
//       },
//     ],
//   });

//   ctx.log(`Deleted person`);
// };

const deletePeople = async (
  ctx: ScenarioContext,
  people: {
    person: {
      awareId: string;
      person: ReturnType<typeof newPerson>;
    };
    refs: string[];
  }[],
) => {
  await Promise.all(
    people.map(({ refs, person }) =>
      ctx.getReply({
        kind: "apply-change",
        provider: ctx.provider,
        refMap: {
          person: {
            [person.awareId]: refs,
          },
        },
        devices: {},
        mutations: [
          {
            kind: "delete",
            objectId: person.awareId,
            objectKind: "person",
            original: person.person,
          },
        ],
      }),
    ),
  );

  ctx.log(`Deleted all created people`);
};

const s: Scenario = {
  tags: ["access"],
  name: "Access Sync: Person CRUD operations work correctly",
  description: "Access Sync: Person CRUD operations work correctly",
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
      ctx.log(`Provider supports 'person' access object, testing ...`);
      const people = await createPeople(ctx);

      // createPeople itself may return a ScenarioResult on failure
      if (isScenarioFailResult(people)) {
        return people;
      }

      await deletePeople(ctx, people);
    }

    await ctx.getReply({
      kind: "stop",
      provider: ctx.provider,
    });

    return scenarioPass();
  },
};

export default s;
