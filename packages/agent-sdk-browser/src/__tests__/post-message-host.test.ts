import { describe, it, expect, vi, afterEach } from 'vitest';
import { firstValueFrom, toArray } from 'rxjs';
import { PostMessageHostDuplexTransport } from '../post-message-host';

/* ---------------------------------------------------------------- */
/* Helpers                                                          */
/* ---------------------------------------------------------------- */

function createFakeIframe() {
  const postMessageMock = vi.fn();
  const contentWindow = { postMessage: postMessageMock } as unknown as Window;
  const iframe = { contentWindow } as unknown as HTMLIFrameElement;
  return { iframe, postMessageMock, contentWindow };
}

function dispatchMessageFrom(
  source: Window,
  data: unknown,
  origin = 'http://agent.test',
) {
  window.dispatchEvent(new MessageEvent('message', { data, origin, source }));
}

/* ---------------------------------------------------------------- */
/* Tests                                                            */
/* ---------------------------------------------------------------- */

describe('PostMessageHostDuplexTransport', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  /* -- messages$ ------------------------------------------------- */

  it('delivers string messages whose source is the wrapped iframe', async () => {
    const { iframe, contentWindow } = createFakeIframe();
    const transport = new PostMessageHostDuplexTransport(iframe);

    const received = firstValueFrom(transport.messages$);
    dispatchMessageFrom(contentWindow, 'hello-from-agent');

    expect(await received).toBe('hello-from-agent');
    transport.close();
  });

  it('ignores messages from other sources', () => {
    const { iframe } = createFakeIframe();
    const transport = new PostMessageHostDuplexTransport(iframe);
    const received: string[] = [];
    const sub = transport.messages$.subscribe((m) => received.push(m));

    dispatchMessageFrom(window, 'from-parent-itself');

    expect(received).toHaveLength(0);
    sub.unsubscribe();
    transport.close();
  });

  it('ignores non-string message data', () => {
    const { iframe, contentWindow } = createFakeIframe();
    const transport = new PostMessageHostDuplexTransport(iframe);
    const received: string[] = [];
    const sub = transport.messages$.subscribe((m) => received.push(m));

    dispatchMessageFrom(contentWindow, { not: 'a string' });
    dispatchMessageFrom(contentWindow, 'valid');

    expect(received).toEqual(['valid']);
    sub.unsubscribe();
    transport.close();
  });

  /* -- origin filtering ------------------------------------------ */

  it('accepts messages from any origin when targetOrigin is * (default)', () => {
    const { iframe, contentWindow } = createFakeIframe();
    const transport = new PostMessageHostDuplexTransport(iframe);
    const received: string[] = [];
    const sub = transport.messages$.subscribe((m) => received.push(m));

    dispatchMessageFrom(contentWindow, 'msg-a', 'http://agent-a.test');
    dispatchMessageFrom(contentWindow, 'msg-b', 'http://agent-b.test');

    expect(received).toEqual(['msg-a', 'msg-b']);
    sub.unsubscribe();
    transport.close();
  });

  it('filters out messages from wrong origins when targetOrigin is set', () => {
    const { iframe, contentWindow } = createFakeIframe();
    const transport = new PostMessageHostDuplexTransport(iframe, 'http://agent.test');
    const received: string[] = [];
    const sub = transport.messages$.subscribe((m) => received.push(m));

    dispatchMessageFrom(contentWindow, 'wrong', 'http://evil.test');
    dispatchMessageFrom(contentWindow, 'correct', 'http://agent.test');

    expect(received).toEqual(['correct']);
    sub.unsubscribe();
    transport.close();
  });

  /* -- send() ---------------------------------------------------- */

  it('calls iframe.contentWindow.postMessage with message and default targetOrigin *', () => {
    const { iframe, postMessageMock } = createFakeIframe();
    const transport = new PostMessageHostDuplexTransport(iframe);
    transport.send('outbound-to-agent');

    expect(postMessageMock).toHaveBeenCalledOnce();
    expect(postMessageMock).toHaveBeenCalledWith('outbound-to-agent', '*');
    transport.close();
  });

  it('uses configured targetOrigin when sending', () => {
    const { iframe, postMessageMock } = createFakeIframe();
    const transport = new PostMessageHostDuplexTransport(iframe, 'https://agent.example.com');
    transport.send('secure-msg');

    expect(postMessageMock).toHaveBeenCalledWith('secure-msg', 'https://agent.example.com');
    transport.close();
  });

  /* -- connected$ and close() ------------------------------------ */

  it('starts with connected$ = true', async () => {
    const { iframe } = createFakeIframe();
    const transport = new PostMessageHostDuplexTransport(iframe);
    const value = await firstValueFrom(transport.connected$);
    expect(value).toBe(true);
    transport.close();
  });

  it('emits false on connected$ after close()', async () => {
    const { iframe } = createFakeIframe();
    const transport = new PostMessageHostDuplexTransport(iframe);
    const values = firstValueFrom(transport.connected$.pipe(toArray()));
    transport.close();
    expect(await values).toContain(false);
  });

  it('stops delivering messages after close()', () => {
    const { iframe, contentWindow } = createFakeIframe();
    const transport = new PostMessageHostDuplexTransport(iframe);
    const received: string[] = [];
    transport.messages$.subscribe((m) => received.push(m));

    transport.close();
    dispatchMessageFrom(contentWindow, 'after-close');

    expect(received).toHaveLength(0);
  });

  it('is idempotent — calling close() twice does not throw', () => {
    const { iframe } = createFakeIframe();
    const transport = new PostMessageHostDuplexTransport(iframe);
    expect(() => {
      transport.close();
      transport.close();
    }).not.toThrow();
  });
});
