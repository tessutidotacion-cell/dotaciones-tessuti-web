import React from "react";

export default function Btn({ children, onClick, variant = "primary", full, lg, disabled, style = {} }) {
  const base = {
    padding: lg ? "11px 22px" : "8px 16px",
    borderRadius: 6,
    fontWeight: 500,
    fontSize: lg ? 14 : 13,
    cursor: "pointer",
    width: full ? "100%" : undefined,
    border: "none",
    transition: "all .15s",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    letterSpacing: ".01em",
    ...style,
  };

  const V = {
    primary: { background: "#0f0e0c", color: "#fff" },
    accent: { background: "var(--accent)", color: "#fff" },
    outline: { background: "transparent", color: "var(--ink-2)", border: "1px solid var(--border-2)" },
    ghost: { background: "transparent", color: "var(--ink-3)" },
    danger: { background: "#991b1b", color: "#fff" },
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ ...base, ...V[variant] }}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.opacity = ".82";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.opacity = "1";
      }}
    >
      {children}
    </button>
  );
}