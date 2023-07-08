import axios from 'axios';

// create axios instance on startup with CORS enabled
const api = axios.create({
    baseURL: 'http://localhost:3000',
    timeout: 1000,
    headers: {
        'Access-Control-Allow-Origin': 'self',
        'Content-Type': 'application/json',
    }
});

const get = async (url: string) => {
    try {
        const response = await api.get(url);
        return response.data;
    } catch (error) {
        console.error(error);
    }
}

// exports
export { get };