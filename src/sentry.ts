import * as Sentry from '@sentry/capacitor';
import * as SentryVue from '@sentry/vue';
import type { App } from 'vue';

export function initSentry(app: App): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return; // Gracefully skip if DSN not configured

  Sentry.init(
    {
      dsn,
      release: `poly-n-back@${import.meta.env.VITE_APP_VERSION ?? '0.0.0'}`,
      environment: import.meta.env.MODE,
      siblingOptions: {
        vueOptions: {
          app,
          attachProps: true,
          attachErrorHandler: true,
          tracingOptions: {
            trackComponents: true,
          },
        },
      },
    },
    SentryVue.init,
  );
}
