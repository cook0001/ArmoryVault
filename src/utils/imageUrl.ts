/**
 * Formats image paths into local-file:// URIs with optional thumbnail query parameters.
 * When isThumb is true, requests ?thumb=1 which instructs the Electron main process
 * to serve the sharp-generated WebP/JPEG thumbnail instead of decoding the multi-megabyte original.
 */
export const getLocalImageUrl = (path?: string | null, isThumb = false): string => {
  if (!path) return '';
  let url = path;
  if (!url.startsWith('http') && !url.startsWith('data:') && !url.startsWith('local-file://')) {
    url = `local-file://${url}`;
  }
  if (isThumb && url.startsWith('local-file://')) {
    return `${url}?thumb=1`;
  }
  return url;
};
