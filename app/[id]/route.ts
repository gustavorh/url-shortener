import { NextRequest, NextResponse } from "next/server";
import { Url } from "@/models";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Properly await and handle params in Next.js App Router
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Invalid short URL ID" },
        { status: 400 }
      );
    }

    // Look up the URL in the database and force plain object return
    const urlRecord = await Url.findByPk(id, { raw: true });

    // If URL doesn't exist, return 404
    if (!urlRecord) {
      return NextResponse.json({ error: "URL not found" }, { status: 404 });
    }

    // Check if the URL has expired
    console.log("URL RECORD:", urlRecord);
    const expirationDate = urlRecord.expirationDate;
    const currentDate = new Date();

    if (expirationDate && currentDate > new Date(expirationDate)) {
      console.log(
        "URL expired - Current date:",
        currentDate,
        "Expiration date:",
        expirationDate
      );
      return NextResponse.json(
        { error: "URL has expired" },
        { status: 410 } // Gone
      );
    }

    // Ensure originalUrl exists and is properly formatted
    const originalUrl = urlRecord.originalUrl;

    if (!originalUrl) {
      return NextResponse.json(
        { error: "Original URL is missing" },
        { status: 500 }
      );
    }

    // Ensure the URL has a protocol
    let redirectUrl = originalUrl.trim();

    // Check if the URL has a valid protocol
    if (!/^(https?|ftp):\/\//i.test(redirectUrl)) {
      redirectUrl = "https://" + redirectUrl;
    }

    // Make sure the URL is properly formatted
    try {
      // This will throw an error if the URL is invalid
      new URL(redirectUrl);
      console.log("Redirecting to:", redirectUrl);

      // Redirect to the original URL
      return NextResponse.redirect(redirectUrl, { status: 302 });
    } catch (error) {
      console.error("Invalid URL format:", redirectUrl, error);
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error redirecting URL:", error);
    return NextResponse.json(
      { error: "Failed to process redirection" },
      { status: 500 }
    );
  }
}
