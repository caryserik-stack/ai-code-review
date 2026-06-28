import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "AI Code Review";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    <div
      style={{
        background:
          "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "sans-serif",
        padding: "60px",
      }}
    >
      <div
        style={{
          background: "rgba(37, 99, 235, 0.15)",
          border: "1px solid rgba(37, 99, 235, 0.3)",
          borderRadius: "12px",
          padding: "8px 20px",
          color: "#93c5fd",
          fontSize: "18px",
          marginBottom: "24px",
          letterSpacing: "0.05em",
        }}
      >
        AI-powered analysis
      </div>

      <div
        style={{
          fontSize: "64px",
          fontWeight: "700",
          color: "#f8fafc",
          textAlign: "center",
          lineHeight: 1.1,
          marginBottom: "20px",
        }}
      >
        AI Code Review
      </div>

      <div
        style={{
          fontSize: "24px",
          color: "#94a3b8",
          textAlign: "center",
          maxWidth: "700px",
          lineHeight: 1.5,
        }}
      >
        Instant AI feedback on bugs, security issues and style — before your
        team sees it.
      </div>

      <div
        style={{
          display: "flex",
          gap: "16px",
          marginTop: "48px",
        }}
      >
        {["Bug detection", "Security checks", "Instant results"].map(
          (feature) => (
            <div
              key={feature}
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                padding: "10px 20px",
                color: "#cbd5e1",
                fontSize: "16px",
              }}
            >
              {feature}
            </div>
          ),
        )}
      </div>
    </div>,
    { ...size },
  );
}
