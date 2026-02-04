// TOC progress indicator for article pages (Linear-style)
// Moves an active marker along the TOC rail as the reader scrolls.
(function () {
  const toc = document.querySelector(".article-toc");
  const nav = document.querySelector(".article-toc-nav");
  if (!toc || !nav) return;

  const links = Array.from(nav.querySelectorAll('a[href^="#"]'));
  if (links.length === 0) return;

  const items = links
    .map((a) => {
      const id = decodeURIComponent(a.getAttribute("href").slice(1));
      const heading = document.getElementById(id);
      return heading ? { a, heading } : null;
    })
    .filter(Boolean);

  if (items.length === 0) return;

  let activeIdx = -1;
  let ticking = false;

  function setActive(idx) {
    if (idx === activeIdx) return;
    activeIdx = idx;

    for (const { a } of items) {
      a.classList.remove("toc-active");
      a.removeAttribute("aria-current");
    }

    if (idx < 0) {
      nav.style.setProperty("--toc-indicator-opacity", "0");
      return;
    }

    const activeLink = items[idx].a;
    activeLink.classList.add("toc-active");
    activeLink.setAttribute("aria-current", "location");

    const navRect = nav.getBoundingClientRect();
    const linkRect = activeLink.getBoundingClientRect();
    const top = linkRect.top - navRect.top;
    const height = linkRect.height;

    nav.style.setProperty("--toc-indicator-opacity", "1");
    nav.style.setProperty("--toc-indicator-top", `${top}px`);
    nav.style.setProperty("--toc-indicator-height", `${height}px`);
  }

  function computeActiveIndex() {
    // Pick the last heading that has crossed a threshold near the top.
    const thresholdPx = 120;
    let idx = 0;
    for (let i = 0; i < items.length; i++) {
      const top = items[i].heading.getBoundingClientRect().top;
      if (top <= thresholdPx) idx = i;
      else break;
    }
    return idx;
  }

  function onScrollOrResize() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(() => {
      ticking = false;
      setActive(computeActiveIndex());
    });
  }

  // Initial position
  setActive(computeActiveIndex());

  window.addEventListener("scroll", onScrollOrResize, { passive: true });
  window.addEventListener("resize", onScrollOrResize);
})();

