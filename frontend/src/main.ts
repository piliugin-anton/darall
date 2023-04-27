import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { SnackbarService } from 'vue3-snackbar'
import { createVfm } from 'vue-final-modal'
import 'vue3-snackbar/styles'
import router from './router'
import './style.scss'
import 'vue-final-modal/style.css'
import App from './App.vue'

const pinia = createPinia()
const vfm = createVfm()

const app = createApp(App)

app
.use(SnackbarService)
.use(vfm)
.use(router)
.use(pinia)
.mount('#app')
