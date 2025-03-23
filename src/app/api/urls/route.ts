import { Url } from "@/database/models/url";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const urls = await Url.findAll();

  if (urls.length == 0) {
    return new NextResponse(null, { status: 204 });
  }

  return NextResponse.json({ urls }, { status: 200 });
}
