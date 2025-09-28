import type { DeviceDiscoveryDto, RunCommandRq } from '@awarevue/api-types';
import { lastValueFrom, of } from 'rxjs';
import { AgentBuilder } from './agent-builder';
import type { DeviceActivity } from './agent-app';

const baseContext = { provider: 'test-provider', config: {} } as const;
const deviceCatalog = {
  devices: [],
  relations: [],
} as unknown as DeviceDiscoveryDto;
const runContext = {
  ...baseContext,
  deviceCatalog,
  lastEventForeignRef: null,
  lastEventTimestamp: null,
};
const runCommandContext = {
  ...baseContext,
  deviceCatalog,
};
const activity: DeviceActivity = {
  kind: 'state',
  foreignRef: 'device-1',
  mergeProps: {},
  removeProps: [],
};
const command: RunCommandRq = {
  kind: 'command',
  device: {
    name: 'device',
    foreignRef: 'device-1',
    provider: baseContext.provider,
    providerMetadata: {},
  },
  command: 'noop',
};

const createBaseBuilder = () =>
  AgentBuilder.create()
    .withConfigIssues(() => [])
    .withRun(() => of(activity))
    .withCommandRunner(() => Promise.resolve('ok'));

describe('AgentBuilder', () => {
  it('requires mandatory handlers before build', () => {
    const builder = AgentBuilder.create();
    expect(() => builder.build()).toThrow('config issues handler');
  });

  it('builds an agent and routes query handlers per query type', async () => {
    const agent = createBaseBuilder()
      .handleQuery(
        'foo',
        (_, params: { value: number }) => `foo-${params.value}`,
      )
      .handleQuery('bar', (_, params: { flag: boolean }) => of(params.flag))
      .onUnknownQuery((_, query, params) => ({ missing: { query, params } }))
      .build();

    await expect(
      lastValueFrom(agent.getConfigIssues$(baseContext)),
    ).resolves.toEqual([]);

    await expect(lastValueFrom(agent.run$(runContext))).resolves.toEqual(
      activity,
    );

    await expect(
      lastValueFrom(agent.runCommand$(runCommandContext, command)),
    ).resolves.toBe('ok');

    await expect(
      lastValueFrom(agent.query$(baseContext, 'foo', { value: 42 })),
    ).resolves.toBe('foo-42');

    await expect(
      lastValueFrom(agent.query$(baseContext, 'bar', { flag: true })),
    ).resolves.toBe(true);

    await expect(
      lastValueFrom(agent.query$(baseContext, 'unknown', { reason: 'test' })),
    ).resolves.toEqual({
      missing: { query: 'unknown', params: { reason: 'test' } },
    });
  });

  it('errors when no query handler is registered for a query', async () => {
    const agent = createBaseBuilder().build();

    await expect(
      lastValueFrom(agent.query$(baseContext, 'missing', {})),
    ).rejects.toThrow('No query handler registered for "missing"');
  });
});
