import { computed, reactive } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from './store'
import Home from './views/Home.vue'
import Login from './views/Login.vue'
import SignUp from './views/SignUp.vue'
import Edit from './views/Edit.vue'

const routes = [
    {
        path: '/',
        name: 'Home',
        component: Home
    },
    {
        path: '/login',
        name: 'Login',
        component: Login
    },
    {
        path: '/sign-up',
        name: 'Sign-Up',
        component: SignUp
    },
    {
        path: '/edit',
        name: 'Edit',
        component: Edit,
        meta: {
            requiresAuth: true,
            requiresAdmin: true
        }
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

router.beforeEach(async (to, _from) => {
    const auth = useAuthStore()
  
    if (to.meta.requiresAuth && !auth.token) {
        return {
            name: 'Login',
            // save the location we were at to come back later
            query: { redirect: to.fullPath },
          }
    } else if (to.meta.requiresAdmin && auth?.user?.role !== 'ADMIN') {
        return {
            name: 'Home'
        }
    }
})

const routeData = reactive({ params: {}, query: {} })

router.afterEach((route) => {
    routeData.params = route.params
    routeData.query = route.query
})

export const useParams = () => computed(() => routeData.params)
export const useQuery = () => computed(() => routeData.query)

export default router