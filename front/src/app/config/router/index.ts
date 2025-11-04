import {createRouter, createWebHistory} from 'vue-router'
import HomePage from '@/pages/home/ui/HomePage.vue'
import TransactionsPage from '@/pages/transactions/TransactionsPage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: HomePage,
    },
    {
      path: '/transactions',
      name: 'transactions',
      component: TransactionsPage,
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/pages/auth/LoginPage.vue'),
      meta: { layout: 'auth' }
    },
    {
      path: '/register',
      name: 'Register',
      component: () => import('@/pages/auth/RegisterPage.vue'),
      meta: { layout: 'auth' }
    }
  ],
})

// router.beforeEach(async (to, from, next) => {
//   const authStore = useAuthStore()
//
//   if (to.meta.requiresAuth && !authStore.isAuthenticated) {
//     const refreshed = await authStore.refreshAccessToken()
//     if (!refreshed) return next('/login')
//   }
//
//   next()
// })

export default router
