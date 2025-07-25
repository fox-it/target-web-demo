import { Quasar } from 'quasar'
import { createApp } from 'vue'

import '@quasar/extras/material-icons/material-icons.css'
import 'quasar/src/css/index.sass'

import App from './App.vue'
import './css/custom.css'

const myApp = createApp(App)

myApp.use(Quasar)

myApp.mount('#app')
