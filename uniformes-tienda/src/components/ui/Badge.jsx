import { STATUS_META } from "../../constants/status";

export default function Badge({ status }) {
  const m = STATUS_META[status] || STATUS_META["Pago en validación"];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 9px",
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: ".02em",
        background: m.bg,
        color: m.text,
        whiteSpace: "nowrap",
        border: `1px solid ${m.dot}40`,
      }}
    >
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: m.dot, flexShrink: 0 }} />
      {status}
    </span>
  );
}