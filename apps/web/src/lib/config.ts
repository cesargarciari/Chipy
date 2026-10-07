/** API base url. Empty means same origin. */
export const API_URL: string = import.meta.env.VITE_API_URL ?? '';

export const IS_DEV = import.meta.env.DEV;
