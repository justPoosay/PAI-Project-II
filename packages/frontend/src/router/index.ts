import { getSession } from '@/lib/auth-client';
import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      redirect: { name: 'chat', params: { id: 'new' } }
    },
    {
      path: '/c/:id',
      name: 'chat',
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
    },
    {
      path: '/settings',
      component: () => import('@/views/settings-view.vue'),
      async beforeEnter() {
        const session = await getSession();
        if (!session.data) {
          return '/login';
        }
      },
      children: [
        {
          path: '',
          name: 'settings',
          redirect: { name: 'account-settings' }
        },
        {
          path: 'account',
          name: 'account-settings',
          component: () => import('@/views/settings/account-view.vue')
        },
        {
          path: 'customization',
          name: 'customization-settings',
          component: () => import('@/views/settings/customization-view.vue')
        }
      ]
    }
  ]
});

export default router;
