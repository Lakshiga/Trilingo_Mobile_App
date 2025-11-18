import { getImageUrl } from './awsUrlHelper';

type MultilingualValue = {
  en?: string | null;
  ta?: string | null;
  si?: string | null;
  [key: string]: string | null | undefined;
};

export type ImageInput =
  | string
  | MultilingualValue
  | Array<string | MultilingualValue>
  | null
  | undefined;

const isJsonLikeString = (value: string) => {
  const trimmed = value.trim();
  return (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']'))
  );
};

export const parseImageInput = (value: ImageInput): ImageInput => {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();

  if (!trimmed || trimmed === '[object Object]') {
    return null;
  }

  if (isJsonLikeString(trimmed)) {
    try {
      return JSON.parse(trimmed);
    } catch (error) {
      console.warn('Failed to parse image JSON string', error);
      return null;
    }
  }

  return trimmed;
};

const extractFromArray = (
  value: Array<string | MultilingualValue>,
  preferredLanguage: 'en' | 'ta' | 'si'
): string | null => {
  for (const item of value) {
    if (typeof item === 'string') {
      const candidate = getImageUrl(item, preferredLanguage);
      if (candidate) {
        return candidate;
      }
    } else if (item && typeof item === 'object') {
      const candidate = getImageUrl(item, preferredLanguage);
      if (candidate) {
        return candidate;
      }
    }
  }
  return null;
};

export const resolveImageUri = (
  value: ImageInput,
  preferredLanguage: 'en' | 'ta' | 'si' = 'en'
): string | null => {
  const parsedValue = parseImageInput(value);
  if (!parsedValue) {
    return null;
  }

  if (typeof parsedValue === 'string') {
    return getImageUrl(parsedValue, preferredLanguage);
  }

  if (Array.isArray(parsedValue)) {
    return extractFromArray(parsedValue, preferredLanguage);
  }

  if (typeof parsedValue === 'object') {
    const { url, uri, path, value: directValue } = parsedValue as MultilingualValue & {
      url?: string;
      uri?: string;
      path?: string;
      value?: string;
    };

    if (typeof url === 'string') {
      return getImageUrl(url, preferredLanguage);
    }

    if (typeof uri === 'string') {
      return getImageUrl(uri, preferredLanguage);
    }

    if (typeof path === 'string') {
      return getImageUrl(path, preferredLanguage);
    }

    if (typeof directValue === 'string') {
      return getImageUrl(directValue, preferredLanguage);
    }

    return getImageUrl(parsedValue as MultilingualValue, preferredLanguage);
  }

  return null;
};

export const isEmojiLike = (value: ImageInput): value is string => {
  if (typeof value !== 'string') {
    return false;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }

  if (
    trimmed.startsWith('http') ||
    trimmed.startsWith('/') ||
    trimmed.includes('.') ||
    trimmed.includes('\\') ||
    trimmed.startsWith('{') ||
    trimmed.startsWith('[') ||
    trimmed === '[object Object]'
  ) {
    return false;
  }

  return trimmed.length <= 5;
};


