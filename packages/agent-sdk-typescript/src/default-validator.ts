import {
  AccessChangeIssue,
  AccessObjectKind,
  AccessValidateChangeRq,
} from '@awarevue/api-types';
import { Agent, Context } from './agent';
import { forkJoin, mergeMap, of } from 'rxjs';

const emptyMap = {} as Record<string, Record<string, unknown>>;

export const createValidator = <T extends Agent>(agent: T) => {
  const getNotFoundIssues = (req: AccessValidateChangeRq) => {
    // check object ref contains all related objects
    const personIds = [
      ...new Set(
        req.mutations.flatMap((m) =>
          m.kind === 'merge' && m.objectKind === 'accessRule'
            ? ((m.props.appliedTo ?? []) as string[])
            : [],
        ),
      ),
    ];
    const scheduleIds = [
      ...new Set(
        req.mutations.flatMap((m) =>
          m.kind === 'merge' && m.objectKind === 'accessRule'
            ? [
                ...(m.props.permissions || []).map((p) => p.scheduleId),
                ...(m.props.groupPermissions || []).map((p) => p.scheduleId),
              ]
            : [],
        ),
      ),
    ];
    const notFoundPersonIds = personIds.filter((p) => !req.refMap['person'][p]);
    const notFoundScheduleIds = scheduleIds.filter(
      (s) => !req.refMap['schedule'][s],
    );
    return [
      ...notFoundPersonIds.map(
        (id) =>
          ({
            code: 'NOT_FOUND',
            objectId: id,
            objectKind: 'person',
          }) as AccessChangeIssue,
      ),
      ...notFoundScheduleIds.map(
        (id) =>
          ({
            code: 'NOT_FOUND',
            objectId: id,
            objectKind: 'schedule',
          }) as AccessChangeIssue,
      ),
    ];
  };

  const getBadReferenceIssues$ = (
    context: Context,
    req: AccessValidateChangeRq,
  ) => {
    if (!agent.find$) return [];
    const personIds = Object.entries(req.refMap['person'] || {}).flatMap(
      ([objectId, refs]) => refs.map((ref) => ({ objectId, ref })),
    );
    const scheduleIds = Object.entries(req.refMap['schedule'] || {}).flatMap(
      ([objectId, refs]) => refs.map((ref) => ({ objectId, ref })),
    );
    const ruleIds = Object.entries(req.refMap['accessRule'] || {}).flatMap(
      ([objectId, refs]) => refs.map((ref) => ({ objectId, ref })),
    );
    const zoneIds = Object.entries(req.refMap['zone'] || {}).flatMap(
      ([objectId, refs]) => refs.map((ref) => ({ objectId, ref })),
    );

    return forkJoin([
      // load persons
      personIds.length < 1
        ? of(emptyMap)
        : agent.find$(
            context,
            'person',
            personIds.map((p) => p.ref),
          ),
      // load schedules
      scheduleIds.length < 1
        ? of(emptyMap)
        : agent.find$(
            context,
            'schedule',
            scheduleIds.map((p) => p.ref),
          ),
      // load rules
      ruleIds.length < 1
        ? of(emptyMap)
        : agent.find$(
            context,
            'accessRule',
            ruleIds.map((p) => p.ref),
          ),
      // load zones
      zoneIds.length < 1
        ? of(emptyMap)
        : agent.find$(
            context,
            'zone',
            zoneIds.map((p) => p.ref),
          ),
    ]).pipe(
      mergeMap(([persons, schedules, rules, zones]) => {
        const issues: AccessChangeIssue[] = [];
        // check persons
        for (const personId of personIds) {
          if (!persons[personId.ref]) {
            issues.push({
              code: 'BAD_REFERENCE',
              objectId: personId.objectId,
              objectKind: 'person',
            });
          }
        }
        // check schedules
        for (const scheduleId of scheduleIds) {
          if (!schedules[scheduleId.ref]) {
            issues.push({
              code: 'BAD_REFERENCE',
              objectId: scheduleId.objectId,
              objectKind: 'schedule',
            });
          }
        }
        // check rules
        for (const ruleId of ruleIds) {
          if (!rules['accessRule']?.[ruleId.ref]) {
            issues.push({
              code: 'BAD_REFERENCE',
              objectId: ruleId.ref,
              objectKind: 'accessRule',
            });
          }
        }
        // check zones
        for (const zoneId of zoneIds) {
          if (!zones['zone']?.[zoneId.ref]) {
            issues.push({
              code: 'BAD_REFERENCE',
              objectId: zoneId.objectId,
              objectKind: 'zone',
            });
          }
        }
        return of([
          issues,
          {
            person: persons,
            schedule: schedules,
            accessRule: rules,
            zone: zones,
          } as Record<
            AccessObjectKind,
            Record<string, Record<string, unknown>>
          >,
        ] as const);
      }),
    );
  };

  return (context: Context, change: AccessValidateChangeRq) => {
    return forkJoin([
      of(getNotFoundIssues(change)),
      getBadReferenceIssues$(context, change),
    ]).pipe(
      mergeMap(([notFoundIssues, [badReferenceIssues, cache]]) =>
        of([
          [...notFoundIssues, ...badReferenceIssues] as AccessChangeIssue[],
          cache as Record<
            AccessObjectKind,
            Record<string, Record<string, unknown>>
          >,
        ] as const),
      ),
    );
  };
};
