import { CLOUDFRONT_URL } from '../config/apiConfig';

/**
 * Converts a relative S3 path to a full CloudFront URL
 * Handles various path formats:
 * - "/images/dog.png" -> "https://d3v81eez8ecmto.cloudfront.net/images/dog.png"
 * - "images/dog.png" -> "https://d3v81eez8ecmto.cloudfront.net/images/dog.png"
 * - Already full URLs are returned as-is
 */
export const getCloudFrontUrl = (path: string | null | undefined): string | null => {
  if (!path || path.trim().length === 0) {
    return null;
  }

  // If it's already a full URL, return as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // If it's a local file or data URI, return as is
  if (path.startsWith('file://') || path.startsWith('data:') || 
      path.startsWith('content://') || path.startsWith('asset://')) {
    return path;
  }

  // Check if it's an emoji or invalid text
  if (path.length <= 10 && !path.includes('.') && !path.includes('/')) {
    return null;
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  // Construct full CloudFront URL
  return `${CLOUDFRONT_URL}${normalizedPath}`;
};

/**
 * Extracts image URL from multilingual object or string
 * Returns the URL for the specified language, or falls back to other languages
 */
type MultilingualResource = {
  en?: string | null;
  ta?: string | null;
  si?: string | null;
  url?: string | null;
  uri?: string | null;
  path?: string | null;
  value?: string | null;
  [key: string]: string | null | undefined;
};

const extractFromObject = (
  data: MultilingualResource,
  preferredLanguage: 'en' | 'ta' | 'si'
): string | null => {
  const { url, uri, path, value: directValue } = data;

  if (url) {
    return getCloudFrontUrl(url);
  }

  if (uri) {
    return getCloudFrontUrl(uri);
  }

  if (path) {
    return getCloudFrontUrl(path);
  }

  if (directValue) {
    return getCloudFrontUrl(directValue);
  }

  const languageMatch =
    data[preferredLanguage] || data.en || data.ta || data.si || null;

  if (languageMatch) {
    return getCloudFrontUrl(languageMatch);
  }

  // Fallback: find the first string value in the object
  const firstStringValue = Object.values(data).find(
    (value) => typeof value === 'string' && value.trim().length > 0
  );

  return getCloudFrontUrl(firstStringValue || null);
};

export const getImageUrl = (
  imageData: string | MultilingualResource | null | undefined,
  preferredLanguage: 'en' | 'ta' | 'si' = 'en'
): string | null => {
  if (!imageData) {
    return null;
  }

  if (typeof imageData === 'string') {
    return getCloudFrontUrl(imageData);
  }

  if (typeof imageData === 'object') {
    return extractFromObject(imageData, preferredLanguage);
  }

  return null;
};

/**
 * Extracts audio URL from multilingual object or string
 * Returns the URL for the specified language, or falls back to other languages
 */
export const getAudioUrl = (
  audioData: string | MultilingualResource | null | undefined,
  preferredLanguage: 'en' | 'ta' | 'si' = 'en'
): string | null => {
  if (!audioData) {
    return null;
  }

  if (typeof audioData === 'string') {
    return getCloudFrontUrl(audioData);
  }

  if (typeof audioData === 'object') {
    return extractFromObject(audioData, preferredLanguage);
  }

  return null;
};

/**
 * Extracts video URL from multilingual object or string
 */
export const getVideoUrl = (
  videoData: string | MultilingualResource | null | undefined,
  preferredLanguage: 'en' | 'ta' | 'si' = 'en'
): string | null => {
  if (!videoData) {
    return null;
  }

  if (typeof videoData === 'string') {
    return getCloudFrontUrl(videoData);
  }

  if (typeof videoData === 'object') {
    return extractFromObject(videoData, preferredLanguage);
  }

  return null;
};

