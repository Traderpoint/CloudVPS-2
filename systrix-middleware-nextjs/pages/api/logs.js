/**
 * Logs endpoint for Systrix Middleware NextJS
 * Returns recent log entries
 */

import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const logs = await getRecentLogs();
    
    res.status(200).json({
      success: true,
      logs,
      count: logs.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Logs endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve logs',
      message: error.message
    });
  }
}

async function getRecentLogs() {
  const logFile = path.join(process.cwd(), 'logs', 'middleware.log');
  const logs = [];

  try {
    if (fs.existsSync(logFile)) {
      const content = fs.readFileSync(logFile, 'utf8');
      const lines = content.split('\n').filter(line => line.trim());

      // Get last 100 lines
      const recentLines = lines.slice(-100);

      for (const line of recentLines) {
        try {
          const logEntry = JSON.parse(line);
          logs.push(logEntry);
        } catch (e) {
          // Skip invalid JSON lines
        }
      }
    }
  } catch (error) {
    console.error('Error reading logs', { error: error.message });
  }

  return logs.reverse(); // Most recent first
}
