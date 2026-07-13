// 라인 아이콘 (24x24, stroke)
const ICONS = {
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  pin: '<path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z"/><circle cx="12" cy="10" r="2.4"/>',
  users: '<circle cx="9" cy="8" r="3.2"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0"/><path d="M16 5.2a3.2 3.2 0 0 1 0 5.6"/><path d="M17.5 20a5.5 5.5 0 0 0-2-4.3"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/>',
  star: '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9Z"/>',
  heart: '<path d="M12 20.3S3.5 15.5 3.5 9.4C3.5 6.6 5.6 4.7 8 4.7c1.7 0 3.1 1 4 2.3 0.9-1.3 2.3-2.3 4-2.3 2.4 0 4.5 1.9 4.5 4.7 0 6.1-8.5 10.9-8.5 10.9Z"/>',
  arrow: '<path d="M5 12h14"/><path d="M13 6l6 6-6 6"/>',
  party: '<path d="M3.5 20.5l5.2-13.3 8.1 8.1-13.3 5.2Z"/><path d="M12 6.5c.8-.8.8-2 0-2.8M15.5 4.5c1.2 0 2.2 1 2.2 2.2M18 9.5c.8-.8 2-.8 2.8 0"/>',
  meeting: '<rect x="3.5" y="4" width="17" height="11" rx="1.6"/><path d="M12 15v4M8.5 21l3.5-2 3.5 2"/>',
  practice: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M6 11a6 6 0 0 0 12 0M12 17v3.4M8.5 20.5h7"/>',
  studio: '<rect x="3.5" y="7" width="17" height="12" rx="2"/><circle cx="12" cy="13" r="3.3"/><path d="M8 7l1.2-2h5.6L16 7"/>',
  cafe: '<path d="M5 8h11v5a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V8Z"/><path d="M16 9h2.5a2 2 0 0 1 0 4H16"/><path d="M7.5 3.5v1.6M10 3.5v1.6M12.5 3.5v1.6"/>',
  event: '<path d="M4 19.5h16M6 19.5V9l6-4 6 4v10.5"/><circle cx="12" cy="11.5" r="1.6"/>',
  study: '<path d="M12 6.5C10.5 5.3 8.5 5 5 5v13c3.5 0 5.5.3 7 1.5 1.5-1.2 3.5-1.5 7-1.5V5c-3.5 0-5.5.3-7 1.5Z"/><path d="M12 6.5v13"/>',
  office: '<rect x="3.5" y="7.5" width="17" height="11" rx="2"/><path d="M8.5 7.5V6a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v1.5"/><path d="M3.5 12.5h17"/>',
};
function iconSVG(key, size) {
  size = size || 20;
  return `<svg class="ic" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${ICONS[key] || ""}</svg>`;
}
