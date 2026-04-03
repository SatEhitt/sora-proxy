const https = require('https');
const http = require('http');

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === '/' || req.url === '/health') {
    res.writeHead(200);
    res.end(JSON.stringify({ status: 'ok', proxy: 'sora-proxy' }));
    return;
  }

  if (!req.url.startsWith('/v1/')) {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Only /v1/ paths are proxied' }));
    return;
  }

  const chunks = [];
  req.on('data', chunk => chunks.push(chunk));
  re
