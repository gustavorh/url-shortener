import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { format } from 'date-fns';

// Define the path for the log file
const LOG_FILE_PATH = path.join(process.cwd(), 'logs', 'request-logs.txt');

// Ensure logs directory exists
const ensureLogsDirectoryExists = () => {
  const logsDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
};

export async function POST(request: NextRequest) {
  try {
    // Parse the request body to get the log data
    const logData = await request.json();
    
    // Format the timestamp
    const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
    
    // Create the log entry
    const logEntry = `[${timestamp}] ${logData.method} ${logData.url} - IP: ${logData.ip} - User-Agent: ${logData.userAgent}\n`;
    
    // Ensure the logs directory exists
    ensureLogsDirectoryExists();
    
    // Append log entry to file
    fs.appendFileSync(LOG_FILE_PATH, logEntry);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error writing to request log:', error);
    return NextResponse.json({ success: false, error: 'Failed to log request' }, { status: 500 });
  }
} 