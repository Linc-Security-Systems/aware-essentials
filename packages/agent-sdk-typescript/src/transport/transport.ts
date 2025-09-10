import { Observable } from 'rxjs';

/** What the SDK expects from a transport */
export interface Transport<TIn = any, TOut = any, TPeer = any> {
  readonly connected$: Observable<[boolean, TPeer]>;
  readonly messages$: Observable<[TIn, TPeer]>;
  send(msg: TOut, to: TPeer | null): void;
  close(): void;
}
