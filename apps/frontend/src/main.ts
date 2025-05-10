import '@/assets/main.css';

import { createPinia } from 'pinia';
import { createApp } from 'vue';

import App from '@/app.vue';
import tooltipDirective from '@/directives/tooltip';
import router from '@/router';

const app = createApp(App);

app.use(createPinia());
app.use(router);

app.directive('tooltip', tooltipDirective);

app.mount('#app');
