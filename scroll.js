(() => {
  'use strict';
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const smallScreen = matchMedia('(max-width: 650px)');
  const main = document.querySelector('main');
  if (!main) return;
  const clamp = (value, low = 0, high = 1) => Math.max(low, Math.min(high, value));
  const enabled = () => document.body.dataset.motion !== 'off' && !reducedMotion.matches && !document.hidden;
  const records = [];
  const variables = new Map();
  let viewportHeight = innerHeight;
  let maxScroll = 1;
  let geometryDirty = true;
  let frame = 0;
  let previousTime = 0;
  let currentScroll = scrollY;
  let targetScroll = scrollY;
  let scrollVelocity = 0;

  function addDecoration(parent, className) {
    const node = document.createElement('span');
    node.className = className;
    node.setAttribute('aria-hidden', 'true');
    parent.append(node);
    return node;
  }
  const progress = document.createElement('div');
  progress.className = 'reading-progress';
  progress.setAttribute('aria-hidden', 'true');
  addDecoration(progress, 'reading-progress-fill');
  document.body.prepend(progress);

  function record(element, kind) {
    if (!element) return;
    element.classList.add(kind === 'section' || kind === 'hero' ? 'scroll-scene' : 'scroll-layer');
    records.push({ element, kind, top: 0, height: 0, wasActive: false });
  }
  record(document.querySelector('.hero'), 'hero');
  document.querySelectorAll('main>.section').forEach(section => {
    record(section, 'section');
    const heading = section.querySelector('.section-top');
    if (heading) { addDecoration(heading, 'scroll-section-line'); record(heading, 'line'); }
  });
  document.querySelectorAll('.project-visual').forEach(card => {
    addDecoration(card, 'scroll-card-meter');
    record(card, 'card');
  });
  document.querySelectorAll('.research-entry, .research-card').forEach(entry => {
    addDecoration(entry, 'scroll-entry-meter');
    record(entry, 'entry');
  });
  document.querySelectorAll('.showreel-player').forEach(player => {
    addDecoration(player, 'scroll-reel-edge');
    record(player, 'reel');
  });

  // Offset coordinates ignore reveal/tilt/scroll transforms, keeping progress stable.
  function layoutTop(element) {
    let top = 0;
    let node = element;
    while (node) { top += node.offsetTop; node = node.offsetParent; }
    return top;
  }
  function measure() {
    viewportHeight = Math.max(1, innerHeight);
    maxScroll = Math.max(1, document.documentElement.scrollHeight - viewportHeight);
    records.forEach(item => {
      item.top = layoutTop(item.element);
      item.height = Math.max(1, item.element.offsetHeight);
    });
    geometryDirty = false;
  }
  function set(element, name, value) {
    let cache = variables.get(element);
    if (!cache) { cache = new Map(); variables.set(element, cache); }
    if (cache.get(name) === value) return;
    cache.set(name, value);
    element.style.setProperty(name, value);
  }
  const pixels = value => `${value.toFixed(2)}px`;
  const degrees = value => `${value.toFixed(2)}deg`;
  const number = value => value.toFixed(4);

  function paint() {
    const compact = smallScreen.matches;
    const amplitude = compact ? .38 : 1;
    const speed = clamp(scrollVelocity / 900, -1, 1);
    set(progress, '--reading-progress', number(clamp(currentScroll / maxScroll)));
    records.forEach(item => {
      const { element, kind, top, height } = item;
      const inRange = currentScroll + viewportHeight >= top - 100 && currentScroll <= top + height + 100;
      if (!inRange && !item.wasActive) return;
      item.wasActive = inRange;
      const phase = clamp((currentScroll + viewportHeight - top) / (height + viewportHeight));
      const centered = clamp((currentScroll + viewportHeight * .5 - top - height * .5) / ((viewportHeight + height) * .5), -1, 1);
      if (kind === 'hero') {
        const exit = clamp((currentScroll - top) / height);
        set(element, '--hero-title-drift', pixels(exit * 118 * amplitude));
        set(element, '--hero-title-turn', degrees(exit * -1.7 * amplitude));
        set(element, '--hero-title-scale', number(1 - exit * .075 * amplitude));
        set(element, '--hero-art-drift', pixels(exit * 235 * amplitude));
        set(element, '--hero-art-turn', degrees(exit * 8 * amplitude));
        set(element, '--hero-art-scale', number(1 + exit * .17 * amplitude));
        set(element, '--hero-glass-turn', degrees(exit * 24 * amplitude));
        set(element, '--hero-eyebrow-drift', pixels(exit * 30 * amplitude));
        set(element, '--hero-index-drift', pixels(exit * -45 * amplitude));
      } else if (kind === 'card') {
        set(element, '--card-turn', degrees((centered * 2.1 + speed * .65) * amplitude));
        set(element, '--card-image-drift', pixels(centered * -44 * amplitude));
        set(element, '--card-image-scale', number(1.015 + (1 - Math.abs(centered)) * .025 * amplitude));
        set(element, '--card-copy-drift', pixels(centered * 18 * amplitude));
        set(element, '--card-label-drift', pixels(centered * 15 * amplitude));
        set(element, '--card-progress', number(phase));
      } else if (kind === 'entry') {
        set(element, '--entry-drift', pixels(centered * -22 * amplitude));
        set(element, '--entry-progress', number(phase));
        set(element, '--entry-graphic-x', pixels(centered * 22 * amplitude));
        set(element, '--entry-graphic-y', pixels(centered * -28 * amplitude));
        set(element, '--entry-label-drift', pixels(centered * 13 * amplitude));
        set(element, '--entry-choice-scale', number(1 + (1 - Math.abs(centered)) * .35 * amplitude));
        set(element, '--entry-frame-turn', degrees(centered * 3.5 * amplitude));
        set(element, '--entry-envelope-x', pixels(centered * -12 * amplitude));
        set(element, '--entry-envelope-y', pixels(centered * 33 * amplitude));
        set(element, '--entry-envelope-turn', degrees(centered * -8 * amplitude));
      } else if (kind === 'line') {
        set(element, '--line-progress', number(clamp((currentScroll + viewportHeight * .83 - top) / (viewportHeight * .68))));
      } else if (kind === 'reel') {
        // The video and its controls remain stationary; only a decorative edge breathes.
        set(element, '--reel-edge-width', pixels((1 - Math.abs(centered)) * (compact ? 2 : 4)));
      } else if (kind === 'section') {
        set(element, '--scene-progress', number(phase));
        const travel = phase - .5;
        if (element.id === 'works') {
          set(element, '--works-star-turn', degrees(travel * 160));
          set(element, '--works-star-drift', pixels(travel * -65 * amplitude));
        } else if (element.id === 'research') {
          set(element, '--research-title-drift', pixels(travel * 45 * amplitude));
          set(element, '--research-art-drift', pixels(travel * -75 * amplitude));
          set(element, '--research-art-turn', degrees(travel * 15 * amplitude));
        } else if (element.id === 'studio') {
          set(element, '--studio-arrow-x', pixels(travel * 28 * amplitude));
          set(element, '--studio-arrow-y', pixels(travel * -82 * amplitude));
          set(element, '--studio-arrow-turn', degrees(travel * 38 * amplitude));
          set(element, '--studio-weave-drift', pixels(travel * 35 * amplitude));
          set(element, '--studio-weave-turn', degrees(travel * 9 * amplitude));
          set(element, '--studio-star-turn', degrees(travel * 180));
          set(element, '--studio-star-scale', number(1 + Math.sin(phase * Math.PI) * .15 * amplitude));
        } else if (element.id === 'contact') {
          set(element, '--contact-orbit-x', pixels(travel * -35 * amplitude));
          set(element, '--contact-orbit-y', pixels(travel * -108 * amplitude));
          set(element, '--contact-orbit-turn', degrees(travel * 190));
          set(element, '--contact-orbit-scale', number(1 + Math.sin(phase * Math.PI) * .13 * amplitude));
          set(element, '--contact-word-drift', pixels(travel * 42 * amplitude));
          set(element, '--contact-dot-drift', pixels(Math.sin(phase * Math.PI) * -14 * amplitude));
        }
      }
    });
  }

  function tick(time) {
    frame = 0;
    if (!enabled()) return;
    if (geometryDirty) measure();
    const elapsed = previousTime ? clamp((time - previousTime) / 1000, .001, .034) : 1 / 60;
    previousTime = time;
    targetScroll = scrollY;
    const previousScroll = currentScroll;
    const smoothing = 1 - Math.exp(-elapsed * 17);
    currentScroll += (targetScroll - currentScroll) * smoothing;
    scrollVelocity += ((currentScroll - previousScroll) / elapsed - scrollVelocity) * (1 - Math.exp(-elapsed * 11));
    const unsettled = Math.abs(targetScroll - currentScroll) > .12 || Math.abs(scrollVelocity) > 1.8;
    if (!unsettled) { currentScroll = targetScroll; scrollVelocity = 0; }
    paint();
    if (unsettled) frame = requestAnimationFrame(tick);
    else previousTime = 0;
  }
  function schedule() {
    if (enabled() && !frame) frame = requestAnimationFrame(tick);
  }
  function invalidate() { geometryDirty = true; schedule(); }
  function reset() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    previousTime = 0;
    scrollVelocity = 0;
    currentScroll = targetScroll = scrollY;
    variables.forEach((names, element) => names.forEach((_, name) => element.style.removeProperty(name)));
    variables.clear();
  }
  function sync() {
    reset();
    if (enabled()) { geometryDirty = true; schedule(); }
  }
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', invalidate, { passive: true });
  window.addEventListener('pageshow', sync);
  document.addEventListener('visibilitychange', sync);
  reducedMotion.addEventListener('change', sync);
  smallScreen.addEventListener('change', sync);
  new MutationObserver(sync).observe(document.body, { attributes: true, attributeFilter: ['data-motion'] });
  // Changes in fonts, responsive wrapping and loaded assets only invalidate the cache.
  const resizeObserver = new ResizeObserver(invalidate);
  records.filter(item => item.kind === 'section' || item.kind === 'hero').forEach(item => resizeObserver.observe(item.element));
  main.addEventListener('load', invalidate, { capture: true, passive: true });
  document.fonts?.ready.then(invalidate);
  schedule();
})();
