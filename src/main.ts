import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import PhosphorIcons from '@phosphor-icons/vue';

import '@/assets/style/style.css';
import '@/assets/style/tailwind.css';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(PhosphorIcons);

// 禁用默认右键菜单
document.addEventListener('contextmenu', (e) => e.preventDefault());

app.mount('#app');
