import { Observable } from 'rxjs';

/** What the SDK expects from a transport */
export interface Transport<TIn = any, TOut = any> {
  readonly connected$: Observable<boolean>;
  readonly messages$: Observable<TIn>;
  readonly errors$: Observable<Error>;
  send(msg: TOut): void;
  close(): void;
}
