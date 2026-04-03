const https = require('https');
const http = require('http');

const PORT = process.env.PORT || 3000;
const OPENAI_HOST = 'api.openai.com';

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, multipart/form-data');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (!req.url.startsWith('/v1/videos') && !req.url.startsWith('/v1/video')) {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));
    return;
  }

  const chunks = [];
  req.on('data', chunk => chunks.push(chunk));
  req.on('end', () => {
    const body = Buffer.concat(chunks);

    const options = {
      hostname: OPENAI_HOST,
      port: 443,
      path: req.url,
      method: req.method,
      headers: { ...req.headers, host: OPENAI_HOST }
    };

    delete options.headers['content-length'];
    if (body.length > 0) options.headers['content-length'] = body.length;

    const proxyReq = https.request(options, proxyRes => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    });

    proxyReq.on('error', err => {
      res.writeHead(502);
      res.end(JSON.stringify({ error: err.message }));
    });

    if (body.length > 0) proxyReq.write(body);
    proxyReq.end();
  });
});

server.listen(PORT, () => console.log(`Sora proxy running on port ${PORT}`));
