
export default function Spinner({ size = 16, color = "currentColor" }) {
  return (
    <span
      style={{
        width: size,
        height: size,
        border: `1.5px solid ${color}`,
        borderTopColor: "transparent",
        borderRadius: "50%",
        animation: "spin .65s linear infinite",
        display: "inline-block",
        flexShrink: 0,
      }}
    />
  );
}