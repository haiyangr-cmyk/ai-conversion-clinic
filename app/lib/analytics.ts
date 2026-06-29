export type AnalyticsParams = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackEvent(eventName: string, params: AnalyticsParams = {}) {
  if (typeof window === "undefined") return;

  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined)
  );

  if (typeof window.gtag === "function") {
    window.gtag("event", eventName, cleanParams);
  }

  if (process.env.NODE_ENV === "development") {
    console.log("[analytics]", eventName, cleanParams);
  }
}
