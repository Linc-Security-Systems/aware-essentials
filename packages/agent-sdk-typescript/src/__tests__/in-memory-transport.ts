import { BehaviorSubject, Subject } from 'rxjs';
import { DuplexTransport } from '../transport_types';

/**
 * Creates a linked pair of in-process DuplexTransports.
 * Writing to one side is immediately readable on the other.
 * No serialization, no network — pure in-memory for testing.
 */
export function createTransportPair<TA, TB>(): [
  DuplexTransport<TA, TB>,
  DuplexTransport<TB, TA>,
] {
  const aToB = new Subject<TB>();
  const bToA = new Subject<TA>();
  const aConnected = new BehaviorSubject(true);
  const bConnected = new BehaviorSubject(true);

  const close = () => {
    aConnected.next(false);
    bConnected.next(false);
    aConnected.complete();
    bConnected.complete();
    aToB.complete();
    bToA.complete();
  };

  const sideA: DuplexTransport<TA, TB> = {
    connected$: aConnected.asObservable(),
    messages$: bToA.asObservable(),
    send: (msg: TB) => {
      if (aConnected.value) aToB.next(msg);
    },
    close,
  };

  const sideB: DuplexTransport<TB, TA> = {
    connected$: bConnected.asObservable(),
    messages$: aToB.asObservable(),
    send: (msg: TA) => {
      if (bConnected.value) bToA.next(msg);
    },
    close,
  };

  return [sideA, sideB];
}
