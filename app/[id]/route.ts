import { NextRequest, NextResponse } from "next/server";
import { recordClick } from "@/lib/analytics";
import { validateAndNormalizeUrl } from "@/lib/url-validation";
import { resolveLink } from "@/lib/link-resolver";
import { chooseDestination } from "@/lib/redirect-resolver";
import { metrics } from "@/lib/metrics";

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

    // Cache-aside lookup: served from Redis when configured, else MySQL.
    const urlRecord = await resolveLink(id);

    if (!urlRecord) {
      metrics.redirects.inc({ result: "not_found" });
      return NextResponse.json({ error: "URL not found" }, { status: 404 });
    }

    // Reject expired links.
    const { expirationDate, originalUrl } = urlRecord;
    if (expirationDate && new Date() > new Date(expirationDate)) {
      metrics.redirects.inc({ result: "expired" });
      return NextResponse.json({ error: "URL has expired" }, { status: 410 });
    }

    if (!originalUrl) {
      return NextResponse.json(
        { error: "Original URL is missing" },
        { status: 500 }
      );
    }

    // Password-protected links route through the unlock gate; the click is
    // recorded there once the password is verified.
    if (urlRecord.passwordProtected) {
      return NextResponse.redirect(
        new URL(`/unlock/${id}`, request.url),
        { status: 302 }
      );
    }

    // Pick the destination: device override, A/B rotation, or the base URL.
    const chosen = chooseDestination(
      originalUrl,
      urlRecord.targets,
      request.headers.get("user-agent") || ""
    );

    let redirectUrl: string;
    try {
      redirectUrl = validateAndNormalizeUrl(chosen.url);
    } catch (error) {
      console.error("Destination URL is invalid:", chosen.url, error);
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 500 }
      );
    }

    // Record the click (with the served destination) before redirecting.
    // recordClick swallows its own errors, so logging can never break it.
    await recordClick(request.headers, id, redirectUrl);
    metrics.redirects.inc({ result: "ok" });

    return NextResponse.redirect(redirectUrl, { status: 302 });
  } catch (error) {
    console.error("Error redirecting URL:", error);
    return NextResponse.json(
      { error: "Failed to process redirection" },
      { status: 500 }
    );
  }
}
