import React from "react";

export default function LogoBox({ logo, name, color, size = 48 }) {
  const initials = name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  if (logo) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: 8,
          overflow: "hidden",
          border: "1px solid var(--border)",
          background: "#fff",
          flexShrink: 0,
        }}
      >
        <img src={logo} alt={name} style={{ width: "100%", height: "100%", objectFit: "contain", padding: 4 }} />
      </div>
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 8,
        background: color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontWeight: 700,
        fontSize: size * 0.3,
        flexShrink: 0,
        fontFamily: "'Inter',sans-serif",
      }}
    >
      {initials}
    </div>
  );
}