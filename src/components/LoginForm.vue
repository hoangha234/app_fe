<template>
  <div class="login-overlay">
    <div class="login-container">
      <h3 class="center-align">{{ isRegister ? 'Register' : 'Login' }}</h3>
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="username">Username</label>
          <input 
            type="text" 
            id="username" 
            v-model="username" 
            required 
            class="form-control"
            placeholder="Enter username"
          >
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <input 
            type="password" 
            id="password" 
            v-model="password" 
            required 
            class="form-control"
            placeholder="Enter password"
          >
        </div>
        <div class="form-group" v-if="isRegister">
          <label for="role">Role</label>
          <select id="role" v-model="role" class="form-control">
            <option value="customer">Customer</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div v-if="error" class="error-message">{{ error }}</div>
        <div class="form-actions">
          <button type="submit" class="btn btn-primary" :disabled="loading">
            {{ loading ? 'Please wait...' : (isRegister ? 'Register' : 'Login') }}
          </button>
        </div>
        <div class="toggle-link">
          <a href="#" @click.prevent="toggleMode">
            {{ isRegister ? 'Already have an account? Login' : 'Need an account? Register' }}
          </a>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'
import API_CONFIG from '../config.js'

const emit = defineEmits(['login-success'])

const username = ref('')
const password = ref('')
const role = ref('admin')
const isRegister = ref(false)
const loading = ref(false)
const error = ref('')

const toggleMode = () => {
  isRegister.value = !isRegister.value
  error.value = ''
}

const handleSubmit = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const endpoint = isRegister.value 
      ? `${API_CONFIG.AUTH}/register` 
      : `${API_CONFIG.AUTH}/login`
    
    const data = {
      username: username.value,
      password: password.value
    }
    
    if (isRegister.value) {
      data.role = role.value
    }
    
    console.log('Sending auth request to:', endpoint)
    console.log('With data:', data)
    
    const response = await axios.post(endpoint, data, { 
      withCredentials: true 
    })
    
    console.log('Auth response:', response.data)
    console.log('Response headers:', response.headers)
    console.log('Set-Cookie header:', response.headers['set-cookie'])
    console.log('All cookies:', document.cookie)
    
    if (response.data.success) {
      if (isRegister.value) {
        alert('Registration successful! Please login.')
        isRegister.value = false
        password.value = ''
      } else {
        console.log('Login successful, emitting event')
        emit('login-success', response.data)
      }
    } else {
      error.value = response.data.message || 'Operation failed'
    }
  } catch (err) {
    console.error('Auth error:', err)
    console.error('Error response:', err.response)
    error.value = err.response?.data?.message || err.message || 'Operation failed'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.login-container {
  background: white;
  padding: 30px;
  border-radius: 8px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
}

.center-align {
  text-align: center;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  color: #555;
}

.form-control {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
}

.form-control:focus {
  outline: none;
  border-color: #4CAF50;
}

.error-message {
  color: #f44336;
  margin-bottom: 15px;
  padding: 10px;
  background: #ffebee;
  border-radius: 4px;
  font-size: 14px;
}

.form-actions {
  margin-top: 20px;
}

.btn {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  transition: background-color 0.3s;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background-color: #4CAF50;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #45a049;
}

.toggle-link {
  margin-top: 15px;
  text-align: center;
}

.toggle-link a {
  color: #4CAF50;
  text-decoration: none;
  font-size: 14px;
}

.toggle-link a:hover {
  text-decoration: underline;
}
</style>
