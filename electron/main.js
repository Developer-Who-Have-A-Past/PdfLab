// Serves the static Next.js export (../out) through a custom app:// protocol so that
// absolute asset paths like /_next/... and module workers resolve correctly.
const { app, BrowserWindow, protocol, net, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const { pathToFileURL } = require("url");

const OUT = path.join(__dirname, "..", "out");

protocol.registerSchemesAsPrivileged([
  { scheme: "app", privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true } },
]);

function resolveFile(urlPath) {
  let p = path.normalize(decodeURIComponent(urlPath)).replace(/^([/\\])+/, "");
  let full = path.join(OUT, p);
  if (!full.startsWith(OUT)) return path.join(OUT, "index.html"); // block path traversal
  if (fs.existsSync(full) && fs.statSync(full).isDirectory()) full = path.join(full, "index.html");
  if (!fs.existsSync(full)) full = path.join(OUT, "404.html");
  return full;
}

app.whenReady().then(() => {
  protocol.handle("app", (req) => net.fetch(pathToFileURL(resolveFile(new URL(req.url).pathname)).toString()));

  const win = new BrowserWindow({
    width: 1200, height: 820, title: "coolBase", ...(fs.existsSync(path.join(__dirname, "..", "build", "icon.png")) ? { icon: path.join(__dirname, "..", "build", "icon.png") } : {}), autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, nodeIntegration: false },
  });
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: "deny" }; });
  win.loadURL("app://coolbase/");
});

app.on("window-all-closed", () => app.quit());
