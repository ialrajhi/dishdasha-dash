export const icon = (name: string) => {
  const paths: Record<string, string> = {
    play: '<path d="m9 5 11 7-11 7z" fill="currentColor" stroke="none"/>',
    map: '<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15M15 6v15"/>',
    settings:
      '<path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"/><path d="m9 3-1 3-3 1-2 3 2 3-1 3 3 2 2 3 3-1 3 1 2-3 3-2-1-3 2-3-2-3-3-1-1-3z"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 1 1 4 3v2M13 17h.01"/>',
    trophy:
      '<path d="M7 3h10v6a5 5 0 0 1-10 0ZM7 5H3v3a4 4 0 0 0 4 4m10-7h4v3a4 4 0 0 1-4 4M12 14v6M7 21h10"/>',
    sound:
      '<path d="m4 9 4 0 5-4v14l-5-4H4zM16 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
    mute: '<path d="m4 9 4 0 5-4v14l-5-4H4zM17 9l5 6m0-6-5 6"/>',
    fullscreen: '<path d="M3 9V3h6m6 0h6v6m0 6v6h-6m-6 0H3v-6"/>',
    arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
    back: '<path d="M19 12H5m6-6-6 6 6 6"/>',
    pause: '<path d="M8 4v16M16 4v16" stroke-width="5"/>',
    heart:
      '<path d="M12 20 3 11V6l4-3 5 4 5-4 4 3v5z" fill="currentColor" stroke="none"/><path d="M5 6h3v2H5z" fill="#fff4ec" stroke="none"/>',
    tea: '<path d="M5 8h13l-2 13H7zM8 3v2m5-3v3m5-2v2M3 22h17"/>',
    star: '<path d="m12 2 3 7 7 1-5 5 1 7-6-4-6 4 1-7-5-5 7-1z"/>',
    lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4"/>',
    check: '<path d="m4 12 5 5L20 6"/>',
    jump: '<path d="M12 21V4m-7 7 7-7 7 7"/>',
    duck: '<path d="M12 3v17m-7-7 7 7 7-7"/>',
    shop: '<path d="M5 8h14l-1 13H6zM9 8V6a3 3 0 0 1 6 0v2"/>',
    music: '<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    starFill: '<path d="m12 2 3 7 7 1-5 5 1 7-6-4-6 4 1-7-5-5 7-1z" fill="currentColor"/>',
    restart: '<path d="M4 12a8 8 0 1 0 3-6.2M4 4v5h5"/>',
    upgrade: '<path d="M12 20V8m-6 6 6-6 6 6M5 4h14"/>',
    shirt: '<path d="M8 3 3 6l2 5 3-1v11h8V10l3 1 2-5-5-3a4 4 0 0 1-8 0Z"/>',
  };
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] ?? paths.star}</svg>`;
};
