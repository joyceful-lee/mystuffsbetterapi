export const UPLOAD_MIME_TYPES = ['image/jpeg','image/png','image/webp','image/gif'];
export const UPLOAD_ACCEPT = UPLOAD_MIME_TYPES.join(',');
export const MAX_SOURCE_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_SAVED_IMAGE_BYTES = 250000;
export const MAX_IMAGE_EDGE = 850;
export const UPLOAD_GUIDELINES = 'JPG, PNG, WebP, or GIF, up to 10 MiB per file. Pictures are resized to at most 850 pixels on the longest side and saved as JPG. Animated GIFs use one still frame.';
export function sourceImageError(file) {
  if (!UPLOAD_MIME_TYPES.includes(file.type)) return 'Choose a JPG, PNG, WebP, or GIF picture.';
  if (file.size > MAX_SOURCE_IMAGE_BYTES) return 'Choose a picture no larger than 10 MiB (10,485,760 bytes).';
  return null;
}
