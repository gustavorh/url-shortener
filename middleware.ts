import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Function to log request details via API
const logRequestViaAPI = async (req: NextRequest) => {
  try {
    const url = req.url;
    const method = req.method;
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';
    
    // Don't log requests to the logging endpoint itself to avoid infinite loops
    if (url.includes('/api/log-request')) {
      return;
    }
    
    // Build the API URL using the request's origin
    const origin = req.nextUrl.origin;
    const apiUrl = `${origin}/api/log-request`;
    
    await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        method,
        url,
        ip,
        userAgent
      }),
    });
  } catch (error) {
    // Log error to console but don't interrupt request processing
    console.error('Error sending log to API:', error);
  }
};

// Middleware function
export function middleware(request: NextRequest) {
  // Don't block the response - log asynchronously
  logRequestViaAPI(request).catch(console.error);
  
  // Continue with the request
  return NextResponse.next();
}

// Configure which paths this middleware applies to
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/log-request (our logging endpoint)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/log-request).*)',
  ],
}; 