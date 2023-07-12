import './index.css';
import './components/chat';
import './three/demo';

// /*************************************************************
//  * State
//  *************************************************************/
import { Store } from './state/store';

// inits for all modules that need access to the global state
import { initAPI } from './utils/api';

// create global (renderer process) state
const globalState = new Store();

// init all modules that need access to the global state
initAPI(globalState);

// /*************************************************************
//  * IPC from main process
//  *************************************************************/
(window as any).electronAPI.onBackURL((_event: unknown, data: string) => {
    console.log('URL received from main process:', data);
    try {
        const url = new URL(data);
        globalState.initAxios(url);
    } catch (error) {
        console.error('Invalid URL:', error);
    }
});