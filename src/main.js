const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// 開発モードかどうかを確認
const isDev = process.argv.includes('--dev');

// メインウィンドウのグローバル参照
let mainWindow;

function createWindow() {
  // ブラウザウィンドウを作成
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // index.htmlをロード
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // 開発モードの場合は開発者ツールを開く
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // ウィンドウが閉じられたときの処理
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Electronの初期化が完了したらウィンドウを作成
app.whenReady().then(createWindow);

// すべてのウィンドウが閉じられたときの処理（macOSを除く）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // macOSでドックアイコンがクリックされたときにウィンドウを再作成
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// ファイル選択ダイアログを開く
ipcMain.handle('open-file-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Image Files', extensions: ['jpg', 'jpeg', 'png', 'gif'] }
    ]
  });
  
  if (!result.canceled) {
    return result.filePaths;
  }
  return [];
});

// 画像ファイルを読み込む
ipcMain.handle('read-image-file', (event, filePath) => {
  try {
    const imageBuffer = fs.readFileSync(filePath);
    return {
      success: true,
      data: imageBuffer.toString('base64'),
      path: filePath
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

// コラージュを保存
ipcMain.handle('save-collage', async (event, imageData) => {
  try {
    const base64Data = imageData.replace(/^data:image\/png;base64,/, '');
    
    // 日付を含むファイル名を生成
    const date = new Date();
    const dateStr = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;
    const fileName = `collage_${dateStr}.png`;
    
    // 保存ダイアログを表示
    const result = await dialog.showSaveDialog({
      filters: [
        { name: 'PNG Image', extensions: ['png'] }
      ],
      defaultPath: path.join(app.getPath('pictures'), fileName)
    });
    
    if (result.canceled) {
      return { success: false, canceled: true };
    }
    
    // ファイルに書き込み
    fs.writeFileSync(result.filePath, Buffer.from(base64Data, 'base64'));
    
    return {
      success: true,
      filePath: result.filePath
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

// コラージュを自動保存（ダイアログなし）
ipcMain.handle('save-collage-auto', async (event, imageData) => {
  try {
    const base64Data = imageData.replace(/^data:image\/png;base64,/, '');
    
    // 保存先フォルダを取得（ダウンロードフォルダ）
    const downloadsPath = app.getPath('downloads');
    
    // 日付を含むファイル名を生成
    const date = new Date();
    const dateStr = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;
    const fileName = `collage_${dateStr}.png`;
    
    // ファイルパスを作成
    const filePath = path.join(downloadsPath, fileName);
    
    // ファイルに書き込み
    fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
    
    return {
      success: true,
      filePath: filePath
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}); 