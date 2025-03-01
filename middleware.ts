import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Function to log request details via API
const logRequestViaAPI = async (req: NextRequest) => {
  try {
    // Don't log requests to static assets, images, etc.
    const url = req.url;
    if (url.includes('/_next/') || url.includes('/favicon.ico')) {
      return;
    }
    
    // Don't log requests to the logging endpoint itself to avoid infinite loops
    if (url.includes('/api/log-request')) {
      return;
    }
    
    const method = req.method;
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';
    
    // Build the API URL using the request's origin and host
    // Using absolute URL with protocol to avoid Edge Runtime issues
    const host = req.headers.get('host');
    const protocol = req.headers.get('x-forwarded-proto') || 'https';
    const apiUrl = `${protocol}://${host}/api/log-request`;
    
    // Set a timeout for the fetch request to avoid blocking
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout
    
    try {
      // Use fetch with keepalive to ensure the request completes even if the page navigates away
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
        signal: controller.signal,
        keepalive: true
      });
    } catch (fetchError: any) {
      // Don't throw the error up, just log it
      console.error('Error sending log to API:', fetchError.message);
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    // Log error to console but don't interrupt request processing
    console.error('Error in request logging middleware:', error);
  }
};

// Middleware function
export function middleware(request: NextRequest) {
  // Don't block the response - log asynchronously
  logRequestViaAPI(request).catch(error => {
    console.error('Error in middleware logging:', error);
  });
  
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