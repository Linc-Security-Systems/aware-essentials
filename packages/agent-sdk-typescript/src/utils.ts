import { FromAgent, FromServer } from '@awarevue/api-types';

let id = 0;

export const addEnvelope = <T extends FromAgent | FromServer>(
  version: number,
  agentId: string,
  payload: T,
) => ({
  ...payload,
  id: (++id).toString(),
  from: agentId,
  version,
  on: Date.now(),
});

export class RoutingTable<TUpstream, TDownstream> {
  private map = new Map<TUpstream, TDownstream>();
  private reverseMap = new Map<TDownstream, TUpstream>();

  set(key1: TUpstream, key2: TDownstream) {
    this.map.set(key1, key2);
    this.reverseMap.set(key2, key1);
  }

  getByUpstream(key1: TUpstream): TDownstream | undefined {
    return this.map.get(key1);
  }

  getByDownstream(key2: TDownstream): TUpstream | undefined {
    return this.reverseMap.get(key2);
  }

  deleteByUpstream(key1: TUpstream): void {
    const key2 = this.map.get(key1);
    if (key2) {
      this.map.delete(key1);
      this.reverseMap.delete(key2);
    }
  }

  deleteByDownstream(key2: TDownstream): void {
    const key1 = this.reverseMap.get(key2);
    if (key1) {
      this.reverseMap.delete(key2);
      this.map.delete(key1);
    }
  }
}
export const stringifyError = (error: unknown) => {
  if (error instanceof Error) {
    return `\nMessage: ${error.message}\nStack: ${error.stack}`;
  }
  if (typeof error === 'string') {
    return error;
  }
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
};
