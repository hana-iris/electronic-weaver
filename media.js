(() => {
  'use strict';
  const video = document.getElementById('studio-showreel');
  const player = document.querySelector('.showreel-player');
  const playButton = document.querySelector('.showreel-play');
  if (!video || !player || !playButton) return;
  let requestedPlay = false;
  function notify(message) {
    const el = document.querySelector('.toast');
    el.textContent = message; el.classList.add('visible');
    setTimeout(() => el.classList.remove('visible'), 4000);
  }
  playButton.addEventListener('click', async () => {
    requestedPlay = true;
    playButton.setAttribute('aria-busy', 'true');
    try {
      await video.play();
      player.classList.add('started');
      playButton.setAttribute('aria-busy', 'false');
      video.focus({ preventScroll: true });
    } catch {
      requestedPlay = false;
      player.classList.remove('started');
      playButton.setAttribute('aria-busy', 'false');
      notify('Playback could not start. Please try the video controls.');
    }
  });
  video.addEventListener('play', () => player.classList.add('started'));
  video.addEventListener('ended', () => { requestedPlay = false; player.classList.remove('started'); });
  video.addEventListener('error', () => {
    if (requestedPlay) notify('The showreel could not load. Please try again.');
    playButton.setAttribute('aria-busy', 'false');
  });
  // Pause a playing reel after leaving its section, without restarting it automatically.
  new IntersectionObserver(entries => {
    if (!entries[0].isIntersecting && !video.paused) video.pause();
  }, { threshold: 0.04 }).observe(video);
  document.addEventListener('visibilitychange', () => { if (document.hidden && !video.paused) video.pause(); });
})();
