const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  loadData: () => ipcRenderer.invoke('db:load'),
  saveData: (data) => ipcRenderer.invoke('db:save', data),
  resetDatabase: () => ipcRenderer.invoke('db:reset'),
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  isElectron: true
});
