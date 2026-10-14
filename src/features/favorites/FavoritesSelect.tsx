import type { LibraryEntry } from '../library/types';

interface Props {
  favorites: LibraryEntry[];
  currentId: string | null;
  onOpen: (id: string) => void;
}

export function FavoritesSelect({ favorites, currentId, onOpen }: Props) {
  const value = favorites.some((f) => f.id === currentId) ? currentId! : '';
  return (
    <div className="fav-pick">
      <label className="eyebrow" htmlFor="favSelect">
        Favoritas
      </label>
      <select
        id="favSelect"
        className="select"
        value={value}
        onChange={(e) => e.target.value && onOpen(e.target.value)}
      >
        <option value="" disabled>
          {favorites.length ? `★ Elige una (${favorites.length})` : 'Marca canciones con ★'}
        </option>
        {favorites.map((f) => (
          <option key={f.id} value={f.id}>
            {f.title}
            {f.artist ? ` — ${f.artist}` : ''}
          </option>
        ))}
      </select>
    </div>
  );
}
