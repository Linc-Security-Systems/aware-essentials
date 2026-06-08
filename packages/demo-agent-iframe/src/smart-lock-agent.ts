import { Observable, of, timer, from, mergeMap, Subject, tap } from 'rxjs';
import {
  Agent,
  Context,
  RunContext,
  RunCommandContext,
  DeviceActivity,
} from '@awarevue/agent-sdk';
import {
  DeviceDiscoveryDto,
  ProviderSpecs,
  RunCommandRq,
} from '@awarevue/api-types';

/* ---------------------------------------------------------------- */
/* Lock state + observable for UI updates                          */
/* ---------------------------------------------------------------- */

export interface LockInfo {
  name: string;
  locked: boolean;
}

export const lockStates: Record<string, LockInfo> = {
  'door-front':   { name: 'Front Door', locked: true },
  'door-back':    { name: 'Back Door',  locked: false },
  'door-garage':  { name: 'Garage',     locked: true },
};

/** Emits every time a lock state is pushed (for UI rendering). */
export const lockStateChange$ = new Subject<{ foreignRef: string; locked: boolean }>();

/* ---------------------------------------------------------------- */
/* Provider metadata                                                */
/* ---------------------------------------------------------------- */

export const PROVIDER = 'smart-locks';

export const providers: Record<string, ProviderSpecs> = {
  [PROVIDER]: {
    title: 'Smart Lock Controller',
    configSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
    configDefault: {},
  },
};

/* ---------------------------------------------------------------- */
/* Agent implementation                                             */
/* ---------------------------------------------------------------- */

export const smartLockAgent: Agent = {
  getConfigIssues$(_ctx: Context): Observable<[]> {
    return of([]);
  },

  getDevicesAndRelations$(_ctx: Context): Observable<DeviceDiscoveryDto> {
    const devices = Object.entries(lockStates).map(([foreignRef, info]) => ({
      name: info.name,
      foreignRef,
      provider: PROVIDER,
      providerMetadata: {},
      // Door device specs
      type: 'door' as const,
      canReportOpenState: false,
      canReportLockState: true,
      canControlLock: true,
      canRelease: false,
    }));
    return of({ devices, relations: [] });
  },

  run$(_ctx: RunContext): Observable<DeviceActivity> {
    // Emit initial state for all doors immediately, then push one
    // random state update every 5 seconds.
    return timer(0, 5_000).pipe(
      mergeMap((tick) => {
        if (tick === 0) {
          // Push all door states at startup
          return from(
            Object.entries(lockStates).map(([foreignRef, info]) => ({
              kind: 'state' as const,
              foreignRef,
              mergeProps: { locked: info.locked, connected: true },
              removeProps: [],
            })),
          ).pipe(
            tap((activity) => {
              lockStateChange$.next({
                foreignRef: activity.foreignRef,
                locked: activity.mergeProps['locked'] as boolean,
              });
            }),
          );
        }

        // Simulate occasional random state change
        const keys = Object.keys(lockStates);
        const foreignRef = keys[Math.floor(Math.random() * keys.length)];
        lockStates[foreignRef].locked = !lockStates[foreignRef].locked;

        const locked = lockStates[foreignRef].locked;
        lockStateChange$.next({ foreignRef, locked });

        return of({
          kind: 'state' as const,
          foreignRef,
          mergeProps: { locked },
          removeProps: [],
        });
      }),
    );
  },

  runCommand$(
    _ctx: RunCommandContext,
    _command: RunCommandRq,
  ): Observable<unknown> {
    // Not used in this demo
    return of(null);
  },
};
