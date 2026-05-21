import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { Url } from "@/models";
import { buildShortUrl } from "@/lib/short-url";

export const runtime = "nodejs";

// GET /api/qr/[id] — returns a PNG QR code for the short link, generated
// on demand (not stored) and cached at the edge for a day.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const url = await Url.findByPk(id);
    if (!url) {
      return NextResponse.json({ error: "URL not found" }, { status: 404 });
    }

    const shortUrl = buildShortUrl(request, id);
    const png = await QRCode.toBuffer(shortUrl, {
      width: 320,
      margin: 1,
      errorCorrectionLevel: "M",
    });

    return new NextResponse(new Uint8Array(png), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error) {
    console.error("Error generating QR code:", error);
    return NextResponse.json(
      { error: "Failed to generate QR code" },
      { status: 500 }
    );
  }
}
