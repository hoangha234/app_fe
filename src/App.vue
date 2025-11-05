<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import ProductAddEdit from './components/ProductAddEdit.vue'
import LoginForm from './components/LoginForm.vue'
import API_CONFIG from './config.js'

const products = ref([])
const loading = ref(false)
const error = ref(null)
const showAddEdit = ref(false)
const productToEdit = ref(null)
const isAuthenticated = ref(false)
const currentUser = ref(null)
const showLogin = ref(false)

const checkSession = async () => {
  try {
    const response = await axios.get(`${API_CONFIG.AUTH}/session`, { withCredentials: true })
    if (response.data.success && response.data.authenticated) {
      isAuthenticated.value = true
      currentUser.value = response.data
    } else {
      isAuthenticated.value = false
      currentUser.value = null
      showLogin.value = true
    }
  } catch (err) {
    console.error('Session check error:', err)
    isAuthenticated.value = false
    currentUser.value = null
    showLogin.value = true
  }
}

const handleLoginSuccess = async (userData) => {
  console.log('Login successful, user data:', userData)
  isAuthenticated.value = true
  currentUser.value = userData
  showLogin.value = false
  
  // Small delay to ensure cookie is set
  await new Promise(resolve => setTimeout(resolve, 200))
  
  // Fetch products directly (don't call checkSession which might reset auth state)
  await fetchProducts()
}

const handleLogout = async () => {
  try {
    await axios.post(`${API_CONFIG.AUTH}/logout`, {}, { withCredentials: true })
    isAuthenticated.value = false
    currentUser.value = null
    products.value = []
    showLogin.value = true
    alert('Logged out successfully!')
  } catch (err) {
    console.error('Logout error:', err)
  }
}

const fetchProducts = async () => {
  loading.value = true
  error.value = null
  console.log('Fetching products from:', API_CONFIG.PRODUCTS)
  console.log('Current auth state:', isAuthenticated.value)
  console.log('Current user:', currentUser.value)
  
  try {
    const res = await axios.get(API_CONFIG.PRODUCTS, { withCredentials: true })
    console.log('Products response:', res.data)
    // Handle new API response format
    products.value = res.data.success ? res.data.data : res.data
    console.log('Products loaded:', products.value.length)
  } catch (err) {
    console.error('Error fetching products:', err)
    console.error('Error response:', err.response)
    if (err.response?.status === 401) {
      error.value = 'Please login first. Unauthorized access.'
      isAuthenticated.value = false
      showLogin.value = true
    } else {
      error.value = err.response?.data?.message || err.message || 'Error fetching products'
    }
  } finally {
    loading.value = false
  }
}

const deleteProduct = async (id) => {
  if (!confirm('Are you sure you want to delete this product?')) {
    return
  }
  
  try {
    const response = await axios.delete(`${API_CONFIG.PRODUCTS}/${id}`, { 
      withCredentials: true
    })
    
    if (response.data.success) {
      // Remove from local list
      products.value = products.value.filter(p => p._id !== id)
      alert('Product deleted successfully!')
    }
  } catch (err) {
    console.error('Delete error:', err)
    const errorMsg = err.response?.data?.message || err.message || 'Delete failed'
    alert('Delete failed: ' + errorMsg)
  }
}

const openAddProduct = () => {
  productToEdit.value = null
  showAddEdit.value = true
}

const openEditProduct = (product) => {
  productToEdit.value = product
  showAddEdit.value = true
}

const handleProductAdded = async (newProduct) => {
  // Refresh the list to get latest data
  await fetchProducts()
  showAddEdit.value = false
}

const handleProductUpdated = async (updatedProduct) => {
  // Refresh the list to get latest data
  await fetchProducts()
  showAddEdit.value = false
}

onMounted(async () => {
  await checkSession()
  if (isAuthenticated.value) {
    await fetchProducts()
  }
})
</script>

<template>
  <div class="app-container">
    <!-- Login Form -->
    <LoginForm v-if="showLogin" @login-success="handleLoginSuccess" />
    
    <!-- Main Content -->
    <div v-else class="container">
      <!-- Header with user info and logout -->
      <div class="header">
        <h3>Product Management System</h3>
        <div class="user-info" v-if="currentUser">
          <span>Welcome, <strong>{{ currentUser.username }}</strong> ({{ currentUser.role }})</span>
          <button class="btn btn-small red" @click="handleLogout">Logout</button>
        </div>
      </div>

      <!-- Add Product Button (Admin only) -->
      <div class="actions" v-if="currentUser?.role === 'admin'">
        <button class="btn green" @click="openAddProduct">Add Product</button>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading">Loading products...</div>

      <!-- Error State -->
      <div v-if="error" class="error-box">{{ error }}</div>

      <!-- Products Table -->
      <table v-if="!loading && products.length" class="striped">
        <thead>
          <tr>
            <th>Image</th>
            <th>Name</th>
            <th>Price</th>
            <th>Category</th>
            <th v-if="currentUser?.role === 'admin'">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in products" :key="p._id">
            <td>
              <img 
                v-if="p.image" 
                :src="'http://localhost:3000' + p.image" 
                alt="Product" 
                class="product-image"
              >
              <span v-else class="no-image">No image</span>
            </td>
            <td>{{ p.name }}</td>
            <td>${{ p.price.toFixed(2) }}</td>
            <td>{{ p.category ? p.category.name : '—' }}</td>
            <td v-if="currentUser?.role === 'admin'">
              <button class="btn btn-small blue" @click="openEditProduct(p)">Edit</button>
              <button class="btn btn-small red" @click="deleteProduct(p._id)">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Empty State -->
      <div v-else-if="!loading" class="empty-state">
        <p>No products found</p>
        <button 
          v-if="currentUser?.role === 'admin'" 
          class="btn green" 
          @click="openAddProduct"
        >
          Add Your First Product
        </button>
      </div>

      <!-- Add/Edit Product Modal -->
      <ProductAddEdit 
        v-if="showAddEdit" 
        :productToEdit="productToEdit" 
        @close="showAddEdit = false" 
        @product-added="handleProductAdded"
        @product-updated="handleProductUpdated"
      />
    </div>
  </div>
</template>

<style scoped>
.app-container {
  min-height: 100vh;
  background: #f5f5f5;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.header h3 {
  margin: 0;
  color: #333;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.user-info span {
  color: #666;
}

.actions {
  margin-bottom: 20px;
}

.loading {
  text-align: center;
  padding: 40px;
  font-size: 18px;
  color: #666;
}

.error-box {
  background: #ffebee;
  color: #c62828;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 20px;
  border-left: 4px solid #c62828;
}

table {
  width: 100%;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

table thead {
  background: #4CAF50;
  color: white;
}

table th,
table td {
  padding: 12px;
  text-align: left;
}

table tbody tr:hover {
  background: #f5f5f5;
}

.product-image {
  max-width: 60px;
  max-height: 60px;
  object-fit: cover;
  border-radius: 4px;
}

.no-image {
  color: #999;
  font-style: italic;
  font-size: 12px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.empty-state p {
  font-size: 18px;
  color: #666;
  margin-bottom: 20px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  transition: all 0.3s;
}

.btn-small {
  padding: 6px 12px;
  font-size: 12px;
  margin-right: 5px;
}

.btn.green {
  background-color: #4CAF50;
  color: white;
}

.btn.green:hover {
  background-color: #45a049;
}

.btn.blue {
  background-color: #2196F3;
  color: white;
}

.btn.blue:hover {
  background-color: #0b7dda;
}

.btn.red {
  background-color: #f44336;
  color: white;
}

.btn.red:hover {
  background-color: #da190b;
}
</style>
