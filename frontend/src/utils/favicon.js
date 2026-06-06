import { faviconFileUrl } from '../api/settings';

const DEFAULT_FAVICON = '/favicon.svg';
const DEFAULT_TYPE = 'image/svg+xml';

function getOrCreateIconLink() {
  let link = document.querySelector("link[rel='icon']");
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  return link;
}

export function applyFaviconMeta(meta) {
  const link = getOrCreateIconLink();

  if (meta?.custom) {
    link.type = meta.mimeType || 'image/png';
    link.href = faviconFileUrl(meta.updatedAt);
    return;
  }

  link.type = DEFAULT_TYPE;
  link.href = DEFAULT_FAVICON;
}

export async function loadFavicon() {
  try {
    const res = await fetch('/api/settings/favicon/config');
    if (!res.ok) return;
    const meta = await res.json();
    applyFaviconMeta(meta);
  } catch {
    // Varsayılan favicon kullanılır
  }
}
