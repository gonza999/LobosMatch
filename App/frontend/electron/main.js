const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');

const useDevServer = process.env.ELECTRON_DEV === '1';
const distPath = path.join(__dirname, '..', 'dist');

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function startLocalServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let filePath = path.join(distPath, decodeURIComponent(req.url));
      if (req.url === '/' || !fs.existsSync(filePath)) {
        filePath = path.join(distPath, 'index.html');
      }
      const ext = path.extname(filePath);
      const contentType = mimeTypes[ext] || 'application/octet-stream';
      const content = fs.readFileSync(filePath);
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    });
    server.listen(0, '127.0.0.1', () => {
      resolve(server.address().port);
    });
  });
}

function createWindow(port) {
  const win = new BrowserWindow({
    width: 420,
    height: 780,
    resizable: false,
    title: 'LobosMatch',
    icon: path.join(__dirname, '..', 'assets', 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  win.setMenuBarVisibility(false);

  if (useDevServer) {
    win.loadURL('http://localhost:8081');
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    win.loadURL(`http://127.0.0.1:${port}`);
  }
}

app.whenReady().then(async () => {
  if (useDevServer || !fs.existsSync(path.join(distPath, 'index.html'))) {
    createWindow(8081);
  } else {
    const port = await startLocalServer();
    createWindow(port);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
