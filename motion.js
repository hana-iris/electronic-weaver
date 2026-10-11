(() => {
  'use strict';
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const desktopPointer = matchMedia('(min-width: 651px) and (hover: hover) and (pointer: fine)');
  const sections = [...document.querySelectorAll('#works, #studio, #contact')];
  const animations = new Set();
  const pointerJobs = new Map();
  let pointerFrame = 0;
  const canAnimate = () => document.body.dataset.motion !== 'off' && !reducedMotion.matches && !document.hidden;

  function decoration(className, markup, parent) {
    if (!parent) return null;
    const element = document.createElement('div');
    element.className = className;
    element.setAttribute('aria-hidden', 'true');
    if (markup) element.innerHTML = markup;
    parent.append(element);
    return element;
  }

  decoration('works-motion-trace motion-decoration',
    '<svg viewBox="0 0 182 18" fill="none"><path d="M0 9H182" stroke="currentColor" stroke-width=".6"/><circle class="trace-dot" cx="4" cy="9" r="2.2" fill="currentColor"/><circle class="trace-dot" cx="4" cy="9" r="1.5" fill="currentColor"/><circle class="trace-dot" cx="4" cy="9" r="1" fill="currentColor"/></svg>',
    document.querySelector('.works .section-heading'));

  const strandPaths = Array.from({ length: 6 }, (_, index) => {
    const y = 28 + index * 13;
    return `M2 ${y} C110 ${y - 36},160 ${y + 42},230 ${y} S365 ${y - 30},438 ${y + 4}`;
  });
  decoration('studio-weave motion-decoration',
    '<svg viewBox="0 0 440 130" fill="none">' +
    strandPaths.map(path => `<path class="weave-strand" d="${path}"/>`).join('') +
    `<path class="weave-shuttle" pathLength="100" d="${strandPaths[2]}"/><path class="weave-shuttle" pathLength="100" d="${strandPaths[4]}"/></svg>`,
    document.querySelector('.studio-heading'));

  document.querySelectorAll('.asterisk, .contact-orbit').forEach(element => element.classList.add('motion-decoration'));
  document.querySelectorAll('.showreel-heading, .studio-logo-display').forEach(element => element.classList.add('motion-intro'));
  const reelSweep = decoration('showreel-sweep', '', document.querySelector('.showreel-player'));

  const visibleObserver = new IntersectionObserver(entries => {
    for (const entry of entries) {
      const element = entry.target;
      element.classList.toggle('motion-decoration-visible', entry.isIntersecting);
      if (entry.isIntersecting) element.classList.add('motion-arrived');
      if (element.classList.contains('showreel-player') && entry.isIntersecting && reelSweep) reelSweep.classList.add('motion-arrived');
      if (!entry.isIntersecting && sections.includes(element)) resetPointers(element);
    }
  }, { threshold: .04 });
  document.querySelectorAll('.motion-decoration, .motion-intro, .studio-heading, .showreel-player').forEach(element => visibleObserver.observe(element));
  sections.forEach(section => visibleObserver.observe(section));

  const pointerElements = [];
  function resetPointer(element) {
    pointerJobs.delete(element);
    element.classList.remove('motion-pointer-active');
    for (const variable of ['--tilt-x', '--tilt-y', '--shine-x', '--shine-y', '--magnet-x', '--magnet-y']) element.style.removeProperty(variable);
  }
  function resetPointers(scope) {
    pointerElements.forEach(element => { if (!scope || scope.contains(element)) resetPointer(element); });
    if (!pointerJobs.size && pointerFrame) { cancelAnimationFrame(pointerFrame); pointerFrame = 0; }
  }
  function flushPointers() {
    pointerFrame = 0;
    if (!canAnimate() || !desktopPointer.matches) { resetPointers(); return; }
    pointerJobs.forEach(({ x, y, type }, element) => {
      if (type === 'card') {
        element.style.setProperty('--tilt-x', `${(-y * 2.4).toFixed(2)}deg`);
        element.style.setProperty('--tilt-y', `${(x * 3).toFixed(2)}deg`);
        element.style.setProperty('--shine-x', `${((x + .5) * 100).toFixed(1)}%`);
        element.style.setProperty('--shine-y', `${((y + .5) * 100).toFixed(1)}%`);
      } else {
        element.style.setProperty('--magnet-x', `${(x * 9).toFixed(2)}px`);
        element.style.setProperty('--magnet-y', `${(y * 7).toFixed(2)}px`);
      }
    });
    pointerJobs.clear();
  }
  function attachPointer(element, type) {
    pointerElements.push(element);
    element.classList.add(type === 'card' ? 'motion-card' : 'motion-magnetic');
    if (type === 'card') decoration('project-sheen', '', element);
    let bounds;
    element.addEventListener('pointerenter', event => {
      if (event.pointerType === 'touch' || !canAnimate() || !desktopPointer.matches) return;
      bounds = element.getBoundingClientRect();
      element.classList.add('motion-pointer-active');
    });
    element.addEventListener('pointermove', event => {
      if (event.pointerType === 'touch' || !canAnimate() || !desktopPointer.matches || !bounds) return;
      const x = Math.max(-.5, Math.min(.5, (event.clientX - bounds.left) / bounds.width - .5));
      const y = Math.max(-.5, Math.min(.5, (event.clientY - bounds.top) / bounds.height - .5));
      pointerJobs.set(element, { x, y, type });
      if (!pointerFrame) pointerFrame = requestAnimationFrame(flushPointers);
    });
    const leave = () => { bounds = null; resetPointer(element); };
    element.addEventListener('pointerleave', leave);
    element.addEventListener('pointercancel', leave);
    element.addEventListener('blur', leave);
  }
  document.querySelectorAll('.project-visual').forEach(element => attachPointer(element, 'card'));
  document.querySelectorAll('.social-item').forEach(element => attachPointer(element, 'social'));

  const dialog = document.querySelector('.project-dialog');
  const dialogTitle = document.getElementById('dialog-title');
  if (dialog && dialogTitle) {
    dialog.classList.add('motion-dialog');
    let seenOpen = dialog.open;
    let previousTitle = dialogTitle.textContent;
    new MutationObserver(() => { seenOpen = dialog.open; }).observe(dialog, { attributes: true, attributeFilter: ['open'] });
    new MutationObserver(() => {
      const currentTitle = dialogTitle.textContent;
      const isSwitch = seenOpen && dialog.open && currentTitle !== previousTitle;
      previousTitle = currentTitle;
      if (!isSwitch || !canAnimate()) return;
      animations.forEach(animation => animation.cancel());
      const animation = dialog.querySelector('.dialog-content').animate(
        [{ opacity: .35, transform: 'translateY(12px)' }, { opacity: 1, transform: 'translateY(0)' }],
        { duration: 430, easing: 'cubic-bezier(.22,1,.36,1)' }
      );
      animations.add(animation);
      const clear = () => animations.delete(animation);
      animation.addEventListener('finish', clear, { once: true });
      animation.addEventListener('cancel', clear, { once: true });
    }).observe(dialogTitle, { childList: true, characterData: true, subtree: true });
    dialog.addEventListener('close', () => animations.forEach(animation => animation.cancel()));
  }

  function syncMotion() {
    document.body.classList.toggle('motion-page-hidden', document.hidden);
    if (!canAnimate()) {
      resetPointers();
      if (document.hidden) animations.forEach(animation => animation.pause());
      else animations.forEach(animation => animation.cancel());
    } else animations.forEach(animation => { if (animation.playState === 'paused') animation.play(); });
  }
  new MutationObserver(syncMotion).observe(document.body, { attributes: true, attributeFilter: ['data-motion'] });
  reducedMotion.addEventListener('change', syncMotion);
  desktopPointer.addEventListener('change', () => resetPointers());
  document.addEventListener('visibilitychange', syncMotion);
  window.addEventListener('resize', () => resetPointers(), { passive: true });
  syncMotion();
})();
