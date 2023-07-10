import { ConnectInfo } from './interfaces';

const getConnectInfo = (url: string): ConnectInfo => {
    // Extract host and port
    const { hostname, port } = new URL(url);
  
    // Clean up URL without the page but keeping the slash
    const hostURL = `${url.split('/').slice(0, 3).join('/')}`;
  
    // Result
    const host = hostname;
    const portNumber = port || 'invalid port';
  
    return { host, portNumber, hostURL };
};
  
export { getConnectInfo };