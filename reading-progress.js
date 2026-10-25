/* One reading-progress implementation for every course page. */
(() => {
  const content = document.querySelector('.main-content');
  const topbar = document.querySelector('.topbar');
  if (!content || !topbar) return;

  let targets = Array.from(content.querySelectorAll('[data-reading-section]'));
  if (!targets.length) targets = Array.from(content.querySelectorAll('.subsection'));
  if (!targets.length) targets = Array.from(content.querySelectorAll(':scope > section'));
  if (targets.length < 2) {
    const headings = Array.from(content.querySelectorAll('h2'));
    if (headings.length > targets.length) targets = headings;
  }
  if (!targets.length) targets = Array.from(content.querySelectorAll('.part-banner'));
  if (!targets.length) targets = [content];

  const bar = document.getElementById('chapterProgressBar') || document.createElement('nav');
  bar.id = 'chapterProgressBar';
  bar.className = 'chapter-progress-bar';
  bar.setAttribute('role', 'navigation');
  bar.setAttribute('aria-label', 'Page sections · reading progress');
  bar.replaceChildren();
  topbar.appendChild(bar);

  const labels = [];
  const links = targets.map((target, index) => {
    if (!target.id) {
      let id = `reading-section-${index + 1}`;
      while (document.getElementById(id)) id += '-section';
      target.id = id;
    }
    target.classList.add('reading-progress-target');
    const heading = target.matches('h2, .part-banner') ? target :
      target.querySelector('.subsection-title') || target.querySelector('h2') ||
      target.querySelector('.section-title') || target.querySelector('h3') ||
      target.querySelector('.part-pill');
    const label = target.dataset.readingLabel ||
      heading?.textContent.replace(/\s+/g, ' ').trim() || `Section ${index + 1}`;
    labels.push(label);
    const link = document.createElement('a');
    link.className = 'progress-segment';
    link.href = `#${target.id}`;
    link.setAttribute('aria-label', label);
    link.title = label;
    link.addEventListener('click', () => {
      // Keep headings clear of both the sticky header and its progress strip.
      target.style.scrollMarginTop = `${topbar.offsetHeight + bar.offsetHeight + 12}px`;
    });
    bar.appendChild(link);
    return link;
  });

  const status = document.createElement('span');
  status.className = 'reading-progress-status';
  status.setAttribute('role', 'progressbar');
  status.setAttribute('aria-label', 'Page reading position');
  status.setAttribute('aria-valuemin', '0');
  status.setAttribute('aria-valuemax', '100');
  bar.appendChild(status);

  let pending = false;
  function update() {
    pending = false;
    const scroll = window.scrollY;
    const range = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const atEnd = scroll >= range - 2;
    const cursor = scroll + topbar.offsetHeight + bar.offsetHeight + 12;
    const starts = targets.map(target => target.getBoundingClientRect().top + scroll);
    const end = content.getBoundingClientRect().bottom + scroll;
    let active = 0;
    starts.forEach((start, index) => { if (cursor >= start - 2) active = index; });
    if (atEnd) active = links.length - 1;
    links.forEach((link, index) => {
      const finish = starts[index + 1] ?? end;
      const fraction = atEnd ? 1 : Math.max(0, Math.min(1,
        (cursor - starts[index]) / Math.max(1, finish - starts[index])));
      link.style.setProperty('--read', `${fraction * 100}%`);
      link.classList.toggle('completed', fraction === 1);
      link.classList.toggle('active', index === active);
      if (index === active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
      link.title = `${labels[index]} · Reading position ${Math.round(fraction * 100)}%`;
    });
    status.setAttribute('aria-valuenow', String(range ? Math.round(100 * scroll / range) : 100));
  }
  function scheduleUpdate() {
    if (!pending) {
      pending = true;
      requestAnimationFrame(update);
    }
  }
  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', scheduleUpdate);
  window.addEventListener('load', scheduleUpdate);
  // Corrections, proofs, fonts and images can all change the reading distance.
  const observer = new ResizeObserver(scheduleUpdate);
  observer.observe(content);
  observer.observe(topbar);
  update();
})();
