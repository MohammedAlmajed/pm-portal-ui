/**
 * Brand mark: a white-label logo IMAGE when `logoUrl` is set, otherwise the glyph chip
 * (brand-colored square with `mark`). No hooks — safe in both server and client components.
 */
const SIZE = {
  sm: { chip: 'h-8 w-8 rounded-md', glyph: 'text-sm', img: 'h-8' },
  lg: { chip: 'h-11 w-11 rounded-lg', glyph: 'text-lg', img: 'h-11' },
} as const;

export function BrandLogo({
  logoUrl,
  mark,
  alt = '',
  size = 'sm',
}: {
  logoUrl?: string;
  mark: string;
  alt?: string;
  size?: keyof typeof SIZE;
}) {
  const s = SIZE[size];
  if (logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element -- external white-label logo (runtime env), not a bundled asset
    return <img src={logoUrl} alt={alt} className={`${s.img} w-auto object-contain`} />;
  }
  return (
    <div className={`flex items-center justify-center bg-brand text-on-brand ${s.chip}`}>
      <span className={`font-bold ${s.glyph}`}>{mark}</span>
    </div>
  );
}
