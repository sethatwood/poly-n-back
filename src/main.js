import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { useGameStore } from './store/gameStore';
import './style.css'
import App from './App.vue'

const app = createApp(App);

const pinia = createPinia();
app.use(pinia);

app.mount('#app');

// For debugging: Bind gameStore to the window object
if (import.meta.env.DEV) {
  window.gameStore = useGameStore();
}
