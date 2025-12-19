import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue'),
  },
  {
    path: '/counter',
    name: 'Counter',
    component: () => import('../views/Counter.vue'),
  },
  {
    path: '/vault',
    name: 'Vault',
    component: () => import('../views/Vault.vue'),
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../views/Profile.vue'),
  },
  {
    path: '/amm',
    name: 'AMM',
    component: () => import('../views/AMM.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
