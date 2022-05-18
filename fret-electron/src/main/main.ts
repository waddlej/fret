// *****************************************************************************
// Notices:
//
// Copyright © 2019, 2021 United States Government as represented by the Administrator
// of the National Aeronautics and Space Administration. All Rights Reserved.
//
// Disclaimers
//
// No Warranty: THE SUBJECT SOFTWARE IS PROVIDED "AS IS" WITHOUT ANY WARRANTY OF
// ANY KIND, EITHER EXPRESSED, IMPLIED, OR STATUTORY, INCLUDING, BUT NOT LIMITED
// TO, ANY WARRANTY THAT THE SUBJECT SOFTWARE WILL CONFORM TO SPECIFICATIONS,
// ANY IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE,
// OR FREEDOM FROM INFRINGEMENT, ANY WARRANTY THAT THE SUBJECT SOFTWARE WILL BE
// ERROR FREE, OR ANY WARRANTY THAT DOCUMENTATION, IF PROVIDED, WILL CONFORM TO
// THE SUBJECT SOFTWARE. THIS AGREEMENT DOES NOT, IN ANY MANNER, CONSTITUTE AN
// ENDORSEMENT BY GOVERNMENT AGENCY OR ANY PRIOR RECIPIENT OF ANY RESULTS,
// RESULTING DESIGNS, HARDWARE, SOFTWARE PRODUCTS OR ANY OTHER APPLICATIONS
// RESULTING FROM USE OF THE SUBJECT SOFTWARE.  FURTHER, GOVERNMENT AGENCY
// DISCLAIMS ALL WARRANTIES AND LIABILITIES REGARDING THIRD-PARTY SOFTWARE, IF
// PRESENT IN THE ORIGINAL SOFTWARE, AND DISTRIBUTES IT ''AS IS.''
//
// Waiver and Indemnity:  RECIPIENT AGREES TO WAIVE ANY AND ALL CLAIMS AGAINST
// THE UNITED STATES GOVERNMENT, ITS CONTRACTORS AND SUBCONTRACTORS, AS WELL AS
// ANY PRIOR RECIPIENT.  IF RECIPIENT'S USE OF THE SUBJECT SOFTWARE RESULTS IN
// ANY LIABILITIES, DEMANDS, DAMAGES, EXPENSES OR LOSSES ARISING FROM SUCH USE,
// INCLUDING ANY DAMAGES FROM PRODUCTS BASED ON, OR RESULTING FROM, RECIPIENT'S
// USE OF THE SUBJECT SOFTWARE, RECIPIENT SHALL INDEMNIFY AND HOLD HARMLESS THE
// UNITED STATES GOVERNMENT, ITS CONTRACTORS AND SUBCONTRACTORS, AS WELL AS ANY
// PRIOR RECIPIENT, TO THE EXTENT PERMITTED BY LAW.  RECIPIENT'S SOLE REMEDY FOR
// ANY SUCH MATTER SHALL BE THE IMMEDIATE, UNILATERAL TERMINATION OF THIS
// AGREEMENT.
// *****************************************************************************

/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { app, BrowserWindow, shell, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';

const NodePouchDB = require('pouchdb');

const userDocumentsFolder = app.getPath('documents');
let leveldbDBname = `${userDocumentsFolder}/fret-db`;
let modelDBname = `${userDocumentsFolder}/model-db`;
let leveldbDB = new NodePouchDB(leveldbDBname);
let modelDB = new NodePouchDB(modelDBname);

NodePouchDB.plugin(require('pouchdb-find'));

if (process.env.FRET_TESTING) {
  leveldbDBname = `${userDocumentsFolder}/fret_sqa/fret-db`;
  modelDBname = `${userDocumentsFolder}/fret_sqa/model-db`;
  leveldbDB = new NodePouchDB(leveldbDBname);
  modelDB = new NodePouchDB(modelDBname);
}

leveldbDB
  .info()
  .then(() => {
    console.log('We can use PouchDB with LevelDB!');
  })
  .catch((err: unknown) => {
    console.error('Error for LevelDB');
    console.error(err);
  });

modelDB
  .info()
  .then(() => {})
  .catch((err: unknown) => {
    console.log('Error for modelDB');
    console.error(err);
  });

leveldbDB.setMaxListeners(30);

// Enable Debugging for API/HTTP: NodePouchDB.debug.enable('*')
// Inialize properties for the first time
const FRET_PROPS_DBKEY = 'FRET_PROPS';
const baseProps = {
  _id: FRET_PROPS_DBKEY,
  fieldColors: {
    scope: '#9F0500',
    condition: '#FB9E00',
    component: '#68BC00',
    shall: '#000000',
    timing: '#009CE0',
    response: '#653294',
  },
};

const FRET_PROJECTS_DBKEY = 'FRET_PROJECTS';
// For backward compatibility, ensure that an object
// that stores all project names is in place.
leveldbDB.get(FRET_PROJECTS_DBKEY).catch((err: { status: number }) => {
  if (err.status === 404) {
    const projectNames: unknown[] = [];

    // eslint-disable-next-line promise/no-nesting
    leveldbDB
      .allDocs({
        include_docs: true,
      })
      .then((result: any) => {
        result.rows.forEach((r: any) => {
          const name = r.doc.project;
          if (name && name.length > 0 && !projectNames.includes(name)) {
            projectNames.push(name);
          }
        });
        // eslint-disable-next-line promise/no-nesting
        leveldbDB
          .put({
            _id: FRET_PROJECTS_DBKEY,
            names: projectNames,
          })
          .then(() => {
            console.log('Initialized project properties for the first time.');
          })
          .catch((error: unknown) => {
            console.log('leveldbDB could not initialize project.');
            console.log(error);
          });
      })
      .catch((error: unknown) => {
        console.log('Error for leveldbBD');
        console.error(error);
      });
  }
});

const FRET_REALTIME_CONFIG = 'REAL_TIME_CONFIG';
global.sharedObj = {
  db: leveldbDB,
  modeldb: modelDB,
  system_dbkeys: [FRET_PROJECTS_DBKEY, FRET_PROPS_DBKEY, FRET_REALTIME_CONFIG],
};

export default class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  console.log(msgTemplate(arg));
  event.reply('ipc-example', msgTemplate('pong'));
});

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
