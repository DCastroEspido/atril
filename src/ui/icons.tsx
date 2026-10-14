// Inline icons; paths drawn on a 24px grid, filled with currentColor.
type IconProps = { className?: string };
const icon = (d: string) =>
  function Icon({ className }: IconProps) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
        <path fill="currentColor" d={d} />
      </svg>
    );
  };

export const PlayIcon = icon('M7 4.5v15l12-7.5z');
export const PauseIcon = icon('M6 4.5h4.5v15H6zm7.5 0H18v15h-4.5z');
export const StopIcon = icon('M6 6h12v12H6z');
export const StarIcon = icon('M12 3.5l2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6L3.3 9.8l6.1-.7z');
export const StarOutlineIcon = icon(
  'M12 3.5l2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6L3.3 9.8l6.1-.7zm0 4.3l-1.4 3-3.2.4 2.4 2.2-.6 3.2 2.8-1.6 2.8 1.6-.6-3.2 2.4-2.2-3.2-.4z',
);
export const TrashIcon = icon('M9 3h6l1 2h4v2H4V5h4zm-3 6h12l-1 12H7z');
export const ImportIcon = icon('M11 4h2v9.2l3.3-3.3 1.4 1.4L12 17l-5.7-5.7 1.4-1.4 3.3 3.3zM5 19h14v2H5z');
export const LoopIcon = icon('M7 7h10v3l4-4-4-4v3H5v6h2zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2z');
export const ShelfIcon = icon('M4 5h4v14H4zM10 5h4v14h-4zM16.2 5.6l3.8-1 3.6 13.5-3.8 1z');
export const InstallIcon = icon('M5 20h14v-2H5zm7-3l5-5h-3V4h-4v8H7z');
export const ExternalIcon = icon(
  'M14 4h6v6h-2V7.4l-7.3 7.3-1.4-1.4L16.6 6H14zM5 6h6v2H6v10h10v-5h2v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z',
);
export const SearchIcon = icon(
  'M10 3a7 7 0 0 1 5.6 11.2l5 5-1.4 1.4-5-5A7 7 0 1 1 10 3zm0 2a5 5 0 1 0 0 10 5 5 0 0 0 0-10z',
);
export const LinkIcon = icon(
  'M10.6 13.4a1 1 0 0 1 0-1.4l3-3a1 1 0 1 1 1.4 1.4l-3 3a1 1 0 0 1-1.4 0zM8.5 19a4.5 4.5 0 0 1-3.2-7.7l2.1-2.1 1.4 1.4-2.1 2.1a2.5 2.5 0 0 0 3.6 3.6l2.1-2.1 1.4 1.4-2.1 2.1A4.5 4.5 0 0 1 8.5 19zm8.1-5.6-1.4-1.4 2.1-2.1a2.5 2.5 0 0 0-3.6-3.6l-2.1 2.1-1.4-1.4 2.1-2.1a4.5 4.5 0 0 1 6.4 6.4z',
);
export const CloseIcon = icon(
  'M6.4 5 12 10.6 17.6 5 19 6.4 13.4 12 19 17.6 17.6 19 12 13.4 6.4 19 5 17.6 10.6 12 5 6.4z',
);
