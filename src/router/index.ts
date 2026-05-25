import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: () => import('@/views/DashboardView.vue'),
    },
    {
      path: '/factory-map',
      name: 'factory-map',
      component: () => import('@/views/FactoryMapView.vue'),
    },
    {
      path: '/alarms',
      name: 'alarms',
      component: () => import('@/views/AlarmCenterView.vue'),
    },
  ],
})

export default router
