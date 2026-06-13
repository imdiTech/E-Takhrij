import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000/api', // Point to Django backend (port 8000) using localhost to avoid cookie/SameSite issues
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

export default api;
