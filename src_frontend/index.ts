import path from 'path';
import { execFile } from "child_process";
import { PythonShell } from 'python-shell';

import { app, BrowserWindow, Menu } from 'electron';
// This allows TypeScript to pick up the magic constants that's auto-generated by Forge's Webpack
// plugin that tells the Electron app where to look for the Webpack-bundled app code (depending on
// whether you're running in development or production).
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

const API_DEV_PATH: string = path.join('.', 'entry.py');
const API_PROD_PATH: string = path.join(process.resourcesPath, 'backend', 'backend.exe');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

// get build mode from environment variable
const isDev = process.env.NODE_ENV === 'development';

// configure process environment
if (isDev) {
  process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'; // disable security warnings
  // Start Python API in dev mode
}

const startPythonAPI = async (): Promise<void> => {

  // set up options for PythonShell
  const options: object = {
    env: { 'PORT': MAIN_WINDOW_WEBPACK_ENTRY.toString() }, // needed for CORS policy
    pythonPath: './.env/Scripts/python.exe',
    pythonOptions: ['-u'],
  };

  if (isDev) {
    PythonShell.run(API_DEV_PATH, options).then(messages => {
      console.log(messages);
    });
  } else {
    // Start Python API in production mode
    execFile(API_PROD_PATH, {
      windowsHide: true,
    });
  }
};

const createWindow = (): void => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    autoHideMenuBar: true, // toggle the menu bar using alt (win)
    fullscreen: !isDev, // fullscreen in production mode
    webPreferences: {
      devTools: isDev,
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  });

  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // Open the DevTools.
  if (isDev) mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  createWindow()
  await startPythonAPI()
})

// kill all child process before-quit
app.on("before-quit", function () {

  if (isDev) {
    PythonShell.kill(API_DEV_PATH)
  } else {
    execFile().kill("SIGINT")
  }
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