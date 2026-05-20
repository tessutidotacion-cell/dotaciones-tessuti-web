import { useEffect } from "react";

export default function Toast({ msg, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  const styles = {
    error: { bg: "#7f1d1d", border: "rgba(255,255,255,.1)" },
    success: { bg: "#064e3b", border: "rgba(255,255,255,.1)" },
    default: { bg: "#111827", border: "rgba(255,255,255,.1)" },
  };

  const s = styles[type] || styles.default;
  return (
    <div className="toast" style={{ background: s.bg, color: "#fff", borderColor: s.border }}>
      {msg}
    </div>
  );
}