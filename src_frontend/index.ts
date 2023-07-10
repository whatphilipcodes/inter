import path from 'path';
import { spawn, execFile, ChildProcess } from "child_process";
import { app, BrowserWindow, Menu, session } from 'electron';
import { getConnectInfo } from './utils/misc';
// This allows TypeScript to pick up the magic constants that's auto-generated by Forge's Webpack
// plugin that tells the Electron app where to look for the Webpack-bundled app code (depending on
// whether you're running in development or production).
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}
/*************************************************************
 * Manual Overrides
 *************************************************************/
// Fix: https://github.com/electron/electron/issues/38790
app.commandLine.appendSwitch('disable-features', 'WidgetLayering');

// Prevent fullscreen and enable dev tools in in testbuild
const isTestbuild = true;

/*************************************************************
 * Env Setup
 *************************************************************/
// get build mode from environment variable
const isDev = process.env.NODE_ENV === 'development';
const isWin = process.platform === 'win32';

// configure process environment
if (isDev) {
  process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'; // disable security warnings
}

/*************************************************************
 * Python Backend
 *************************************************************/
const PY_ENV_PATH: string = path.resolve('.', '.env', 'Scripts', 'python.exe');
const API_DEV_PATH: string = path.resolve('.', 'entry.py');
const API_PROD_PATH: string = path.resolve(process.resourcesPath, 'backend', 'backend.exe');

let pyProcess: ChildProcess = null;

const startPythonAPI = (windowURL: string): void => {

  const conInfo = getConnectInfo(windowURL);

  // set up options for python process
  const options: object = {
    env: {
      'PORT': conInfo.portNumber,
      'HOST': conInfo.host,
      'URL': conInfo.hostURL,
    }, // needed for CORS policy
    stdio: 'inherit',
  };

  if (isDev) {
    pyProcess = spawn(PY_ENV_PATH, [API_DEV_PATH], options);
    pyProcess.on('exit', (code, signal) => {
      if (code) {
        console.log(`Backend exited with code: ${code}`);
      }
      if (signal) {
        console.log(`Backend exited with signal: ${signal}`);
      }
      console.log('Backend exit done');
    });
  } else {
    pyProcess = execFile(API_PROD_PATH, options);
  }
};

/*************************************************************
 * Window Management
 *************************************************************/
const createWindow = (): void => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    autoHideMenuBar: true, // toggle the menu bar using alt (win)
    fullscreen: fullScreen(),
    webPreferences: {
      devTools: devTools(),
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  });

  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  mainWindow.webContents.on('did-finish-load', () => {
    if (isWin) startPythonAPI(mainWindow.webContents.getURL())
    else console.log('Python API not supported on ' + process.platform)
  });
};

const devTools = (): boolean => {
  if (isDev || isTestbuild) return true;
  return false;
};

const fullScreen = (): boolean => {
  if (isDev || isTestbuild) return false;
  return true;
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  setupCSP()
  createWindow()
})

// kill all child process when quitting
app.on("before-quit", function () {
  if (isWin) pyProcess.kill("SIGINT")
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

/*************************************************************
 * Content Security Policy
 *************************************************************/
const setupCSP = () => {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [`
          default-src 'self' 'unsafe-inline' data:;
          script-src 'self' 'unsafe-eval' 'unsafe-inline' data:;
          connect-src 'self' 127.0.0.1:${getConnectInfo(details.url).portNumber};
          `]
      }
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
        role: 'toggleDevTools' // Option to toggle the developer tools
      },
      {
        label: 'Toggle Fullscreen',
        role: 'togglefullscreen' // Option to toggle fullscreen
      },
      {
        label: 'Quit',
        role: 'quit' // Option to quit the application
      }
    ]
  }
]);

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
        role: 'quit' // Option to quit the application
      }
    ]
  }
]);

// Set the menu as the application menu
if (isDev) Menu.setApplicationMenu(devMenu);
else Menu.setApplicationMenu(buildMenu);