import { describe, expect, it } from 'vitest';
import { dispatchRefreshRequest, getRefreshConfig } from '../lib/refreshClient';

describe('browser refresh client', () => {
  it('treats missing or relative refresh endpoints as not configured', () => {
    expect(getRefreshConfig({}).endpointUrl).toBeNull();
    expect(getRefreshConfig({ VITE_REFRESH_DISPATCH_URL: '/api/refresh' }).endpointUrl).toBeNull();
  });

  it('accepts an absolute public dispatch endpoint and docs URL', () => {
    const config = getRefreshConfig({
      VITE_REFRESH_DISPATCH_URL: 'https://refresh.example.com/dispatch',
      VITE_REFRESH_DOCS_URL: 'https://docs.example.com/refresh',
    });

    expect(config).toEqual({
      endpointUrl: 'https://refresh.example.com/dispatch',
      docsUrl: 'https://docs.example.com/refresh',
    });
  });

  it('posts a user-provided passphrase to the configured endpoint', async () => {
    const requests: RequestInit[] = [];
    const result = await dispatchRefreshRequest({
      endpointUrl: 'https://refresh.example.com/dispatch',
      refreshToken: 'typed-passphrase',
      fetcher: async (_input, init) => {
        requests.push(init ?? {});

        return new Response(
          JSON.stringify({
            status: 'queued',
            message: 'Refresh workflow dispatch accepted.',
          }),
          { status: 202 },
        );
      },
    });

    expect(result).toEqual({
      ok: true,
      status: 'queued',
      message: 'Refresh workflow dispatch accepted.',
      httpStatus: 202,
    });
    expect(requests[0]).toMatchObject({
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-refresh-token': 'typed-passphrase',
      },
    });
  });

  it('returns clear errors without calling fetch when passphrase is empty', async () => {
    let called = false;
    const result = await dispatchRefreshRequest({
      endpointUrl: 'https://refresh.example.com/dispatch',
      refreshToken: ' ',
      fetcher: async () => {
        called = true;
        return new Response('{}');
      },
    });

    expect(result).toEqual({
      ok: false,
      status: 'error',
      message: 'Refresh passphrase is required.',
    });
    expect(called).toBe(false);
  });
});
