import { createRouter, createWebHistory } from 'vue-router';
import ConversationView from '../views/conversation-view.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      redirect: '/c/new'
    },
    {
      path: '/c/:id',
      name: 'c',
      component: ConversationView
    }
  ]
});

export default router;
