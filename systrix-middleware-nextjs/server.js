/**
 * Custom Next.js server for Systrix Middleware
 * Displays startup information and available endpoints
 */

// Load environment variables first
require('dotenv').config();

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { displayStartupInfo } = require('./lib/startup-info');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3005;

// Initialize Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  })
  .once('error', (err) => {
    console.error(err);
    process.exit(1);
  })
  .listen(port, () => {
    // Display startup information
    displayStartupInfo(port);
  });
});
