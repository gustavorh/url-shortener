import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { Url } from "@/database/models/url";

function generateUuid(): string {
  const uuid: string = crypto
    .randomBytes(6)
    .toString("base64")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 6);

  return uuid;
}

export async function POST(request: NextRequest) {
  // Fetch body content
  const body = await request.json();

  // Generate uuid
  let uuid: string = generateUuid();
  /*console.log("UUID: ", uuid);*/

  // Collision checking
  const collision = await Url.findByPk(uuid); // If no collision null value is taken
  while (collision != null) {
    console.log("Collision detected! - ", collision);
    uuid = generateUuid();
    console.log("Newly generated UUID: ", uuid);
  }

  // Persist data
  const urlObject = await Url.create({ id: uuid, url: body.url });

  return NextResponse.json({ response: urlObject }, { status: 201 });
}
