import './assets/main.css';

import FloatingVue, { Menu, vTooltip } from 'floating-vue';
import { createPinia } from 'pinia';
import { createApp } from 'vue';

import App from './app.vue';
import router from './router';

const app = createApp(App);

FloatingVue.options.distance = 10;
app.use(createPinia());
app.use(router);

app.directive('tooltip', vTooltip);
app.component('VMenu', Menu);

app.mount('#app');
