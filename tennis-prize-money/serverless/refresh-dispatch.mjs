const defaultWorkflowId = 'tennis-prize-money-refresh.yml';
const jsonHeaders = {
  'content-type': 'application/json; charset=utf-8',
};

export async function handleRefreshDispatchRequest(
  request,
  env = getProcessEnv(),
  fetcher = fetch,
) {
  const corsHeaders = getCorsHeaders(env);

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  if (request.method !== 'POST') {
    return jsonResponse(
      {
        status: 'method_not_allowed',
        message: 'Use POST to request a data refresh.',
      },
      405,
      corsHeaders,
    );
  }

  const config = readDispatchConfig(env);

  if (config.missing.length > 0) {
    return jsonResponse(
      {
        status: 'not_configured',
        message: 'Refresh dispatch backend is missing required server-side configuration.',
        missing: config.missing,
      },
      503,
      corsHeaders,
    );
  }

  const providedRefreshToken = await readProvidedRefreshToken(request);

  if (providedRefreshToken === null) {
    return jsonResponse(
      {
        status: 'unauthorized',
        message: 'Refresh passphrase is required.',
      },
      401,
      corsHeaders,
    );
  }

  if (providedRefreshToken !== config.refreshToken) {
    return jsonResponse(
      {
        status: 'forbidden',
        message: 'Refresh passphrase was not accepted.',
      },
      403,
      corsHeaders,
    );
  }

  const dispatchUrl = `https://api.github.com/repos/${encodeURIComponent(
    config.owner,
  )}/${encodeURIComponent(config.repo)}/actions/workflows/${encodeURIComponent(
    config.workflowId,
  )}/dispatches`;

  let githubResponse;

  try {
    githubResponse = await fetcher(dispatchUrl, {
      method: 'POST',
      headers: {
        accept: 'application/vnd.github+json',
        authorization: `Bearer ${config.githubToken}`,
        'content-type': 'application/json',
        'user-agent': 'tennis-prize-money-refresh-dispatch',
        'x-github-api-version': '2022-11-28',
      },
      body: JSON.stringify({
        ref: config.ref,
        inputs: {
          refresh_reason: 'dashboard_dispatch',
        },
      }),
    });
  } catch {
    return jsonResponse(
      {
        status: 'dispatch_failed',
        message: 'GitHub workflow dispatch could not be reached.',
      },
      502,
      corsHeaders,
    );
  }

  if (!githubResponse.ok) {
    return jsonResponse(
      {
        status: 'dispatch_failed',
        message: `GitHub workflow dispatch failed with status ${githubResponse.status}.`,
      },
      502,
      corsHeaders,
    );
  }

  return jsonResponse(
    {
      status: 'queued',
      message: 'Refresh workflow dispatch accepted.',
      workflow: config.workflowId,
      ref: config.ref,
    },
    202,
    corsHeaders,
  );
}

export default {
  fetch(request, env) {
    return handleRefreshDispatchRequest(request, env);
  },
};

async function readProvidedRefreshToken(request) {
  const headerToken = request.headers.get('x-refresh-token');
  const authorization = request.headers.get('authorization');

  if (headerToken && headerToken.trim().length > 0) {
    return headerToken.trim();
  }

  if (authorization?.toLowerCase().startsWith('bearer ')) {
    return authorization.slice('bearer '.length).trim();
  }

  try {
    const payload = await request.clone().json();

    if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
      return null;
    }

    const token = payload.refreshToken ?? payload.token ?? payload.passphrase;

    return typeof token === 'string' && token.trim().length > 0 ? token.trim() : null;
  } catch {
    return null;
  }
}

function readDispatchConfig(env) {
  const values = {
    githubToken: readEnv(env, 'GITHUB_TOKEN'),
    owner: readEnv(env, 'GITHUB_OWNER'),
    repo: readEnv(env, 'GITHUB_REPO'),
    ref: readEnv(env, 'GITHUB_REF'),
    refreshToken: readEnv(env, 'REFRESH_TOKEN'),
    workflowId: readEnv(env, 'REFRESH_WORKFLOW_ID') ?? defaultWorkflowId,
  };
  const missing = [
    ['GITHUB_TOKEN', values.githubToken],
    ['GITHUB_OWNER', values.owner],
    ['GITHUB_REPO', values.repo],
    ['GITHUB_REF', values.ref],
    ['REFRESH_TOKEN', values.refreshToken],
  ]
    .filter(([, value]) => value === null)
    .map(([name]) => name);

  return {
    ...values,
    missing,
  };
}

function readEnv(env, name) {
  const value = env?.[name];

  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function getCorsHeaders(env) {
  const allowedOrigin = readEnv(env, 'REFRESH_ALLOWED_ORIGIN') ?? '*';

  return {
    'access-control-allow-headers': 'authorization, content-type, x-refresh-token',
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-origin': allowedOrigin,
    ...jsonHeaders,
  };
}

function jsonResponse(payload, status, extraHeaders) {
  return new Response(JSON.stringify(payload, null, 2), {
    status,
    headers: {
      ...jsonHeaders,
      ...extraHeaders,
    },
  });
}

function getProcessEnv() {
  return typeof process === 'undefined' ? {} : process.env;
}
