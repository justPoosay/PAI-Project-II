import ConversationView from '@/views/conversation-view.vue';
import { createRouter, createWebHistory } from 'vue-router';

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
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/login-view.vue')
    }
  ]
});

export default router;
