import axios, { AxiosInstance } from 'axios';

let api: AxiosInstance;
function initAxios(url: URL): AxiosInstance {
    return axios.create({
        baseURL: url.origin,
        timeout: 1000,
        headers: {
            'Access-Control-Allow-Origin': 'self',
            'Content-Type': 'application/json',
        }
    });
}

(window as any).electronAPI.onBackURL((_event: unknown, data: string) => {
    // console.log('data received:', data);
    try {
        const url = new URL(data);
        api = initAxios(url);
        // Use the IP address as needed in the renderer process
    } catch (error) {
        console.error('Invalid URL:', error);
        // Handle the invalid URL error
    }
});

const get = async (url: string) => {
    if (!api) throw new Error('API not initialized');
    try {
        const response = await api.get(url);
        return response.data;
    } catch (error) {
        console.error(error);
    }
}

// exports
export { get };