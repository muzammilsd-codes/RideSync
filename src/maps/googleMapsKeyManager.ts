const STORAGE_KEY = 'ridesync_google_maps_key';

export function getGoogleMapsApiKey(): string {
  // 1. Check runtime localStorage override (allows user to paste key in UI)
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && stored.trim().length > 0) {
    return stored.trim();
  }

  // 2. Check Vite environment variable
  const envKey = import.meta.env.VITE_GOOGLE_MAPS_KEY || (import.meta.env as Record<string, string | undefined>).VITE_GOOGLE_MAPS_API_KEY;
  if (envKey && typeof envKey === 'string' && envKey.trim().length > 0) {
    return envKey.trim();
  }

  return '';
}

export function setGoogleMapsApiKey(key: string): void {
  if (key && key.trim().length > 0) {
    localStorage.setItem(STORAGE_KEY, key.trim());
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
  // Dispatch custom storage event for live UI update without full reload
  window.dispatchEvent(new Event('google_maps_key_change'));
}

export function clearGoogleMapsApiKey(): void {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event('google_maps_key_change'));
}
