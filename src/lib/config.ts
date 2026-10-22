import Constants from 'expo-constants';

import { storage } from './storage';

type Extra = { apiUrl?: string; useMocks?: boolean; appEnv?: string };
const extra = (Constants.expoConfig?.extra ?? {}) as Extra;

const OVERRIDE_KEY = 'fw.apiUrlOverride';

/** Values baked in at build time from app.config.ts / eas.json. */
export const BuildConfig = {
  apiUrl: stripSlash(extra.apiUrl ?? 'https://api.flockwise.church/v1'),
  useMocks: extra.useMocks ?? true,
  appEnv: extra.appEnv ?? 'development',
};

let runtimeApiUrl: string | null = null;
let runtimeUseMocks = BuildConfig.useMocks;

/**
 * Loads a server URL saved on the device (Settings > Server). This lets testers
 * point a build at a new backend (e.g. staging on Hostinger) without rebuilding.
 * Disabled in production builds.
 */
export async function loadRuntimeConfig() {
  if (BuildConfig.appEnv === 'production') return;
  const saved = await storage.get(OVERRIDE_KEY);
  if (saved) {
    runtimeApiUrl = stripSlash(saved);
    runtimeUseMocks = false;
  }
}

export function getApiUrl() {
  return runtimeApiUrl ?? BuildConfig.apiUrl;
}

export function isUsingMocks() {
  return runtimeUseMocks;
}

export function canOverrideServer() {
  return BuildConfig.appEnv !== 'production';
}

/** Pass null to clear the override and return to the build defaults. */
export async function setApiUrlOverride(url: string | null) {
  if (url) {
    runtimeApiUrl = stripSlash(url.trim());
    runtimeUseMocks = false;
    await storage.set(OVERRIDE_KEY, runtimeApiUrl);
  } else {
    runtimeApiUrl = null;
    runtimeUseMocks = BuildConfig.useMocks;
    await storage.remove(OVERRIDE_KEY);
  }
}

function stripSlash(url: string) {
  return url.replace(/\/+$/, '');
}
