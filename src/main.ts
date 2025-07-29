import { Quasar } from 'quasar'
import { createApp } from 'vue'
import { createPinia } from 'pinia'

import '@quasar/extras/material-icons/material-icons.css'
import 'quasar/src/css/index.sass'

import App from './App.vue'
import './css/custom.css'

const myApp = createApp(App)
const pinia = createPinia()

myApp.use(pinia)
myApp.use(Quasar)

myApp.mount('#app')
