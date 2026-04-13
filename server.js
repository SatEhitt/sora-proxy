const https = require('https');
const http = require('http');
const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
  if (req.url === '/' || req.url === '/health') {
    res.writeHead(200); res.end(JSON.stringify({ status: 'ok' })); return;
  }

  let target, path = req.url;

  if (req.url.startsWith('/replicate/')) {
    target = 'api.replicate.com';
    path = req.url.replace('/replicate', '');
  } else if (req.url.startsWith('/v1/')) {
    target = 'api.openai.com';
  } else if (req.url.startsWith('/api/anthropic')) {
    target = 'api.anthropic.com';
    path = '/v1/messages';
  } else {
    res.writeHead(404); res.end(JSON.stringify({ error: 'Unknown route' })); return;
  }

  const chunks = [];
  req.on('data', c => chunks.push(c));
  req.on('end', () => {
    const body = Buffer.concat(chunks);
    const headers = {};
    ['authorization','content-type','x-api-key','anthropic-version','prefer'].forEach(h => {
      if (req.headers[h]) headers[h] = req.headers[h];
    });
    if (body.length > 0) headers['content-length'] = body.length;
    headers['host'] = target;
    const opts = { hostname: target, port: 443, path, method: req.method, headers };
    const pr = https.request(opts, pres => {
      const rh = Object.assign({}, pres.headers, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Expose-Headers': '*' });
      res.writeHead(pres.statusCode, rh);
      pres.pipe(res);
    });
    pr.on('error', err => { res.writeHead(502); res.end(JSON.stringify({ error: err.message })); });
    if (body.length > 0) pr.write(body);
    pr.end();
  });
});

server.listen(PORT, () => console.log(`Proxy running on port ${PORT}`));
