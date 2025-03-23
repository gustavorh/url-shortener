import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  // Fetch body content
  const body = await request.json();
  console.log("URL: ", body.url);

  // Generate uuid
  const uuid: string = crypto
    .randomBytes(6)
    .toString("base64")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 6);

  console.log("Generated UUID: ", uuid);

  return NextResponse.json({ status: 201, uuid: uuid });
}
