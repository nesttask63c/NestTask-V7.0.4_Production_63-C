import axios from 'axios';
import offlineStorage from '../utils/offlineStorage';

// Create an axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add request interceptor
api.interceptors.request.use(
  async (config) => {
    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Check if we're offline
    if (!navigator.onLine) {
      console.log('Offline mode: Request will be queued', config.url);
      
      // For GET requests, try to serve from IndexedDB
      if (config.method.toLowerCase() === 'get') {
        throw new axios.Cancel('Offline mode: Request will be served from cache');
      }
      
      // For mutation requests (POST, PUT, DELETE), queue them for later
      // Extract the store name from the URL
      const urlParts = config.url.split('/');
      const storeName = urlParts[urlParts.length - 1] || urlParts[urlParts.length - 2];
      
      // Determine operation type
      let type = 'unknown';
      switch (config.method.toLowerCase()) {
        case 'post':
          type = 'create';
          break;
        case 'put':
        case 'patch':
          type = 'update';
          break;
        case 'delete':
          type = 'delete';
          break;
      }
      
      // Add to pending operations
      await offlineStorage.addPendingOperation(type, storeName, {
        url: config.url,
        method: config.method,
        data: config.data,
        params: config.params
      });
      
      throw new axios.Cancel('Offline mode: Request has been queued for later');
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor
api.interceptors.response.use(
  (response) => {
    // Cache successful GET responses in IndexedDB for offline use
    if (response.config.method.toLowerCase() === 'get') {
      // Extract store name from URL
      const urlParts = response.config.url.split('/');
      let storeName = urlParts[urlParts.length - 1] || urlParts[urlParts.length - 2];
      
      // Handle pagination results
      if (response.data && Array.isArray(response.data.items)) {
        // Store each item individually
        response.data.items.forEach(item => {
          if (item.id) {
            offlineStorage.storeData(storeName, item)
              .catch(err => console.error(`Failed to cache ${storeName} item:`, err));
          }
        });
      } 
      // Handle array results
      else if (Array.isArray(response.data)) {
        // Store each item in the array
        response.data.forEach(item => {
          if (item.id) {
            offlineStorage.storeData(storeName, item)
              .catch(err => console.error(`Failed to cache ${storeName} item:`, err));
          }
        });
      } 
      // Handle single item results
      else if (response.data && response.data.id) {
        // If it's a single item with ID, store it
        offlineStorage.storeData(storeName, response.data)
          .catch(err => console.error(`Failed to cache ${storeName} item:`, err));
      }
      
      // Update last sync timestamp
      offlineStorage.updateLastSyncTimestamp()
        .catch(err => console.error('Failed to update last sync timestamp:', err));
    }
    
    return response;
  },
  async (error) => {
    // If request was cancelled due to offline mode
    if (axios.isCancel(error)) {
      console.log(error.message);
      
      // For GET requests, try to serve from cache
      if (error.message.includes('served from cache')) {
        const request = error.config;
        
        // Extract store name and ID from URL
        const urlParts = request.url.split('/');
        const storeName = urlParts[urlParts.length - 2]; // e.g., 'tasks' from '/api/tasks/123'
        const id = urlParts[urlParts.length - 1]; // e.g., '123' from '/api/tasks/123'
        
        try {
          let data;
          
          // If requesting a specific item by ID
          if (id && !isNaN(id)) {
            data = await offlineStorage.getData(storeName, id);
          } 
          // If requesting a collection
          else {
            data = await offlineStorage.getAllData(storeName);
          }
          
          if (data) {
            // Return a mock response
            return {
              data,
              status: 200,
              statusText: 'OK (from cache)',
              headers: {},
              config: request,
              offline: true
            };
          }
        } catch (err) {
          console.error('Failed to get cached data:', err);
        }
      }
      
      // Return a rejection with offline flag
      return Promise.reject({
        response: {
          data: { message: 'You are offline. This request has been queued for later.' },
          status: 503,
          statusText: 'Service Unavailable (Offline)',
          offline: true
        }
      });
    }
    
    // For network errors when the app is online
    if (error.message === 'Network Error' && navigator.onLine) {
      // Server is down but we're online
      console.log('Server is unreachable but app is online');
      
      // Try to serve GET requests from cache
      if (error.config && error.config.method.toLowerCase() === 'get') {
        const request = error.config;
        
        // Extract store name and ID from URL
        const urlParts = request.url.split('/');
        const storeName = urlParts[urlParts.length - 2];
        const id = urlParts[urlParts.length - 1];
        
        try {
          let data;
          
          // If requesting a specific item by ID
          if (id && !isNaN(id)) {
            data = await offlineStorage.getData(storeName, id);
          } 
          // If requesting a collection
          else {
            data = await offlineStorage.getAllData(storeName);
          }
          
          if (data) {
            // Return a mock response with stale flag
            return {
              data,
              status: 200,
              statusText: 'OK (from cache)',
              headers: {},
              config: request,
              stale: true
            };
          }
        } catch (err) {
          console.error('Failed to get cached data:', err);
        }
      }
    }
    
    return Promise.reject(error);
  }
);

// Function to sync pending operations with the server
export const syncPendingOperations = async () => {
  if (!navigator.onLine) {
    console.log('Cannot sync: Device is offline');
    return {
      successful: 0,
      failed: 0,
      total: 0,
      message: 'Cannot sync: Device is offline'
    };
  }
  
  return offlineStorage.syncPendingOperations(async (type, storeName, operation) => {
    // Recreate the API call from the stored operation
    switch (type) {
      case 'create':
        await api.post(operation.url, operation.data);
        break;
      case 'update':
        await api.put(operation.url, operation.data);
        break;
      case 'delete':
        await api.delete(operation.url);
        break;
      default:
        throw new Error(`Unknown operation type: ${type}`);
    }
  });
};

// Check if we need to refresh data based on last sync time
export const checkDataFreshness = async (maxAgeMinutes = 60) => {
  return offlineStorage.needsFreshSync(maxAgeMinutes);
};

// Fetch fresh data for specific entity type
export const refreshDataForEntity = async (entityType) => {
  try {
    const response = await api.get(`/${entityType}`);
    
    // If we got an array of items, store them in IndexedDB
    if (Array.isArray(response.data)) {
      await offlineStorage.clearStore(entityType);
      await offlineStorage.storeMultipleItems(entityType, response.data);
    }
    
    return response.data;
  } catch (error) {
    console.error(`Failed to refresh data for ${entityType}:`, error);
    throw error;
  }
};

// API service functions
export default {
  // Teachers
  getTeachers: () => api.get('/teachers'),
  getTeacher: (id) => api.get(`/teachers/${id}`),
  createTeacher: (data) => api.post('/teachers', data),
  updateTeacher: (id, data) => api.put(`/teachers/${id}`, data),
  deleteTeacher: (id) => api.delete(`/teachers/${id}`),
  
  // Students
  getStudents: () => api.get('/students'),
  getStudent: (id) => api.get(`/students/${id}`),
  createStudent: (data) => api.post('/students', data),
  updateStudent: (id, data) => api.put(`/students/${id}`, data),
  deleteStudent: (id) => api.delete(`/students/${id}`),
  
  // Courses
  getCourses: () => api.get('/courses'),
  getCourse: (id) => api.get(`/courses/${id}`),
  createCourse: (data) => api.post('/courses', data),
  updateCourse: (id, data) => api.put(`/courses/${id}`, data),
  deleteCourse: (id) => api.delete(`/courses/${id}`),
  
  // Tasks
  getTasks: () => api.get('/tasks'),
  getTask: (id) => api.get(`/tasks/${id}`),
  createTask: (data) => api.post('/tasks', data),
  updateTask: (id, data) => api.put(`/tasks/${id}`, data),
  deleteTask: (id) => api.delete(`/tasks/${id}`),
  
  // Auth
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getCurrentUser: () => api.get('/auth/me'),
  
  // Additional offline-related utilities
  syncPendingOperations,
  checkDataFreshness,
  refreshDataForEntity,
  
  // Export the axios instance for custom calls
  instance: api
}; 