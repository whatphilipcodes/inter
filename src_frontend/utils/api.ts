import { Store } from '../state/store';
import { appState } from './enums';

let state: Store;
export function initAPI(globalState: Store): void {
    state = globalState;
}

const get = async (url: string) => {
    if (!state.api) throw new Error('Axios API not initialized');
    try {
        state.mutate({ applicationState: appState.idle });
        const response = await state.api.get(url);
        return response.data;
    } catch (error) {
        console.error(error);
    }
}

// exports
export { get };