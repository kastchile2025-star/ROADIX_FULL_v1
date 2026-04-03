import { lazy } from 'react';
import type { ComponentType, LazyExoticComponent } from 'react';

const CHUNK_RELOAD_FLAG = 'roadix:chunk-reload-attempted';

const CHUNK_LOAD_PATTERNS = [
  /Failed to fetch dynamically imported module/i,
  /Importing a module script failed/i,
  /Loading chunk [\w-]+ failed/i,
  /ChunkLoadError/i,
  /Unable to preload CSS/i,
  /dynamically imported module/i,
];

function stringifyChunkError(error: unknown) {
  if (error instanceof Error) {
    return [error.name, error.message, error.stack].filter(Boolean).join(' ');
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object') {
    const candidate = error as {
      name?: unknown;
      message?: unknown;
      stack?: unknown;
      reason?: unknown;
    };

    return [candidate.name, candidate.message, candidate.stack, candidate.reason]
      .filter(Boolean)
      .map(String)
      .join(' ');
  }

  return String(error ?? '');
}

export function isChunkLoadError(error: unknown) {
  const text = stringifyChunkError(error);
  return CHUNK_LOAD_PATTERNS.some((pattern) => pattern.test(text));
}

export function clearChunkLoadRecoveryFlag() {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(CHUNK_RELOAD_FLAG);
}

export function tryRecoverFromChunkLoadError(error: unknown) {
  if (typeof window === 'undefined' || !isChunkLoadError(error)) {
    return false;
  }

  try {
    const alreadyRetried = window.sessionStorage.getItem(CHUNK_RELOAD_FLAG) === '1';
    if (alreadyRetried) {
      return false;
    }

    window.sessionStorage.setItem(CHUNK_RELOAD_FLAG, '1');
    window.location.reload();
    return true;
  } catch {
    window.location.reload();
    return true;
  }
}

export function lazyWithRetry<T extends ComponentType<any>>(
  importer: () => Promise<{ default: T }>,
): LazyExoticComponent<T> {
  return lazy(async () => {
    try {
      const module = await importer();
      clearChunkLoadRecoveryFlag();
      return module;
    } catch (error) {
      if (tryRecoverFromChunkLoadError(error)) {
        return new Promise<{ default: T }>(() => {});
      }

      throw error;
    }
  });
}