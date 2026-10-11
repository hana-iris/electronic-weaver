(() => {
  'use strict';
  const section = document.getElementById('research');
  const dialog = document.querySelector('.research-dialog');
  if (!section || !dialog) return;
  const entries = [
    {
      id: 'unchosen-paths', conference: 'CDiGRA 2026', format: 'Abstract',
      title: 'Unchosen Paths: "Chinese-Style" Indie Games as Counterfactual Spaces of Contemporary Chinese Social Experience',
      topic: 'Social pressures, playable possibilities',
      summary: 'Looking across Chinese Parents, Chinese Online Game and Matchmaking Inc., this research asks how familiar pressures become game rules and branching choices. It examines play as a way to try out different lives, revisit past decisions and reflect on the social forces shaping them.',
      logo: 'assets/cdigra-logo.png', logoName: 'Chinese DiGRA', logoWidth: 1200, logoHeight: 177,
      conferenceUrl: 'https://chinesedigra.org/chinese-digra-2026/'
    },
    {
      id: 'far-letter', conference: 'ICIDS 2026', format: 'Late Breaking Work',
      title: 'Far Letter: an AI-Driven Asynchronous Epistolary Narrative Game',
      topic: 'Letters, waiting and emotional connection',
      summary: 'Far Letter explores a quieter way to interact with an AI character: write a letter, step away, and return for a reply. The prototype makes distance and anticipation part of its rhythm. A planned player study will look at writing, story pacing and emotional connection.',
      logo: 'assets/icids-2026-logo.png', logoName: 'ICIDS 2026', logoWidth: 838, logoHeight: 485,
      conferenceUrl: 'https://icids2026.ardin.online/'
    }
  ];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const content = dialog.querySelector('.research-dialog-content');
  let index = 0;
  let opener;
  let entryAnimation;
  let closeFromLocation = false;
  const activeMotion = () => document.body.dataset.motion !== 'off' && !reduced.matches && !document.hidden;
  function cancelAnimation() { entryAnimation?.cancel(); entryAnimation = undefined; }
  function renderEntry(nextIndex, animate = false) {
    cancelAnimation();
    index = nextIndex;
    const entry = entries[index];
    document.getElementById('research-dialog-category').textContent = entry.conference.toUpperCase() + ' / ' + entry.format.toUpperCase();
    document.getElementById('research-dialog-title').textContent = entry.title;
    document.getElementById('research-dialog-conference').textContent = entry.conference;
    document.getElementById('research-dialog-format').textContent = entry.format;
    document.getElementById('research-dialog-topic').textContent = entry.topic;
    document.getElementById('research-dialog-summary').textContent = entry.summary;
    const logo = document.getElementById('research-dialog-logo');
    logo.src = entry.logo; logo.alt = entry.logoName;
    logo.width = entry.logoWidth; logo.height = entry.logoHeight;
    const conferenceLink = document.getElementById('research-dialog-conference-link');
    conferenceLink.href = entry.conferenceUrl;
    conferenceLink.setAttribute('aria-label', entry.conference + ' conference — opens in a new tab');
    conferenceLink.classList.toggle('research-conference-icids', entry.id === 'far-letter');
    document.getElementById('research-dialog-index').textContent = `0${index + 1} / 0${entries.length}`;
    dialog.scrollTop = 0;
    if (animate && activeMotion() && typeof content.animate === 'function') {
      entryAnimation = content.animate([{ opacity: .3, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 280, easing: 'cubic-bezier(.22,1,.36,1)' });
    }
  }
  function setEntryHash(push) {
    const method = push ? 'pushState' : 'replaceState';
    history[method](null, '', '#research/' + entries[index].id);
  }
  function openEntry(nextIndex, sourceButton, updateLocation = true) {
    opener = sourceButton || document.querySelector(`[data-research="${entries[nextIndex].id}"]`);
    renderEntry(nextIndex);
    if (!dialog.open) { dialog.showModal(); document.body.classList.add('is-dialog-open'); }
    if (updateLocation) setEntryHash(true);
  }
  function switchEntry(direction) {
    renderEntry((index + direction + entries.length) % entries.length, true);
    setEntryHash(false);
  }
  document.querySelectorAll('[data-research]').forEach(button => button.addEventListener('click', () => {
    const nextIndex = entries.findIndex(entry => entry.id === button.dataset.research);
    if (nextIndex >= 0) openEntry(nextIndex, button);
  }));
  dialog.querySelector('.research-dialog-close').addEventListener('click', () => dialog.close());
  dialog.querySelector('.research-previous').addEventListener('click', () => switchEntry(-1));
  dialog.querySelector('.research-next').addEventListener('click', () => switchEntry(1));
  dialog.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); switchEntry(event.key === 'ArrowLeft' ? -1 : 1); }
  });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    cancelAnimation();
    if (!document.querySelector('dialog[open]')) document.body.classList.remove('is-dialog-open');
    if (!closeFromLocation && /^#research\//.test(location.hash)) history.replaceState(null, '', '#research');
    closeFromLocation = false;
    opener?.focus({ preventScroll: true });
  });
  function syncLocation() {
    const match = /^#research\/([^/]+)$/.exec(location.hash);
    const nextIndex = match ? entries.findIndex(entry => entry.id === match[1]) : -1;
    if (nextIndex >= 0) {
      if (!dialog.open) {
        section.scrollIntoView({ behavior: 'instant', block: 'start' });
        openEntry(nextIndex, undefined, false);
      } else if (index !== nextIndex) renderEntry(nextIndex, true);
    } else if (dialog.open) {
      closeFromLocation = true;
      dialog.close();
    }
  }
  window.addEventListener('popstate', syncLocation);
  window.addEventListener('hashchange', syncLocation);
  document.addEventListener('visibilitychange', () => { if (document.hidden) cancelAnimation(); });
  reduced.addEventListener('change', () => { if (reduced.matches) cancelAnimation(); });
  new MutationObserver(() => { if (!activeMotion()) cancelAnimation(); }).observe(document.body, { attributes: true, attributeFilter: ['data-motion'] });
  syncLocation();
})();
