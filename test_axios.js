// Test axios interceptor
import axios from './src/api/axios.js';

console.log('=== TESTING AXIOS INSTANCE ===');
console.log('Axios baseURL:', axios.defaults.baseURL);
console.log('Axios interceptors count:', axios.interceptors.request.handlers.length);

// Test the interceptor
axios.get('/api/test')
  .then(response => {
    console.log('Success:', response);
  })
  .catch(error => {
    console.log('Expected error:', error.message);
  }); 