import { ImageResponse } from "next/og";
import { User } from "@/models";

export const runtime = "nodejs";
export const alt = "Perfil en Linkly";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Dynamic OpenGraph image for a public link-in-bio profile.
export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const user = await User.findOne({ where: { username }, raw: true });
  const displayName = user?.name || user?.username || "Linkly";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 88, fontWeight: 700 }}>{displayName}</div>
        <div style={{ fontSize: 34, opacity: 0.85, marginTop: 18 }}>
          /u/{username}
        </div>
        <div style={{ fontSize: 26, opacity: 0.7, marginTop: 48 }}>
          Creado con Linkly
        </div>
      </div>
    ),
    { ...size }
  );
}
