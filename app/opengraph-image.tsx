import { ImageResponse } from "next/og";
import { readFile } from "fs/promises";
import { join } from "path";

export const runtime = "nodejs";
export const alt = "Indique Placa";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage() {
  const logoData = await readFile(join(process.cwd(), "public/favicon-indique.png"));
  const logoBase64 = `data:image/png;base64,${logoData.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#000000",
          fontFamily: "sans-serif",
        }}
      >
        {/* Logo centralizada no branco */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
          <img
            src={logoBase64}
            width={560}
            height={560}
            style={{ objectFit: "contain" }}
          />

          {/* URL */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(16,185,129,0.12)",
              border: "2px solid rgba(16,185,129,0.5)",
              borderRadius: 99,
              padding: "10px 28px",
            }}
          >
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#10b981" }} />
            <span style={{ fontSize: 22, fontWeight: 700, color: "#10b981", letterSpacing: 1 }}>
              indiqueplaca.com.br
            </span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
