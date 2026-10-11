(() => {
  'use strict';
  const content = window.SITE_CONTENT;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const motionButton = document.querySelector('.motion-toggle');
  let savedMotion;
  try { savedMotion = localStorage.getItem('weaver-motion'); } catch {}
  let motion = savedMotion ? savedMotion === 'on' : !reduceMotion.matches;
  function createTitleCycle(heading, lines, titles) {
    let timer;
    let currentTitle = 0;
    let inView = false;
    const active = () => motion && !reduceMotion.matches && !document.hidden && inView;
    const render = text => lines.forEach((line, index) => { line.textContent = text[index] || ''; });
    function reset() {
      clearTimeout(timer);
      currentTitle = 0;
      render(titles[0]);
      if (active()) timer = setTimeout(cycle, 6500);
    }
    function cycle() {
      if (!active()) return;
      const oldText = lines.map(line => line.textContent).join('|');
      currentTitle = (currentTitle + 1) % titles.length;
      const nextText = titles[currentTitle].join('|');
      let count = oldText.length;
      function erase() {
        if (!active()) return;
        if (count > 0) {
          count -= 1;
          render(oldText.slice(0, count).split('|'));
          timer = setTimeout(erase, 35);
        } else {
          let typed = 0;
          function type() {
            if (!active()) return;
            typed += 1;
            render(nextText.slice(0, typed).split('|'));
            timer = setTimeout(typed < nextText.length ? type : cycle, typed < nextText.length ? 70 : 6500);
          }
          timer = setTimeout(type, 170);
        }
      }
      erase();
    }
    const observer = new IntersectionObserver(entries => {
      const visible = entries[0].isIntersecting;
      if (visible !== inView) { inView = visible; reset(); }
    }, { threshold: 0.15 });
    observer.observe(heading);
    return { reset };
  }
  const titleCycles = [
    createTitleCycle(document.getElementById('hero-title'),
      [document.getElementById('title-line-one'), document.getElementById('title-line-two')],
      [['ELECTRONIC', 'WEAVER.'], ['STORIES', 'IN PLAY.']]),
    createTitleCycle(document.getElementById('studio-title'),
      [...document.querySelectorAll('#studio-title .studio-title-copy')],
      [['ONE', 'WEAVER.', 'MANY', 'WORLDS.']])
  ];
  function updateMotion() {
    document.body.dataset.motion = motion ? 'on' : 'off';
    motionButton.setAttribute('aria-pressed', String(!motion));
    motionButton.setAttribute('aria-label', motion ? 'Pause animations' : 'Resume animations');
    motionButton.querySelector('.motion-icon').textContent = motion ? 'Ⅱ' : '▷';
    motionButton.querySelector('.motion-text').textContent = motion ? 'MOTION ON' : 'MOTION OFF';
    titleCycles.forEach(title => title.reset());
  }
  motionButton.addEventListener('click', () => {
    motion = !motion;
    savedMotion = motion ? 'on' : 'off';
    try { localStorage.setItem('weaver-motion', savedMotion); } catch {}
    updateMotion();
  });
  reduceMotion.addEventListener('change', event => { if (!savedMotion) motion = !event.matches; updateMotion(); });
  document.addEventListener('visibilitychange', () => {
    document.body.style.setProperty('--background-state', document.hidden ? 'paused' : 'running');
    updateMotion();
  });
  updateMotion();

  const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('visible'); revealObserver.unobserve(entry.target); }
  }), { threshold: 0.08 });
  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
  document.body.classList.add('js-ready');

  const sections = [...document.querySelectorAll('main>section')];
  const navLinks = [...document.querySelectorAll('[data-section]')];
  const navObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) navLinks.forEach(link => {
        const active = link.dataset.section === entry.target.id;
        link.classList.toggle('current', active);
        if (active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-35% 0px -55% 0px', threshold: 0 });
  sections.forEach(section => navObserver.observe(section));

  const dialog = document.querySelector('.project-dialog');
  let openIndex = 0;
  let returnFocus;
  function renderProject(index) {
    openIndex = index;
    const project = content.projects[index];
    document.getElementById('dialog-title').textContent = project.title;
    document.getElementById('dialog-category').textContent = project.category;
    const img = document.getElementById('dialog-image'); img.src = project.image; img.alt = project.title + ' gameplay screenshot';
    const description = document.getElementById('dialog-description');
    description.replaceChildren(...project.paragraphs.map(text => { const p = document.createElement('p'); p.textContent = text; return p; }));
    document.getElementById('dialog-credit').textContent = project.credit;
    document.getElementById('dialog-index').textContent = '0' + (index + 1) + ' / 0' + content.projects.length;
    dialog.scrollTop = 0;
  }
  document.querySelectorAll('[data-project]').forEach(button => button.addEventListener('click', () => {
    returnFocus = button;
    renderProject(content.projects.findIndex(project => project.id === button.dataset.project));
    dialog.showModal(); document.body.classList.add('is-dialog-open');
  }));
  document.querySelector('.next-project').addEventListener('click', () => renderProject((openIndex + 1) % content.projects.length));
  document.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); } });
  dialog.addEventListener('close', () => { document.body.classList.remove('is-dialog-open'); returnFocus?.focus({ preventScroll: true }); });

  let toastTimer;
  function toast(message) { const el = document.querySelector('.toast'); el.textContent = message; el.classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('visible'), 3500); }
  const socialContainer = document.getElementById('social-links');
  content.social.forEach(social => {
    const el = document.createElement(social.url ? 'a' : 'button');
    el.className = 'social-item';
    if (social.url) { el.href = social.url; el.target = '_blank'; el.rel = 'noopener noreferrer'; el.setAttribute('aria-label', social.name + ' — opens in a new tab'); }
    else { el.type = 'button'; el.addEventListener('click', () => toast(social.name + ' link is coming soon.')); }
    const icon = document.createElement('span'); icon.className = 'social-monogram'; icon.textContent = social.short;
    const label = document.createElement('span'); label.textContent = social.name;
    const arrow = document.createElement(social.url ? 'span' : 'small'); arrow.textContent = social.url ? '↗' : '链接待补充';
    el.append(icon, label, arrow); socialContainer.append(el);
  });

  const cursor = document.querySelector('.cursor');
  const heroArt = document.querySelector('.hero-art');
  const finePointer = matchMedia('(pointer:fine)');
  if (finePointer.matches) {
    document.addEventListener('pointermove', event => {
      if (reduceMotion.matches) return;
      cursor.style.opacity = '1'; cursor.style.transform = `translate(${event.clientX - cursor.offsetWidth / 2}px,${event.clientY - cursor.offsetHeight / 2}px)`;
      if (motion && scrollY < innerHeight) {
        heroArt.style.setProperty('--px', ((event.clientX / innerWidth - .5) * 25) + 'px');
        heroArt.style.setProperty('--py', ((event.clientY / innerHeight - .5) * 18) + 'px');
      }
      cursor.classList.toggle('active', !!event.target.closest('a,button'));
    });
    document.addEventListener('pointerleave', () => { cursor.style.opacity = '0'; });
  }
  const canvas = document.getElementById('wave-canvas');
  const ctx = canvas.getContext('2d');
  let canvasWidth = 0, canvasHeight = 0, heroVisible = true, frameTime = 0;
  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect(); canvasWidth = rect.width; canvasHeight = rect.height;
    const dpr = Math.min(devicePixelRatio || 1, 1.5); canvas.width = canvasWidth * dpr; canvas.height = canvasHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  new ResizeObserver(resizeCanvas).observe(canvas);
  new IntersectionObserver(entries => { heroVisible = entries[0].isIntersecting; }).observe(document.querySelector('.hero'));
  function drawWave(time) {
    requestAnimationFrame(drawWave);
    if (!heroVisible || document.hidden || !motion || time - frameTime < 60) return;
    frameTime = time;
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.lineWidth = .7; ctx.strokeStyle = '#a0a0a0';
    for (let row = 0; row < 9; row++) {
      ctx.beginPath();
      for (let x = canvasWidth * .38; x <= canvasWidth; x += 10) {
        const y = canvasHeight * .24 + row * 17 + Math.sin(x / 155 + time / 11000 + row * .17) * 50;
        if (x === canvasWidth * .38) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }
  if (ctx) { resizeCanvas(); requestAnimationFrame(drawWave); }
})();
