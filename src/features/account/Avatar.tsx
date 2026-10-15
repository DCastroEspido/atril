import type { CSSProperties } from 'react';

interface Props {
  profile: { display_name: string; avatar_url: string | null };
  size: number;
}

const TINTS = ['var(--brown-red)', 'var(--hunter)', 'var(--chocolate)'];

/** Profile picture, or the nick's initials on a palette colour picked from the nick itself. */
export function Avatar({ profile, size }: Props) {
  const style = { '--size': `${size}px` } as CSSProperties;
  if (profile.avatar_url)
    return <img className="avatar" style={style} src={profile.avatar_url} alt="" width={size} height={size} />;
  const name = profile.display_name.trim() || '?';
  const initials = name
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');
  const tint = TINTS[[...name].reduce((h, c) => h + c.charCodeAt(0), 0) % TINTS.length];
  return (
    <span className="avatar initials" style={{ ...style, background: tint }} aria-hidden="true">
      {initials || name[0]!.toUpperCase()}
    </span>
  );
}
