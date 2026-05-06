
export default function SectionTitle({ children, sub }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h2
        style={{
          fontSize: "clamp(22px,3vw,30px)",
          color: "var(--ink)",
          fontFamily: "'Cormorant Garamond',serif",
          letterSpacing: ".02em",
        }}
      >
        {children}
      </h2>
      {sub && <p style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 4 }}>{sub}</p>}
    </div>
  );
}