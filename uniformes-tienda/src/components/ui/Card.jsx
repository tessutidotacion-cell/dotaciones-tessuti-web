
export default function Card({ children, style = {} }) {
  return (
    <div
      style={{
        background: "var(--surface)",
        borderRadius: "var(--r-lg)",
        border: "1px solid var(--border)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}