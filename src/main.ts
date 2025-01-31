import "./assets/main.css";

import { createApp } from "vue";
import { createPinia } from "pinia";
import { Menu, vTooltip } from "floating-vue";

import App from "./app.vue";
import router from "./router";

const app = createApp(App);

app.use(createPinia());
app.use(router);

app.directive("tooltip", vTooltip);
app.component("VMenu", Menu);

app.mount("#app");
