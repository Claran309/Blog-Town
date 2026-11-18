type AnalyticsWindow = Window & {
  dataLayer?: Array<Record<string, unknown>>;
  clarity?: (...args: unknown[]) => void;
};

let initialPageViewSkipped = false;
let lastTrackedPath = '';

export function trackClientPageView(pagePath: string, pageTitle: string) {
  if (typeof window === 'undefined') return;
  if (!initialPageViewSkipped) {
    initialPageViewSkipped = true;
    lastTrackedPath = pagePath;
    return;
  }
  if (pagePath === lastTrackedPath) return;
  lastTrackedPath = pagePath;

  const analyticsWindow = window as AnalyticsWindow;
  analyticsWindow.dataLayer?.push({
    event: 'town_page_view',
    page_path: pagePath,
    page_title: pageTitle,
    page_location: window.location.href,
  });
  analyticsWindow.clarity?.('set', 'page_path', pagePath);
  analyticsWindow.clarity?.('event', 'town_page_view');
}
