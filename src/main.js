import { createApp } from 'vue'
import axios from 'axios'
import App from './App.vue'

// Configure axios to always send cookies with requests
axios.defaults.withCredentials = true

createApp(App).mount('#app')
