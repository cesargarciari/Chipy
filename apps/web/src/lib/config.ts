/** Where the API lives. Empty string => same origin (the AWS setup in M2). */
export const API_URL: string = import.meta.env.VITE_API_URL ?? '';

export const IS_DEV = import.meta.env.DEV;
