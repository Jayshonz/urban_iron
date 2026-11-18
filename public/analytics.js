(function initializeUrbanIronAnalytics() {
  const script = document.currentScript;
  const measurementId = script?.dataset.measurementId || '';
  const allowedEventName = /^[a-z][a-z0-9_]{0,39}$/;
  const allowedParameterName = /^[a-z][a-z0-9_]{0,39}$/;

  function surface() {
    const hostname = window.location.hostname.toLowerCase();
    if (hostname === 'admin.urbaniron.co') return 'race_admin';
    if (window.location.pathname.startsWith('/races')) return 'race_admin';
    return 'athlete_portal';
  }

  function cleanParameters(parameters = {}) {
    return Object.fromEntries(Object.entries(parameters)
      .filter(([key, value]) => allowedParameterName.test(key)
        && ['string', 'number', 'boolean'].includes(typeof value))
      .map(([key, value]) => [key, typeof value === 'string' ? value.slice(0, 100) : value]));
  }

  function track(eventName, parameters = {}) {
    if (!measurementId || !allowedEventName.test(eventName) || typeof window.gtag !== 'function') return;
    window.gtag('event', eventName, cleanParameters({ surface: surface(), ...parameters }));
  }

  window.urbanIronAnalytics = Object.freeze({ track });
  if (!measurementId || !/^G-[A-Z0-9]+$/.test(measurementId)) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', measurementId, {
    anonymize_ip: true,
    cookie_flags: 'SameSite=None;Secure',
    send_page_view: true,
  });

  const loader = document.createElement('script');
  loader.async = true;
  loader.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  document.head.appendChild(loader);
}());
