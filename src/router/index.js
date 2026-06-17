import { createRouter, createWebHashHistory } from 'vue-router'
import NavHomeView from '../views/NavHomeView.vue'
import HomeView from '../views/HomeView.vue'

const routes = [
  {
    path: '/',
    name: 'nav-home',
    component: NavHomeView,
  },
  {
    path: '/courses',
    name: 'home',
    component: HomeView,
  },
  {
    path: '/course/:id',
    name: 'course-detail',
    component: () => import('../views/CourseDetailView.vue'),
  },
  {
    path: '/mentors',
    name: 'mentor-list',
    component: () => import('../views/MentorListView.vue'),
  },
  {
    path: '/mentor/:id',
    name: 'mentor-detail',
    component: () => import('../views/MentorDetailView.vue'),
  },
  {
    path: '/yourtj',
    name: 'yourtj-list',
    component: () => import('../views/YourTJListView.vue'),
  },
  {
    path: '/yourtj/course/:id',
    name: 'yourtj-detail',
    component: () => import('../views/YourTJDetailView.vue'),
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('../views/NotFoundView.vue'),
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
