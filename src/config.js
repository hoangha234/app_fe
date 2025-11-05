// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export const API_CONFIG = {
  BASE_URL: `${API_BASE_URL}/api`,
  PRODUCTS: `${API_BASE_URL}/api/product`,
  CATEGORIES: `${API_BASE_URL}/api/category`,
  AUTH: `${API_BASE_URL}/api/auth`
}

export default API_CONFIG
