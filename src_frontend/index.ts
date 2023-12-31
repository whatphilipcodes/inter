import path from 'path'
import { spawn, execFile, ChildProcess } from 'child_process'
import {
	app,
	BrowserWindow,
	Menu,
	session /*, net as netElectron*/,
	ipcMain,
} from 'electron'
import net from 'node:net'

// debugging
import config from './front.config'

// global reference to mainWindow (necessary to prevent window from being garbage collected)
let mainWindow: BrowserWindow | null = null
// global reference to python backend URL
let uvi_url: URL

// This allows TypeScript to pick up the magic constants that's auto-generated by Forge's Webpack
// plugin that tells the Electron app where to look for the Webpack-bundled app code (depending on
// whether you're running in development or production).
declare const MAIN_WINDOW_WEBPACK_ENTRY: string
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
	app.quit()
}
/*************************************************************
 * Manual Overrides
 *************************************************************/
// Fix: https://github.com/electron/electron/issues/38790
app.commandLine.appendSwitch('disable-features', 'WidgetLayering')

/*************************************************************
 * Env Setup
 *************************************************************/
// get build mode from environment variable
const isDev = process.env.NODE_ENV === 'development'
const isWin = process.platform === 'win32'

// configure process environment
if (isDev) {
	process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true' // disable security warnings
}

/*************************************************************
 * Python Backend
 *************************************************************/
const PY_ENV_PATH: string = path.resolve('.', '.env', 'Scripts', 'python.exe')
const API_DEV_PATH: string = path.resolve('.', 'entry.py')
const API_PROD_PATH: string = path.resolve(
	process.resourcesPath,
	'backend',
	'backend.exe'
)

let pyProcess: ChildProcess = null

const startPythonAPI = (uvi_url: URL, el_url: URL): void => {
	// set up options for python process
	const options: object = {
		env: {
			UVI_PORT: uvi_url.port,
			UVI_HOST: uvi_url.hostname,
			EL_URL: el_url.origin,
		}, // needed for CORS policy
		stdio: 'inherit',
	}

	if (isDev) {
		pyProcess = spawn(PY_ENV_PATH, [API_DEV_PATH], options)
		pyProcess.on('exit', (code, signal) => {
			if (code) {
				console.log(`Backend exited with code: ${code}`)
			}
			if (signal) {
				console.log(`Backend exited with signal: ${signal}`)
			}
			console.log('Backend exit done')
		})
	} else {
		pyProcess = execFile(API_PROD_PATH, options)
	}
}

/*************************************************************
 * Window Management
 *************************************************************/
const createWindow = () => {
	// Create the browser window.
	mainWindow = new BrowserWindow({
		autoHideMenuBar: true, // toggle the menu bar using alt (win)
		fullscreen: config.fullScreen,
		webPreferences: {
			devTools: config.devTools,
			preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
		},
		icon: './assets/icon/inter.ico',
	})

	// and load the index.html of the app.
	mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY)

	// Open the DevTools.
	mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
	/*
  since in devmode we are running the app on localhost we need two different urls:
  - one that is used by the backend as the port uvicorn is hosted on
  - the dev url that is used by the frontend to connect to the backend (which needs to be whitelisted by CSP in uvicorn)
  */
	uvi_url = await getURL('localhost')
	let el_url: URL
	if (isDev) {
		el_url = new URL(
			`${MAIN_WINDOW_WEBPACK_ENTRY.split('/').slice(0, 3).join('/')}`
		)
	} else {
		// get unique and available url for electron frontend
		do {
			el_url = await getURL('localhost')
		} while (el_url.href === uvi_url.href)
		if (config.debugMsg) console.log('el_url: ' + el_url.href)
	}

	if (isWin) startPythonAPI(uvi_url, el_url)
	else console.log('Python backend does not support ' + process.platform)

	setupCSP(uvi_url)

	// this is needed to make the url available to the renderer process
	ipcMain.handle('getBackendURL', getBackendURL)

	createWindow()
})

// kill child process when quitting
app.on('before-quit', function () {
	if (isWin) pyProcess.kill('SIGINT')
})

// quit app when all windows are closed
app.on('window-all-closed', () => {
	app.quit()
})

/*************************************************************
 * Content Security Policy
 *************************************************************/
const setupCSP = (url: URL) => {
	session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
		callback({
			responseHeaders: {
				...details.responseHeaders,
				'Content-Security-Policy': [
					`
          default-src 'self' 'unsafe-inline' data:;
          script-src 'self' 'unsafe-eval' 'unsafe-inline' data: blob:;
          connect-src 'self' ${url.origin};
          `,
				],
			},
		})
	})
}

/*************************************************************
 * Menu Management
 *************************************************************/
// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

// Create the menu from the template
const devMenu = Menu.buildFromTemplate([
	{
		label: app.name, // Display the program name
		submenu: [
			{
				label: 'Toggle DevTools',
				role: 'toggleDevTools', // Option to toggle the developer tools
			},
			{
				label: 'Toggle Fullscreen',
				role: 'togglefullscreen', // Option to toggle fullscreen
			},
			{
				label: 'Quit',
				role: 'quit', // Option to quit the application
			},
		],
	},
])

const buildMenu = Menu.buildFromTemplate([
	{
		label: app.name, // Display the program name
		submenu: [
			// wont restart three.js #broken
			// {
			//   label: 'Restart',
			//   click: () => {
			//     app.relaunch(); // Option to restart the application
			//     app.exit(0); // kill the old instance
			//   }
			// },
			{
				label: 'Quit',
				role: 'quit', // Option to quit the application
			},
		],
	},
])

// Set the menu as the application menu
if (isDev) Menu.setApplicationMenu(devMenu)
else Menu.setApplicationMenu(buildMenu)

/*************************************************************
 * IPC Messages (only string data supported)
 *************************************************************/
const getBackendURL = async (): Promise<string> => {
	if (config.debugMsg)
		console.log('Backend URL sent to renderer: ' + uvi_url.href)
	return uvi_url.href
}

/*************************************************************
 * Port Management
 *************************************************************/
async function getURL(host: string, port = 0): Promise<URL> {
	// const address = await getAddress(host);
	const address = host
	if (!address) {
		throw new Error('Could not resolve host')
	}
	const freePort = port === 0 ? await getFreePort() : port
	return new URL(`http://${address}:${freePort}`)
}

async function getFreePort(): Promise<number> {
	return new Promise<number>((res) => {
		const srv = net.createServer()
		srv.listen(0, () => {
			const adress = srv.address() as net.AddressInfo
			const port = adress.port
			srv.close(() => res(port))
		})
	})
}
