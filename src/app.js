const express = require('express');
const os = require('os');

const app = express();
const startedAt = new Date();

app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html>
  <head><title>AWS DevOps Demo</title>
  <style>body{font-family:system-ui,sans-serif;max-width:640px;margin:60px auto;padding:0 16px;color:#222}
  code{background:#f2f2f2;padding:2px 6px;border-radius:4px}</style></head>
  <body>
    <h1>Deployed with Jenkins to AWS EC2</h1>
    <p>Version: <code>${process.env.APP_VERSION || 'local'}</code></p>
    <p>Container host: <code>${os.hostname()}</code></p>
    <p>Started: <code>${startedAt.toISOString()}</code></p>
    <p>Health check: <a href="/health">/health</a></p>
  </body>
</html>`);
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    version: process.env.APP_VERSION || 'local',
    uptimeSeconds: Math.round(process.uptime()),
  });
});

module.exports = app;
