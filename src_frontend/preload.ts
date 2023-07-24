// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
	onBackURL: (
		callback: (event: Electron.IpcRendererEvent, data: string) => void
	) => {
		ipcRenderer.on('backend-url', callback)
	},
})
