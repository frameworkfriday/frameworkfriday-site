type Person = {
  avatar_url: string | null;
  first_name: string;
  last_name: string;
};

interface AvatarStackProps {
  people: Person[];
  max?: number;
  size?: number;
  confirmedCount?: number;
  totalCount?: number;
}

export default function AvatarStack({ people, max = 5, size = 28, confirmedCount, totalCount }: AvatarStackProps) {
  const visible = people.slice(0, max);
  const overflow = people.length - max;
  const border = Math.max(2, Math.round(size / 14));
  const overlap = Math.round(size * 0.3);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      {/* Stacked circles */}
      <div style={{ display: "flex", alignItems: "center" }}>
        {visible.map((p, i) => {
          const initials = `${p.first_name?.[0] ?? ""}${p.last_name?.[0] ?? ""}`.toUpperCase();
          const common: React.CSSProperties = {
            width: `${size}px`,
            height: `${size}px`,
            borderRadius: "50%",
            border: `${border}px solid #FFFFFF`,
            flexShrink: 0,
            marginLeft: i === 0 ? 0 : `-${overlap}px`,
            position: "relative",
            zIndex: max - i,
          };
          return p.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={p.avatar_url}
              alt={`${p.first_name} ${p.last_name}`}
              style={{ ...common, objectFit: "cover" }}
            />
          ) : (
            <div
              key={i}
              style={{
                ...common,
                background: "rgba(255,79,26,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: `${Math.round(size * 0.36)}px`,
                color: "#FF4F1A",
              }}
            >
              {initials}
            </div>
          );
        })}
        {overflow > 0 && (
          <div
            style={{
              width: `${size}px`,
              height: `${size}px`,
              borderRadius: "50%",
              border: `${border}px solid #FFFFFF`,
              background: "#F0F0F0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: `${Math.round(size * 0.36)}px`,
              color: "#6E6E6E",
              marginLeft: `-${overlap}px`,
              position: "relative",
              zIndex: 0,
              flexShrink: 0,
            }}
          >
            +{overflow}
          </div>
        )}
      </div>

      {/* Label */}
      {confirmedCount !== undefined && (
        <span style={{ fontSize: "12px", fontWeight: 600, color: confirmedCount > 0 ? "#22C55E" : "#A3A3A3" }}>
          {totalCount !== undefined ? `${confirmedCount}/${totalCount}` : confirmedCount} confirmed
        </span>
      )}
    </div>
  );
}
