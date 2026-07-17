import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:5294/api', // adjust to match your dotnet run port
});

// Runs before every request - attaches the JWT automatically if we have one
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
