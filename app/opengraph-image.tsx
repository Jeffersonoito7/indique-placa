import { ImageResponse } from "next/og";
import { readFile } from "fs/promises";
import { join } from "path";

export const runtime = "nodejs";
export const alt = "Indique Placa";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage() {
  const imgData = await readFile(join(process.cwd(), "public/og-image.png"));
  const imgBase64 = `data:image/png;base64,${imgData.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#000000",
        }}
      >
        <img src={imgBase64} width={1200} height={630} style={{ objectFit: "cover" }} />
      </div>
    ),
    { ...size }
  );
}
