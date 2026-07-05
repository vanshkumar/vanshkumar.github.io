const defaultRefreshDocsUrl =
  'https://github.com/vanshkumar/vanshkumar.github.io/blob/main/tennis-prize-money/docs/REFRESH_PIPELINE.md';

export interface RefreshEnvironment {
  readonly VITE_REFRESH_DISPATCH_URL?: string;
  readonly VITE_REFRESH_DOCS_URL?: string;
}

export interface RefreshConfig {
  endpointUrl: string | null;
  docsUrl: string;
}

export interface RefreshDispatchResult {
  ok: boolean;
  status: 'queued' | 'error';
  message: string;
  httpStatus?: number;
}

export function getRefreshConfig(
  env: RefreshEnvironment = import.meta.env,
): RefreshConfig {
  return {
    endpointUrl: parsePublicEndpoint(env.VITE_REFRESH_DISPATCH_URL),
    docsUrl: parseDocsUrl(env.VITE_REFRESH_DOCS_URL),
  };
}

export async function dispatchRefreshRequest({
  endpointUrl,
  refreshToken,
  fetcher = fetch,
}: {
  endpointUrl: string;
  refreshToken: string;
  fetcher?: typeof fetch;
}): Promise<RefreshDispatchResult> {
  if (refreshToken.trim().length === 0) {
    return {
      ok: false,
      status: 'error',
      message: 'Refresh passphrase is required.',
    };
  }

  let response: Response;
  try {
    response = await fetcher(endpointUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-refresh-token': refreshToken,
      },
      body: JSON.stringify({
        requestedFrom: 'tennis-prize-money-dashboard',
      }),
    });
  } catch {
    return {
      ok: false,
      status: 'error',
      message: 'Refresh endpoint could not be reached.',
    };
  }

  const payload = await readJsonPayload(response);
  const message =
    typeof payload.message === 'string' && payload.message.trim().length > 0
      ? payload.message
      : response.ok
        ? 'Refresh workflow dispatch accepted.'
        : `Refresh request failed with status ${response.status}.`;

  return {
    ok: response.ok,
    status: response.ok ? 'queued' : 'error',
    message,
    httpStatus: response.status,
  };
}

function parsePublicEndpoint(value: string | undefined): string | null {
  if (value === undefined || value.trim().length === 0) {
    return null;
  }

  try {
    const url = new URL(value.trim());

    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

function parseDocsUrl(value: string | undefined): string {
  if (value === undefined || value.trim().length === 0) {
    return defaultRefreshDocsUrl;
  }

  try {
    return new URL(value.trim()).toString();
  } catch {
    return defaultRefreshDocsUrl;
  }
}

async function readJsonPayload(response: Response): Promise<Record<string, unknown>> {
  try {
    const payload = await response.json();

    if (typeof payload === 'object' && payload !== null && !Array.isArray(payload)) {
      return payload as Record<string, unknown>;
    }
  } catch {
    return {};
  }

  return {};
}
