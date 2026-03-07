import { FromAgent, Message } from '@awarevue/api-types';
import {
  Observable,
  Subject,
  Subscription,
  filter,
  firstValueFrom,
  map,
  take,
  timeout,
  race,
  merge,
} from 'rxjs';
import { DeviceState, DeviceStateStore } from '../scenario.types';

/**
 * Concrete implementation of {@link DeviceStateStore}.
 *
 * Subscribes to the agent's raw message stream, intercepts `state` messages,
 * and reduces them into accumulated per-device state maps using the protocol's
 * merge/remove semantics.
 *
 * Create one instance per scenario (via {@link create}), call {@link dispose}
 * when the scenario finishes.
 */
export class DeviceStateStoreImpl implements DeviceStateStore {
  /** Accumulated state per device (keyed by foreignRef). */
  private readonly states = new Map<string, DeviceState>();

  /** Emits after every state reduction. */
  private readonly changes$ = new Subject<{
    foreignRef: string;
    state: DeviceState;
  }>();

  /** Subscription to the transport's message stream. */
  private readonly subscription: Subscription;

  /** Default timeout for wait/assert operations. */
  private readonly defaultTimeoutMs: number;

  constructor(
    messages$: Observable<Message<FromAgent>>,
    defaultTimeoutMs: number,
  ) {
    this.defaultTimeoutMs = defaultTimeoutMs;

    this.subscription = messages$
      .pipe(filter((msg) => msg.kind === 'state'))
      .subscribe((msg) => {
        if (msg.kind !== 'state') return; // type narrowing
        this.reduce(msg.foreignRef, msg.mergeProps, msg.removeProps);
      });
  }

  /* ---------------------------------------------------------------- */
  /* Observe                                                          */
  /* ---------------------------------------------------------------- */

  get(foreignRef: string): DeviceState | undefined {
    const state = this.states.get(foreignRef);
    return state ? { ...state } : undefined;
  }

  getAll(): ReadonlyMap<string, DeviceState> {
    return this.states;
  }

  has(foreignRef: string): boolean {
    return this.states.has(foreignRef);
  }

  /* ---------------------------------------------------------------- */
  /* Wait                                                             */
  /* ---------------------------------------------------------------- */

  async waitUntil(
    foreignRef: string,
    predicate: (state: DeviceState) => boolean,
    timeoutMs?: number,
  ): Promise<DeviceState> {
    // Check current state first — resolve immediately if already satisfied
    const current = this.states.get(foreignRef);
    if (current && predicate(current)) {
      return { ...current };
    }

    return firstValueFrom(
      this.changes$.pipe(
        filter((c) => c.foreignRef === foreignRef),
        map((c) => c.state),
        filter((state) => predicate(state)),
        map((state) => ({ ...state })),
        take(1),
        timeout(timeoutMs ?? this.defaultTimeoutMs),
      ),
    );
  }

  async waitForChange(
    foreignRef: string,
    timeoutMs?: number,
  ): Promise<DeviceState> {
    // Always waits for the NEXT change — ignores current state
    return firstValueFrom(
      this.changes$.pipe(
        filter((c) => c.foreignRef === foreignRef),
        map((c) => ({ ...c.state })),
        take(1),
        timeout(timeoutMs ?? this.defaultTimeoutMs),
      ),
    );
  }

  async waitForDevices(
    foreignRefs: string[],
    predicate: (state: DeviceState) => boolean,
    timeoutMs?: number,
  ): Promise<Map<string, DeviceState>> {
    const effectiveTimeout = timeoutMs ?? this.defaultTimeoutMs;
    const result = new Map<string, DeviceState>();

    // Resolve all devices in parallel, sharing the same timeout deadline
    const deadline = Date.now() + effectiveTimeout;

    await Promise.all(
      foreignRefs.map(async (ref) => {
        const remaining = deadline - Date.now();
        if (remaining <= 0) {
          throw new Error(
            `waitForDevices: timed out before checking device '${ref}'`,
          );
        }
        const state = await this.waitUntil(ref, predicate, remaining);
        result.set(ref, state);
      }),
    );

    return result;
  }

  /* ---------------------------------------------------------------- */
  /* Assert                                                           */
  /* ---------------------------------------------------------------- */

  async assertState(
    foreignRef: string,
    predicate: (state: DeviceState) => boolean,
    message: string,
    timeoutMs?: number,
  ): Promise<void> {
    try {
      await this.waitUntil(foreignRef, predicate, timeoutMs);
    } catch {
      const current = this.states.get(foreignRef);
      const stateDesc = current
        ? JSON.stringify(current, null, 2)
        : 'no state received';
      throw new Error(
        `${message} — device '${foreignRef}' current state: ${stateDesc}`,
      );
    }
  }

  /* ---------------------------------------------------------------- */
  /* Lifecycle                                                        */
  /* ---------------------------------------------------------------- */

  /** Stop listening and release resources. Call after each scenario. */
  dispose(): void {
    this.subscription.unsubscribe();
    this.changes$.complete();
  }

  /* ---------------------------------------------------------------- */
  /* Internal                                                         */
  /* ---------------------------------------------------------------- */

  /**
   * Apply merge/remove semantics to accumulate state for a device,
   * mirroring how the real server reduces agent state updates.
   */
  private reduce(
    foreignRef: string,
    mergeProps: Record<string, unknown>,
    removeProps: string[],
  ): void {
    let state = this.states.get(foreignRef) ?? {};

    // Merge incoming properties
    state = { ...state, ...mergeProps };

    // Remove requested keys
    for (const key of removeProps) {
      delete state[key];
    }

    this.states.set(foreignRef, state);
    this.changes$.next({ foreignRef, state: { ...state } });
  }
}
