import { NextRequest, NextResponse } from 'next/server';
import { Log } from '../../../models';

// Configure this route to use the Node.js runtime instead of Edge
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body to get the log data
    const logData = await request.json();
    
    // Get the real client IP by checking common proxy headers
    const realIp = 
      request.headers.get('cf-connecting-ip') || // Cloudflare-specific header
      request.headers.get('x-forwarded-for')?.split(',')[0] || // Standard proxy header (first IP is the client)
      request.headers.get('x-real-ip') || // Another common header
      logData.ip; // Fallback to the provided IP
    
    // Create a log entry in the database
    await Log.create({
      method: logData.method,
      url: logData.url,
      ip: realIp, // Use the real client IP
      userAgent: logData.userAgent,
      // timestamp defaults to now
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error writing to request log:', error);
    // Return a 200 status even on error to prevent failures from affecting the user experience
    return NextResponse.json({ success: false, error: 'Failed to log request' }, { status: 200 });
  }
} 