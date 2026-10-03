const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const GanaderoDB = require('./database');
let mainWindow, db;
const IS_DEMO = process.env.DEMO_MODE === 'true';
async function initDatabase(){db=new GanaderoDB();await db.init();}
function createWindow(){
 mainWindow=new BrowserWindow({width:1400,height:900,minWidth:1024,minHeight:700,title:IS_DEMO?'GANADERO ERP PRO - MODO DEMO':'GANADERO ERP PRO',icon:path.join(__dirname,'icon.ico'),webPreferences:{preload:path.join(__dirname,'preload.js'),contextIsolation:true,nodeIntegration:false}});
 mainWindow.setMenu(null);mainWindow.loadFile(path.join(__dirname,'ganadero_pro_v1.html'));
 if(IS_DEMO)mainWindow.webContents.on('did-finish-load',()=>mainWindow.webContents.send('demo-mode',true));
}
app.whenReady().then(async()=>{try{
 await initDatabase();createWindow();
 ipcMain.handle('db:load',()=>db.loadAll());
 ipcMain.handle('db:save',async(_e,data)=>{await db.saveAll(data);return true;});
 ipcMain.handle('db:reset',async()=>{await db.resetAll();return true;});
 ipcMain.handle('admin:verify',async(_e,password)=>{const configured=process.env.GANADERO_ADMIN_PASSWORD;return Boolean(configured)&&String(password||'')===configured;});
 ipcMain.handle('dialog:openFile',async()=>{const r=await dialog.showOpenDialog(mainWindow,{properties:['openFile'],filters:[{name:'Archivos',extensions:['*']}]});return r.canceled?null:r.filePaths[0];});
}catch(error){dialog.showErrorBox('GANADERO ERP PRO - Error de conexión',error.message);app.quit();}});
app.on('window-all-closed',async()=>{if(db)await db.close();if(process.platform!=='darwin')app.quit();});
