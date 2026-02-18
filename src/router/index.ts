import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/pages/Home.vue'
import Anime from '@/pages/Anime.vue'
import Manga from '@/pages/Manga.vue'
import AnimeDetail from '@/pages/AnimeDetail.vue'
import MangaDetail from '@/pages/MangaDetail.vue'
import Login from '@/pages/Login.vue'
import Register from '@/pages/Register.vue'
import Profile from '@/pages/Profile.vue'
import About from '@/pages/About.vue'
import Themes from '@/pages/Themes.vue'
import Terms from '@/pages/Terms.vue'
import Privacy from '@/pages/Privacy.vue'
import { useAuthStore } from '@/stores/auth'

const routes = [
  { path: '/', name: 'Home', component: Home, meta: { requiresAuth: true } },
  { path: '/anime', name: 'Anime', component: Anime, meta: { requiresAuth: true } },
  { path: '/anime/:id', name: 'AnimeDetail', component: AnimeDetail, meta: { requiresAuth: true } },
  { path: '/manga', name: 'Manga', component: Manga, meta: { requiresAuth: true } },
  { path: '/manga/:id', name: 'MangaDetail', component: MangaDetail, meta: { requiresAuth: true } },

  { path: '/login', name: 'Login', component: Login },
  { path: '/register', name: 'Register', component: Register },

  { path: '/forgot-password', name: 'ForgotPassword', component: () => import('@/pages/ForgotPassword.vue') },
  { path: '/reset-password', name: 'ResetPassword', component: () => import('@/pages/ResetPassword.vue') },

  { path: '/terms', name: 'Terms', component: Terms },
  { path: '/privacy', name: 'Privacy', component: Privacy },

  { path: '/profile', name: 'Profile', component: Profile, meta: { requiresAuth: true } },
  { path: '/about', name: 'About', component: About },
  { path: '/themes', name: 'Themes', component: Themes },
]


export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

router.beforeEach((to, _from, next) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.token) {
    next('/login')
  } else {
    next()
  }
})
// 'from' is unused, so we use _from to avoid TS/ESLint unused var warning
