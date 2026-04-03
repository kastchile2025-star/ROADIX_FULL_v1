const SSL_ENABLED_VALUES = new Set(['1', 'true', 'yes', 'on']);
const SSL_DISABLED_VALUES = new Set(['0', 'false', 'no', 'off']);
const LOCAL_DATABASE_HOSTS = new Set(['localhost', '127.0.0.1', 'postgres']);

export function resolveDatabaseSsl(host?: string, dbSsl?: string) {
  const normalizedDbSsl = dbSsl?.trim().toLowerCase();

  if (normalizedDbSsl && SSL_ENABLED_VALUES.has(normalizedDbSsl)) {
    return { rejectUnauthorized: false };
  }

  if (normalizedDbSsl && SSL_DISABLED_VALUES.has(normalizedDbSsl)) {
    return false;
  }

  const normalizedHost = host?.trim().toLowerCase();
  if (!normalizedHost || LOCAL_DATABASE_HOSTS.has(normalizedHost)) {
    return false;
  }

  return { rejectUnauthorized: false };
}