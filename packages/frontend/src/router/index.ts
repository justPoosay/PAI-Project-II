import { getSession } from '@/lib/auth-client';
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
      component: () => import('@/views/conversation-view.vue')
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/login-view.vue'),
      async beforeEnter(_, from) {
        const session = await getSession();
        if (session.data) {
          return from;
        }
      }
    }
  ]
});

export default router;
