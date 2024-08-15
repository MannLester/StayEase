import { createRouter, createWebHistory } from 'vue-router'
import DormListingForm from '@/components/DormListingForm.vue'
import DeveloperDashboard from '@/components/DeveloperDashboard.vue'
import DormPostCard from '@/components/DormPostCard.vue'
import UserDashboard from '@/components/UserDashboard.vue'
import DormPage from '@/components/DormPage.vue'
import HomePage from '@/components/HomePage.vue'
import UserLoginPage from '@/components/UserLoginPage.vue'
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomePage
    },
    {
      path: '/home/:userId',
      name: 'homeUser',
      component: HomePage,
      props: true // Pass route params as props to the component
    },
    {
      path: '/dorm-page/:dormId',
      name: 'page',
      component: DormPage,
      props: true
    },
    {
      path: '/dev-dashboard',
      name: 'dev',
      component: DeveloperDashboard
    },
    {
      path: '/card',
      name: 'card',
      component: DormPostCard
    },
    {
      path: '/user-dashboard/:userId',
      name: 'user',
      component: UserDashboard,
      props: true
    },
    {
      path: '/dorm-listing',
      name: 'listing',
      component: DormListingForm
    },
    {
      path: '/user-login',
      name: 'login',
      component: UserLoginPage
    }
  ]
})

export default router
