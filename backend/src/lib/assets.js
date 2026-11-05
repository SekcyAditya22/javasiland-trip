import { env } from '../config/env.js';

export function resolvePublicAssetUrl(value) {
  const asset = String(value || '').trim();
  if (!asset || /^(https?:|data:)/i.test(asset)) return asset;
  if (!asset.startsWith('/uploads') || !env.publicBackendUrl) return asset;
  return `${env.publicBackendUrl}${asset}`;
}
