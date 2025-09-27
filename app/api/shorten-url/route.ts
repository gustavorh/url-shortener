// POST /api/shorten-url
// Take the original url, hash it using a lightweight hash function and base62 encode it, only use 5 characters of the hash
// Store the original url, the shortened url, and the expiration date in the database
// Return the shortened url

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { Url } from "@/models";

// Base62 character set for encoding (0-9, a-z, A-Z)
const BASE62_CHARS =
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

// Function to convert a hash to base62
function toBase62(hash: Buffer): string {
  let result = "";
  const hex = hash.toString("hex");

  // Convert the hex hash to a large number
  let num = BigInt("0x" + hex);

  // Convert to base62
  while (num > 0) {
    const remainder = Number(num % BigInt(62));
    result = BASE62_CHARS[remainder] + result;
    num = num / BigInt(62);
  }

  return result.padStart(5, "0").substring(0, 5);
}

// Function to generate a short URL
async function generateUniqueShortUrl(originalUrl: string): Promise<string> {
  let isUnique = false;
  let shortUrl = "";
  let attempts = 0;

  while (!isUnique && attempts < 100) {
    // Add an attempts counter to the hash input to generate different results
    // if we get a collision
    const hashInput = originalUrl + (attempts > 0 ? `-${attempts}` : "");

    // Create a hash of the URL
    const hash = crypto.createHash("md5").update(hashInput).digest();

    // Convert to base62 and take first 5 characters
    shortUrl = toBase62(hash);

    // Check if the ID already exists in DB
    const existing = await Url.findByPk(shortUrl);

    if (!existing) {
      isUnique = true;
    } else {
      attempts++;
    }
  }

  if (!isUnique) {
    throw new Error(
      "Failed to generate a unique short URL after multiple attempts"
    );
  }

  return shortUrl;
}

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();

    // Validate required fields
    if (!body.originalUrl) {
      return NextResponse.json(
        { error: "Original URL is required" },
        { status: 400 }
      );
    }

    // Ensure the URL has a protocol
    let originalUrl = body.originalUrl;
    if (!/^https?:\/\//i.test(originalUrl)) {
      originalUrl = "https://" + originalUrl;
    }

    // Generate a unique short URL ID
    const shortUrlId = await generateUniqueShortUrl(originalUrl);

    // Create expiration date object if provided
    const expirationDate = body.expirationDate
      ? new Date(body.expirationDate)
      : undefined;

    // Save the URL to the database
    await Url.create({
      id: shortUrlId,
      originalUrl,
      expirationDate,
      // creationDate will be set automatically by default value
    });

    // Fetch the URL from the database to get all attributes
    const urlObject = await Url.findByPk(shortUrlId);

    // Get the host from the request
    const host = request.headers.get("host") || request.nextUrl.origin;

    // Convert to plain object to ensure attributes are accessible
    const plainUrlObject = urlObject?.toJSON();

    // Format the response with shortUrl including the host
    const response = {
      shortUrl: `${host}/${shortUrlId}`,
      originalUrl: plainUrlObject?.originalUrl,
      expirationDate: plainUrlObject?.expirationDate,
      creationDate: plainUrlObject?.creationDate,
    };

    // Return formatted response
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Error shortening URL:", error);
    return NextResponse.json(
      { error: "Failed to shorten URL" },
      { status: 500 }
    );
  }
}
