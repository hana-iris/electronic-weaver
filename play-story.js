(() => {
  'use strict';
  const word = document.querySelector('#works-title > em');
  if (!word || word.textContent.trim() !== 'PLAY.') return;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const accessible = document.createElement('span');
  accessible.className = 'play-story-accessible';
  accessible.textContent = word.textContent;
  const letters = document.createElement('span');
  letters.className = 'play-story-letters';
  letters.setAttribute('aria-hidden', 'true');
  [...word.textContent.trim()].forEach((character, index) => {
    const letter = document.createElement('span');
    letter.className = 'play-story-letter';
    letter.textContent = character;
    letter.style.setProperty('--letter-index', index);
    letters.append(letter);
  });
  const route = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  route.classList.add('play-story-route');
  route.setAttribute('viewBox', '0 0 320 40');
  route.setAttribute('preserveAspectRatio', 'none');
  route.setAttribute('aria-hidden', 'true');
  route.setAttribute('focusable', 'false');
  route.innerHTML = '<path class="play-story-route-line" d="M8 29H92L146 0H188L236 29H312"/>' +
    '<path class="play-story-route-branch" d="M92 29H184L209 11H250M236 29L252 39H283"/>' +
    '<circle class="play-story-route-node" cx="92" cy="29" r="2.8"/>' +
    '<circle class="play-story-route-node" cx="188" cy="0" r="2.8"/>' +
    '<circle class="play-story-route-node" cx="312" cy="29" r="2.8"/>' +
    '<circle class="play-story-route-point" cx="8" cy="29" r="4.4"/>';
  word.replaceChildren(accessible, letters, route);
  word.classList.add('play-story-word');
  let inView = false;
  const canAnimate = () => inView && !document.hidden && !reducedMotion.matches && document.body.dataset.motion !== 'off';
  function stop() { word.classList.remove('play-story-running'); }
  function play() {
    stop();
    if (!canAnimate()) return;
    // A single layout read restarts the finite CSS sequence; no animation loop runs in JS.
    void word.offsetWidth;
    word.classList.add('play-story-running');
  }
  new IntersectionObserver(entries => {
    const visible = entries[0].isIntersecting;
    if (visible === inView) return;
    inView = visible;
    if (inView) play(); else stop();
  }, { threshold: .35 }).observe(word);
  word.addEventListener('pointerenter', event => { if (event.pointerType !== 'touch') play(); });
  new MutationObserver(() => { if (canAnimate()) play(); else stop(); })
    .observe(document.body, { attributes: true, attributeFilter: ['data-motion'] });
  reducedMotion.addEventListener('change', () => { if (canAnimate()) play(); else stop(); });
  document.addEventListener('visibilitychange', () => { if (canAnimate()) play(); else stop(); });
})();
