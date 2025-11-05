<template>
  <div class="product-form-overlay">
    <div class="product-form-container">
      <h4 class="center-align bold">{{ editing ? 'Edit Product' : 'Add New Product' }}</h4>
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="name">Product Name</label>
          <input type="text" id="name" v-model="product.name" required class="form-control">
        </div>
        <div class="form-group">
          <label for="price">Price</label>
          <input type="number" id="price" v-model="product.price" required class="form-control">
        </div>
        <div class="form-group">
          <label for="imageFile">Product Image</label>
          <input type="file" id="imageFile" @change="handleImageChange" accept="image/*" class="form-control">
          <div v-if="imagePreview" class="image-preview-container">
            <img :src="imagePreview" alt="Preview" class="image-preview" />
          </div>
        </div>
        <div class="form-group">
          <label for="category">Category</label>
          <select id="category" v-model="product.category" required class="form-control category-select">
            <option value="" disabled selected>{{ categories.length === 0 ? 'Loading categories...' : 'Choose a category...' }}</option>
            <option v-for="cat in categories" :key="cat._id" :value="cat._id">{{ cat.name }}</option>
          </select>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn-primary">{{ editing ? 'Update' : 'Add' }}</button>
          <button type="button" @click="$emit('close')" class="btn btn-secondary">Cancel</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import axios from 'axios'
import API_CONFIG from '../config.js'

const props = defineProps({
  productToEdit: Object
})

const emit = defineEmits(['close', 'product-added', 'product-updated'])

const editing = ref(false)
const product = ref({ name: '', price: 0, category: '' })
const categories = ref([])
const imagePreview = ref('')
const imageFile = ref(null)

const fetchCategories = async () => {
  try {
    console.log('Fetching categories from:', API_CONFIG.CATEGORIES)
    const res = await axios.get(API_CONFIG.CATEGORIES, { withCredentials: true })
    // Handle new API response format
    categories.value = res.data.success ? res.data.data : res.data
    console.log('Categories fetched successfully:', categories.value.length, 'categories')
  } catch (error) {
    console.error('Error fetching categories:', error)
    alert('Failed to load categories: ' + (error.response?.data?.message || error.message))
  }
}

const handleImageChange = (event) => {
  const file = event.target.files[0]
  if (!file) {
    imagePreview.value = ''
    imageFile.value = null
    return
  }
  
  imageFile.value = file
  
  const reader = new FileReader()
  reader.onload = (e) => {
    imagePreview.value = e.target.result
  }
  reader.readAsDataURL(file)
}

const handleSubmit = async () => {
  try {
    console.log('=== FORM SUBMISSION STARTED ===')
    console.log('Product data:', product.value)
    console.log('Image file:', imageFile.value)
    
    if (!product.value.category || product.value.category === '') {
      alert('Please select a category before submitting.')
      return
    }
    
    // Create FormData for file upload
    const formData = new FormData()
    formData.append('name', product.value.name)
    formData.append('price', product.value.price)
    formData.append('category', product.value.category)
    
    if (imageFile.value) {
      formData.append('imageFile', imageFile.value)
      console.log('Image file added to FormData')
    } else if (editing.value && product.value.image) {
      // Keep existing image if editing and no new file uploaded
      formData.append('image', product.value.image)
      console.log('Keeping existing image')
    }
    
    let response
    if (editing.value) {
      console.log('Updating product with ID:', product.value._id)
      response = await axios.put(`${API_CONFIG.PRODUCTS}/${product.value._id}`, formData, { 
        withCredentials: true, 
        headers: { 
          'Content-Type': 'multipart/form-data'
        } 
      })
      console.log('Update response:', response.data)
      
      if (response.data.success) {
        emit('product-updated', response.data.data)
        alert('Product updated successfully!')
      }
    } else {
      console.log('Creating new product...')
      response = await axios.post(API_CONFIG.PRODUCTS, formData, { 
        withCredentials: true, 
        headers: { 
          'Content-Type': 'multipart/form-data'
        } 
      })
      console.log('Create response:', response.data)
      
      if (response.data.success) {
        emit('product-added', response.data.data)
        alert('Product added successfully!')
      }
    }
    console.log('=== FORM SUBMISSION COMPLETED ===')
    emit('close')
  } catch (error) {
    console.error('=== FORM SUBMISSION FAILED ===')
    console.error('Error details:', error)
    console.error('Error response:', error.response)
    
    let errorMessage = 'Error saving product: '
    if (error.response?.data?.message) {
      errorMessage += error.response.data.message
    } else if (error.response?.data?.errors) {
      errorMessage += JSON.stringify(error.response.data.errors)
    } else {
      errorMessage += error.message
    }
    
    alert(errorMessage)
  }
}

watch(() => props.productToEdit, (newVal) => {
  if (newVal) {
    editing.value = true
    product.value = { ...newVal, category: newVal.category?._id || newVal.category || '' }
    // Set image preview if product has an existing image
    if (newVal.image) {
      imagePreview.value = 'http://localhost:3000' + newVal.image
    }
  } else {
    editing.value = false
    product.value = { name: '', price: 0, category: '' }
    imagePreview.value = ''
    imageFile.value = null
  }
})

onMounted(async () => {
  await fetchCategories()
  console.log('Component mounted. Categories:', categories.value.length)
  if (props.productToEdit) {
    editing.value = true
    product.value = { 
      ...props.productToEdit, 
      category: props.productToEdit.category?._id || props.productToEdit.category || '' 
    }
    // Set image preview if product has an existing image
    if (props.productToEdit.image) {
      imagePreview.value = 'http://localhost:3000' + props.productToEdit.image
    }
    console.log('Editing product:', product.value)
  }
})
</script>

<style scoped>
.product-form-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.product-form-container {
  background: white;
  padding: 30px;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.product-form-container h2 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #333;
}

.center-align {
  text-align: center;
}

.bold {
  font-weight: bold;
}

.image-preview-container {
  margin-top: 10px;
}

.image-preview {
  max-width: 200px;
  max-height: 200px;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 5px;
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
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
  background-color: white;
  display: block;
  min-height: 38px;
}

.form-control:focus {
  outline: none;
  border-color: #4CAF50;
}

select.form-control {
  cursor: pointer;
  appearance: auto;
  -webkit-appearance: menulist;
  -moz-appearance: menulist;
}

.category-select {
  height: 40px !important;
  font-size: 16px !important;
  padding: 10px !important;
  border: 2px solid #ddd !important;
  background: white !important;
}

.loading-text {
  padding: 8px 12px;
  color: #666;
  font-style: italic;
}

.category-debug {
  font-size: 12px;
  color: #666;
  margin-top: 5px;
  font-style: italic;
}

.form-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  transition: background-color 0.3s;
}

.btn-primary {
  background-color: #4CAF50;
  color: white;
}

.btn-primary:hover {
  background-color: #45a049;
}

.btn-secondary {
  background-color: #f44336;
  color: white;
}

.btn-secondary:hover {
  background-color: #da190b;
}
</style>