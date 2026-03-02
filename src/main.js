import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { useGameStore } from './store/gameStore';
import './style.css';
import App from './App.vue';

const app = createApp(App);

const pinia = createPinia();
app.use(pinia);

// Global error handlers
app.config.errorHandler = (err, instance, info) => {
  console.error('[Vue Error]', err, info);
};

window.onerror = (message, source, lineno, colno, error) => {
  console.error('[Global Error]', { message, source, lineno, colno, error });
};

window.addEventListener('unhandledrejection', (event) => {
  console.error('[Unhandled Promise Rejection]', event.reason);
});

app.mount('#app');

// For debugging: Bind gameStore to the window object
if (import.meta.env.DEV) {
  window.gameStore = useGameStore();
}
