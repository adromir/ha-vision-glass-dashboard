/**
 * Vision Glass - Default Landing Page Sync
 * Automatically ensures Home Assistant opens directly into Vision Glass (/vision-glass)
 * instead of the default /lovelace overview when launched in a browser or companion app.
 */
(function () {
  try {
    localStorage.setItem('defaultPanel', JSON.stringify('vision-glass'));
  } catch (_) {}

  // Check if browser is loading root '/' or default lovelace overview on cold load
  const path = window.location.pathname;
  const isDefaultLanding =
    path === '/' ||
    path === '/lovelace' ||
    path === '/lovelace/0' ||
    path === '/lovelace/home';

  const isBypass =
    window.location.search.includes('lovelace=1') ||
    sessionStorage.getItem('vg_allow_lovelace') === '1';

  if (isDefaultLanding && !isBypass) {
    window.location.replace('/vision-glass');
  }

  // Allow navigation to /lovelace if explicitly clicked in sidebar
  document.addEventListener(
    'click',
    (e) => {
      const pathElements = typeof e.composedPath === 'function' ? e.composedPath() : [];
      const link = pathElements.find(
        (el) => el && el.tagName === 'A' && el.getAttribute && el.getAttribute('href')?.startsWith('/lovelace')
      );
      if (link) {
        sessionStorage.setItem('vg_allow_lovelace', '1');
      }
    },
    { capture: true, passive: true }
  );
})();
