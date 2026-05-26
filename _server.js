const http = require("http"), fs = require("fs"), path = require("path");
const root = "C:\\Users\\shooo\\OneDrive\\デスクトップ\\Claw-Data\\fushimikanri-recruit";
const mime = {".html":"text/html",".css":"text/css",".js":"application/javascript",".png":"image/png",".jpg":"image/jpeg",".jpeg":"image/jpeg",".svg":"image/svg+xml",".json":"application/json"};
http.createServer((req, res) => {
  let u = decodeURIComponent(req.url.split("?")[0]);
  if (u.endsWith("/")) u += "index.html";
  const fp = path.join(root, u);
  if (!fp.startsWith(root)) { res.writeHead(403); res.end("Forbidden"); return; }
  fs.readFile(fp, (err, data) => {
    if (err) { res.writeHead(404); res.end("Not found"); return; }
    const ext = path.extname(fp).toLowerCase();
    res.writeHead(200, {"Content-Type": mime[ext]||"application/octet-stream","Cache-Control":"no-cache, no-store, must-revalidate"});
    res.end(data);
  });
}).listen(3847, () => console.log("Serving on http://localhost:3847"));
