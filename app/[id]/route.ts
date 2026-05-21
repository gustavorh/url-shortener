import { NextRequest, NextResponse } from "next/server";
import { Url } from "@/models";
import { recordClick } from "@/lib/analytics";
import { validateAndNormalizeUrl } from "@/lib/url-validation";

// Click tracking touches MySQL, so this route must run on the Node runtime.
export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Invalid short URL ID" },
        { status: 400 }
      );
    }

    const urlRecord = await Url.findByPk(id, { raw: true });

    if (!urlRecord) {
      return NextResponse.json({ error: "URL not found" }, { status: 404 });
    }

    // Reject expired links.
    const { expirationDate, originalUrl } = urlRecord;
    if (expirationDate && new Date() > new Date(expirationDate)) {
      return NextResponse.json({ error: "URL has expired" }, { status: 410 });
    }

    if (!originalUrl) {
      return NextResponse.json(
        { error: "Original URL is missing" },
        { status: 500 }
      );
    }

    let redirectUrl: string;
    try {
      redirectUrl = validateAndNormalizeUrl(originalUrl);
    } catch (error) {
      console.error("Stored URL is invalid:", originalUrl, error);
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 500 }
      );
    }

    // Record the click before redirecting. recordClick swallows its own
    // errors, so a logging failure can never break the redirect.
    await recordClick(request.headers, id);

    return NextResponse.redirect(redirectUrl, { status: 302 });
  } catch (error) {
    console.error("Error redirecting URL:", error);
    return NextResponse.json(
      { error: "Failed to process redirection" },
      { status: 500 }
    );
  }
}
