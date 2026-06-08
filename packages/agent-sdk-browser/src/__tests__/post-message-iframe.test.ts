import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { firstValueFrom, take, toArray } from 'rxjs';
import { PostMessageIframeDuplexTransport } from '../post-message-iframe';

/* ---------------------------------------------------------------- */
/* Helpers                                                          */
/* ---------------------------------------------------------------- */

function dispatchMessage(data: unknown, origin = 'http://host.test', source: Window | null = null) {
  window.dispatchEvent(
    new MessageEvent('message', { data, origin, source: source ?? window }),
  );
}

/* ---------------------------------------------------------------- */
/* Tests                                                            */
/* ---------------------------------------------------------------- */

describe('PostMessageIframeDuplexTransport', () => {
  let postMessageSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    postMessageSpy = vi.fn();
    vi.spyOn(window, 'parent', 'get').mockReturnValue(
      { postMessage: postMessageSpy } as unknown as Window,
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /* -- messages$ ------------------------------------------------- */

  it('delivers string messages from window message events', async () => {
    const transport = new PostMessageIframeDuplexTransport();

    const received = firstValueFrom(transport.messages$.pipe(take(1)));
    dispatchMessage('hello');

    expect(await received).toBe('hello');
    transport.close();
  });

  it('delivers multiple messages in order', async () => {
    const transport = new PostMessageIframeDuplexTransport();

    const received = firstValueFrom(transport.messages$.pipe(take(2), toArray()));
    dispatchMessage('first');
    dispatchMessage('second');

    expect(await received).toEqual(['first', 'second']);
    transport.close();
  });

  it('ignores non-string message data', () => {
    const transport = new PostMessageIframeDuplexTransport();
    const received: string[] = [];
    const sub = transport.messages$.subscribe((m) => received.push(m));

    dispatchMessage({ not: 'a string' });
    dispatchMessage(42);
    dispatchMessage('valid');

    expect(received).toEqual(['valid']);
    sub.unsubscribe();
    transport.close();
  });

  /* -- origin filtering ------------------------------------------ */

  it('accepts messages from any origin when targetOrigin is * (default)', () => {
    const transport = new PostMessageIframeDuplexTransport();
    const received: string[] = [];
    const sub = transport.messages$.subscribe((m) => received.push(m));

    dispatchMessage('msg-a', 'http://host-a.test');
    dispatchMessage('msg-b', 'http://host-b.test');

    expect(received).toEqual(['msg-a', 'msg-b']);
    sub.unsubscribe();
    transport.close();
  });

  it('filters out messages from wrong origins when targetOrigin is set', () => {
    const transport = new PostMessageIframeDuplexTransport({
      targetOrigin: 'http://host.test',
    });
    const received: string[] = [];
    const sub = transport.messages$.subscribe((m) => received.push(m));

    dispatchMessage('wrong', 'http://evil.test');
    dispatchMessage('correct', 'http://host.test');

    expect(received).toEqual(['correct']);
    sub.unsubscribe();
    transport.close();
  });

  /* -- send() ---------------------------------------------------- */

  it('calls window.parent.postMessage with message and default targetOrigin *', () => {
    const transport = new PostMessageIframeDuplexTransport();
    transport.send('outbound');

    expect(postMessageSpy).toHaveBeenCalledOnce();
    expect(postMessageSpy).toHaveBeenCalledWith('outbound', '*');
    transport.close();
  });

  it('uses configured targetOrigin when sending', () => {
    const transport = new PostMessageIframeDuplexTransport({
      targetOrigin: 'https://app.example.com',
    });
    transport.send('secure-msg');

    expect(postMessageSpy).toHaveBeenCalledWith('secure-msg', 'https://app.example.com');
    transport.close();
  });

  /* -- connected$ and close() ------------------------------------ */

  it('starts with connected$ = true', async () => {
    const transport = new PostMessageIframeDuplexTransport();
    const value = await firstValueFrom(transport.connected$);
    expect(value).toBe(true);
    transport.close();
  });

  it('emits false on connected$ after close()', async () => {
    const transport = new PostMessageIframeDuplexTransport();
    const values = firstValueFrom(transport.connected$.pipe(toArray()));
    transport.close();
    expect(await values).toContain(false);
  });

  it('stops delivering messages after close()', () => {
    const transport = new PostMessageIframeDuplexTransport();
    const received: string[] = [];
    transport.messages$.subscribe((m) => received.push(m));

    transport.close();
    dispatchMessage('after-close');

    expect(received).toHaveLength(0);
  });

  it('is idempotent — calling close() twice does not throw', () => {
    const transport = new PostMessageIframeDuplexTransport();
    expect(() => {
      transport.close();
      transport.close();
    }).not.toThrow();
  });
});
