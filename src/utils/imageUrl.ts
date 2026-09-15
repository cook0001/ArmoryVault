/**
 * Formats image paths into local-file:// URIs with optional thumbnail query parameters.
 * When isThumb is true, requests ?thumb=1 which instructs the Electron main process
 * to serve the sharp-generated WebP/JPEG thumbnail instead of decoding the multi-megabyte original.
 */
export const getLocalImageUrl = (path?: string | null, isThumb = false): string => {
  if (!path) return '';
  let url = path.trim();

  // If already a remote URL or data URI, return as-is
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }

  // Strip redundant local-file:// and file:// prefixes
  url = url.replace(/^local-file:\/+/, '');
  url = url.replace(/^file:\/+/, '');

  // Ensure leading slash for Unix absolute paths
  if (!url.startsWith('/') && !/^[a-zA-Z]:/.test(url)) {
    url = `/${url}`;
  }

  const base = `local-file://localhost${url.startsWith('/') ? url : `/${url}`}`;
  return isThumb ? `${base}?thumb=1` : base;
};
