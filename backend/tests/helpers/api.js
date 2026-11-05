export function createApiClient(base) {
  const tokens = new Map();
  return async (path, { cookie, body, method = 'GET', headers = {} } = {}) => {
    const response = await fetch(`${base}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(cookie ? { Cookie: cookie } : {}),
        ...(tokens.has(cookie) ? { 'X-CSRF-Token': tokens.get(cookie) } : {}),
        ...headers,
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    const nextCookie = response.headers.get('set-cookie')?.split(';')[0];
    const data = response.status === 204 ? null : await response.json();
    if (data?.csrfToken) tokens.set(nextCookie || cookie, data.csrfToken);
    return {
      status: response.status,
      cookie: nextCookie,
      data,
      headers: response.headers,
    };
  };
}
