import {createRouter, createWebHistory} from 'vue-router'
import HomePage from '@/pages/home/ui/HomePage.vue'
import TransactionsPage from '@/pages/transactions/TransactionsPage.vue'
import {useAuthStore} from "@/store/AuthStore.ts";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: HomePage,
      meta: { requiresAuth: true }
    },
    {
      path: '/transactions',
      name: 'transactions',
      component: TransactionsPage,
      meta: { requiresAuth: true }
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/pages/auth/LoginPage.vue'),
      meta: { layout: 'auth', requiresGuest: true }
    },
    {
      path: '/register',
      name: 'Register',
      component: () => import('@/pages/auth/RegisterPage.vue'),
      meta: { layout: 'auth', requiresGuest: true }
    },
    {
      path: '/profile',
      name: 'Profile',
      component: () => import('@/pages/profile/ProfilePage.vue'),
      meta: { requiresAuth: true }
    },
    { path: '/:pathMatch(.*)*', redirect: '/' }

  ],
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  if (!authStore.isInitialized ) {
    await authStore.initAuth()
  }

  if (to.meta.requiresGuest && authStore.isLoggedIn) {
    return next('/')
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    console.log('Redirecting unauthenticated user to login')

    const refreshed = await authStore.refreshAccessToken()
    if (refreshed) {
      await authStore.fetchProfile()
      if (authStore.isAuthenticated) {
        return next()
      }
    }
    return next('/login')
  }

  next()
})
export default router
