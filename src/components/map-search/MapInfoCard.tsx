interface MapInfoCardProps {
  name: string;
  hebrewName?: string | null;
  subtitle?: string | null;
  badge?: { label: string; color: string } | null;
  description?: string | null;
  address?: string | null;
  phone?: string | null;
  website?: string | null;
  categoryDot?: string | null;
}

function truncate(text: string, max: number) {
  return text.length > max ? text.slice(0, max).trimEnd() + '…' : text;
}

const BRAND_PRIMARY = 'hsl(213, 94%, 45%)';
const TEXT_PRIMARY = 'hsl(222, 47%, 11%)';
const TEXT_MUTED = 'hsl(215, 16%, 47%)';

export function MapInfoCard({
  name,
  hebrewName,
  subtitle,
  badge,
  description,
  address,
  phone,
  website,
}: MapInfoCardProps) {
  // Replace "Anglo" with "International" in descriptions (brand voice)
  const cleanDescription = description
    ?.replace(/\bAnglo\b/gi, 'International')
    ?? null;

  return (
    <div
      style={{
        fontFamily: "'Inter', system-ui, sans-serif",
        maxWidth: 240,
        padding: 8,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        lineHeight: 1.4,
      }}
    >
      {/* Name */}
      <div style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY }}>
        {name}
      </div>

      {/* Hebrew name */}
      {hebrewName && (
        <div style={{ fontSize: 11, color: TEXT_MUTED, direction: 'rtl' }}>
          {hebrewName}
        </div>
      )}

      {/* Subtitle (subcategory, denomination, etc.) */}
      {subtitle && (
        <div style={{ fontSize: 11, color: TEXT_MUTED }}>
          {subtitle}
        </div>
      )}

      {/* Badge (e.g. english level) */}
      {badge && (
        <span
          style={{
            display: 'inline-block',
            alignSelf: 'flex-start',
            fontSize: 10,
            fontWeight: 600,
            padding: '2px 6px',
            borderRadius: 9999,
            backgroundColor: `${badge.color}18`,
            color: badge.color,
          }}
        >
          {badge.label}
        </span>
      )}

      {/* Description */}
      {cleanDescription && (
        <div style={{ fontSize: 11, color: TEXT_MUTED }}>
          {truncate(cleanDescription, 120)}
        </div>
      )}

      {/* Address */}
      {address && (
        <div style={{ fontSize: 11, color: TEXT_MUTED, opacity: 0.8 }}>
          {address}
        </div>
      )}

      {/* Action links */}
      {(phone || website) && (
        <div style={{ display: 'flex', gap: 10, marginTop: 2 }}>
          {phone && (
            <a
              href={`tel:${phone}`}
              style={{ fontSize: 11, color: BRAND_PRIMARY, textDecoration: 'none', fontWeight: 500 }}
            >
              📞 Call
            </a>
          )}
          {website && (
            <a
              href={website.startsWith('http') ? website : `https://${website}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 11, color: BRAND_PRIMARY, textDecoration: 'none', fontWeight: 500 }}
            >
              🔗 Website
            </a>
          )}
        </div>
      )}
    </div>
  );
}
