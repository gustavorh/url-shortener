import { NextRequest, NextResponse } from 'next/server';
import { Log } from '../../../models';

// Configure this route to use the Node.js runtime instead of Edge
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body to get the log data
    const logData = await request.json();
    
    // Debug: Log all headers to see what's available
    console.log('=== REQUEST HEADERS ===');
    const headerEntries = Array.from(request.headers.entries());
    console.log(JSON.stringify(headerEntries, null, 2));
    
    // Check specific headers that might contain the client IP
    const cfConnectingIp = request.headers.get('cf-connecting-ip');
    const xForwardedFor = request.headers.get('x-forwarded-for');
    const xRealIp = request.headers.get('x-real-ip');
    const trueClientIp = request.headers.get('true-client-ip'); // Another Cloudflare header
    
    console.log('=== IP CANDIDATES ===');
    console.log('CF-Connecting-IP:', cfConnectingIp);
    console.log('X-Forwarded-For:', xForwardedFor);
    console.log('X-Real-IP:', xRealIp);
    console.log('True-Client-IP:', trueClientIp);
    console.log('logData.ip:', logData.ip);
    
    // Try additional Cloudflare-specific parsing if x-forwarded-for exists
    let parsedXForwardedFor = null;
    if (xForwardedFor) {
      // In Cloudflare, the format is often: <client>, <cloudflare>, <host>
      parsedXForwardedFor = xForwardedFor.split(',').map(ip => ip.trim());
      console.log('Parsed X-Forwarded-For:', parsedXForwardedFor);
    }
    
    // Get the real client IP by checking common proxy headers
    const realIp = 
      trueClientIp || // Cloudflare 'true-client-ip' header
      cfConnectingIp || // Cloudflare-specific header
      (parsedXForwardedFor && parsedXForwardedFor[0]) || // First IP in X-Forwarded-For
      xRealIp || // Another common header
      logData.ip; // Fallback to the provided IP
    
    console.log('Selected IP for logging:', realIp);
    
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