import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { Url } from "@/models";
import { buildShortUrl } from "@/lib/short-url";

export const runtime = "nodejs";

const HEX_PATTERN = /^[0-9a-fA-F]{6}$/;

// Reads a 6-digit hex color query param, falling back to a default.
function readColor(value: string | null, fallback: string): string {
  return value && HEX_PATTERN.test(value) ? `#${value}` : fallback;
}

// GET /api/qr/[id] — QR code for the short link, generated on demand.
// Optional ?dark= and ?light= 6-digit hex params customize the colors;
// ?format=svg returns a scalable SVG instead of the default PNG.
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

    const { searchParams } = request.nextUrl;
    const dark = readColor(searchParams.get("dark"), "#000000");
    const light = readColor(searchParams.get("light"), "#ffffff");

    const shortUrl = buildShortUrl(request, id);
    const options = {
      width: 320,
      margin: 1,
      errorCorrectionLevel: "M" as const,
      color: { dark, light },
    };
    const cache = { "Cache-Control": "public, max-age=86400" };

    if (searchParams.get("format") === "svg") {
      const svg = await QRCode.toString(shortUrl, { type: "svg", ...options });
      return new NextResponse(svg, {
        headers: { "Content-Type": "image/svg+xml", ...cache },
      });
    }

    const png = await QRCode.toBuffer(shortUrl, options);
    return new NextResponse(new Uint8Array(png), {
      headers: { "Content-Type": "image/png", ...cache },
    });
  } catch (error) {
    console.error("Error generating QR code:", error);
    return NextResponse.json(
      { error: "Failed to generate QR code" },
      { status: 500 }
    );
  }
}
