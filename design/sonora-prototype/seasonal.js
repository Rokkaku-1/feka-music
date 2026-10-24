/* Seasonal calendar uses the visitor's local date, without network requests. */
(() => {
  function seasonForDate(date) {
    if (!Number.isFinite(date.getTime())) return "default";
    return date.getMonth() === 9
      ? "halloween"
      : date.getMonth() === 11
        ? "christmas"
        : "default";
  }
  if (typeof document === "undefined") {
    if (typeof module !== "undefined") module.exports = { seasonForDate };
    return;
  }
  const local = ["localhost", "127.0.0.1"].includes(location.hostname);
  const preview = local
    ? new URLSearchParams(location.search).get("season-preview")
    : null;
  const root = document.documentElement;
  const themes = {
    halloween: {
      label: "OCTUBRE · HALLOWEEN",
      message: "Dale un poco de misterio a tu música.",
      color: "#a3450a",
      icon: '<path d="M12 7c-6-4-11 3-8 10 2 5 6 4 8 3 2 1 6 2 8-3 3-7-2-14-8-10Z"/><path d="M12 7V3l4-1M7 12l2-1m6 0 2 1M8 16l4 2 4-2"/>',
    },
    christmas: {
      label: "DICIEMBRE · NAVIDAD",
      message: "Que suene la magia de compartir.",
      color: "#136742",
      icon: '<path d="m12 2-5 6h3l-6 7h5l-5 5h16l-5-5h5l-6-7h3Zm0 18v3"/><path d="M9 11h.1M14 16h.1"/>',
    },
  };
  function apply() {
    const season = ["halloween", "christmas", "default"].includes(preview)
      ? preview
      : seasonForDate(new Date());
    root.dataset.season = season;
    const theme = themes[season],
      banner = document.querySelector("#season-banner");
    if (banner) {
      banner.hidden = !theme;
      if (theme)
        banner.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${theme.icon}</svg><span><strong>${theme.label}</strong><span>${theme.message}</span></span><span class="season-spark" aria-hidden="true">✧</span>`;
    }
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute(
        "content",
        theme?.color ||
          (document.body?.classList.contains("dark") ? "#171719" : "#fbfaf8"),
      );
  }
  apply();
  document.addEventListener(
    "DOMContentLoaded",
    () => {
      apply();
      new MutationObserver(apply).observe(document.body, {
        attributes: true,
        attributeFilter: ["class"],
      });
    },
    { once: true },
  );
  // Re-check the date after midnight, including tabs left open or suspended.
  setInterval(apply, 60000);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) apply();
  });
})();
