const http = require('http');
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

const PORT = Number(process.env.PORT || 3000);
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, 'data', 'db.json');
const PUBLIC_DIR = path.join(__dirname, 'public');
const validStatuses = ['pending', 'approved', 'cancelled'];

function ensureDb() {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ orderRequests: [], affiliates: [] }, null, 2));
  }
}

function readDb() {
  ensureDb();
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function writeDb(db) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
}

function json(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => {
      raw += chunk;
      if (raw.length > 1_000_000) reject(new Error('Dữ liệu quá lớn'));
    });
    req.on('end', () => {
      try { resolve(raw ? JSON.parse(raw) : {}); }
      catch { reject(new Error('JSON không hợp lệ')); }
    });
    req.on('error', reject);
  });
}

function clean(value) { return String(value || '').trim(); }
function isEmail(value) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value); }

function validateOrder(body) {
  const data = {
    fullName: clean(body.fullName), phone: clean(body.phone), email: clean(body.email),
    service: clean(body.service), note: clean(body.note)
  };
  if (!data.fullName || !data.phone || !data.service) return { error: 'Vui lòng nhập họ tên, số điện thoại và dịch vụ.' };
  if (data.email && !isEmail(data.email)) return { error: 'Email không hợp lệ.' };
  return { data };
}

function validateAffiliate(body) {
  const data = {
    fullName: clean(body.fullName), phone: clean(body.phone), email: clean(body.email),
    channel: clean(body.channel), experience: clean(body.experience), message: clean(body.message)
  };
  if (!data.fullName || !data.phone || !data.email || !data.channel) return { error: 'Vui lòng nhập đầy đủ họ tên, điện thoại, email và kênh hoạt động.' };
  if (!isEmail(data.email)) return { error: 'Email không hợp lệ.' };
  return { data };
}

async function handleApi(req, res, url) {
  const db = readDb();
  if (req.method === 'GET' && url.pathname === '/api/order-requests') return json(res, 200, db.orderRequests);
  if (req.method === 'GET' && url.pathname === '/api/affiliates') return json(res, 200, db.affiliates);

  if (req.method === 'POST' && url.pathname === '/api/order-requests') {
    const check = validateOrder(await parseBody(req));
    if (check.error) return json(res, 400, { message: check.error });
    const item = { id: randomUUID(), ...check.data, status: 'pending', createdAt: new Date().toISOString() };
    db.orderRequests.unshift(item); writeDb(db); return json(res, 201, item);
  }
  if (req.method === 'POST' && url.pathname === '/api/affiliates') {
    const check = validateAffiliate(await parseBody(req));
    if (check.error) return json(res, 400, { message: check.error });
    const item = { id: randomUUID(), ...check.data, status: 'pending', createdAt: new Date().toISOString() };
    db.affiliates.unshift(item); writeDb(db); return json(res, 201, item);
  }

  const match = url.pathname.match(/^\/api\/(order-requests|affiliates)\/([^/]+)\/status$/);
  if (req.method === 'PATCH' && match) {
    const body = await parseBody(req);
    if (!validStatuses.includes(body.status)) return json(res, 400, { message: 'Trạng thái không hợp lệ.' });
    const list = match[1] === 'order-requests' ? db.orderRequests : db.affiliates;
    const item = list.find(x => x.id === match[2]);
    if (!item) return json(res, 404, { message: 'Không tìm thấy yêu cầu.' });
    item.status = body.status; item.updatedAt = new Date().toISOString(); writeDb(db); return json(res, 200, item);
  }
  return json(res, 404, { message: 'API không tồn tại.' });
}

function serveStatic(req, res, url) {
  const routeMap = { '/': 'index.html', '/affiliate': 'affiliate.html', '/admin': 'admin.html' };
  const fileName = routeMap[url.pathname] || url.pathname.replace(/^\//, '');
  const filePath = path.normalize(path.join(PUBLIC_DIR, fileName));
  if (!filePath.startsWith(PUBLIC_DIR) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('Không tìm thấy trang');
  }
  const ext = path.extname(filePath);
  const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8' };
  res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  try {
    if (url.pathname.startsWith('/api/')) return await handleApi(req, res, url);
    return serveStatic(req, res, url);
  } catch (error) {
    return json(res, error.message.includes('JSON') ? 400 : 500, { message: error.message || 'Lỗi máy chủ.' });
  }
});

if (require.main === module) server.listen(PORT, () => console.log(`Website đang chạy: http://localhost:${PORT}`));
module.exports = server;
