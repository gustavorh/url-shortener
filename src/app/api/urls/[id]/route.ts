import { Url } from "@/database/models/url";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const urlObject = await Url.findByPk(id);
    if (!urlObject) {
      return NextResponse.json({ error: "ID not found" }, { status: 404 });
    }

    const redirectUrl = "https://" + urlObject.dataValues.url;

    return NextResponse.redirect(redirectUrl, { status: 302 });
  } catch (error) {
    console.error("Error in GET handler:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
