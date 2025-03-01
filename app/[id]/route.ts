import { NextRequest, NextResponse } from 'next/server';
import { Url } from '@/models';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Ensure params is properly handled
    const id = params.id;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Invalid short URL ID' },
        { status: 400 }
      );
    }
    
    // Look up the URL in the database
    const urlRecord = await Url.findByPk(id);
    
    // If URL doesn't exist, return 404
    if (!urlRecord) {
      return NextResponse.json(
        { error: 'URL not found' },
        { status: 404 }
      );
    }
    
    // Check if the URL has expired
    if (urlRecord.expirationDate && new Date() > urlRecord.expirationDate) {
      return NextResponse.json(
        { error: 'URL has expired' },
        { status: 410 } // Gone
      );
    }
    
    // Ensure originalUrl exists and is properly formatted
    if (!urlRecord.dataValues.originalUrl) {
      return NextResponse.json(
        { error: 'Original URL is missing' },
        { status: 500 }
      );
    }
    
    // Ensure the URL has a protocol
    let originalUrl = urlRecord.dataValues.originalUrl;
    if (!/^https?:\/\//i.test(originalUrl)) {
      originalUrl = 'https://' + originalUrl;
    }
    
    // Redirect to the original URL
    return NextResponse.redirect(originalUrl, { status: 302 });
    
  } catch (error) {
    console.error('Error redirecting URL:', error);
    return NextResponse.json(
      { error: 'Failed to process redirection' },
      { status: 500 }
    );
  }
} 