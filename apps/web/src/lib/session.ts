export const ACCESS_COOKIE = "pf_at";
export const REFRESH_COOKIE = "pf_rt";

export const ACCESS_MAX_AGE_SEC = 60 * 60; // matches backend JWT TTL (1h)
export const REFRESH_DEFAULT_MAX_AGE_SEC = 60 * 60 * 24 * 30; // 30d; backend is configurable

