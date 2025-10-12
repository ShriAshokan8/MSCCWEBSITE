(function(){
  const root = document.documentElement;
  const nav = document.querySelector('.nav');
  const toggle = document.querySelector('.nav-toggle');
  const themeBtn = document.querySelector('.theme-toggle');

  // Theme persistence
  const saved = localStorage.getItem('pc-theme') || 'light';
  if(saved === 'dark'){ root.removeAttribute('data-theme'); }
  else { root.setAttribute('data-theme', 'light'); }

  themeBtn?.addEventListener('click', () => {
    const isLight = root.getAttribute('data-theme') === 'light';
    if(isLight){ root.removeAttribute('data-theme'); localStorage.setItem('pc-theme','dark'); themeBtn.textContent = '☀️'; }
    else { root.setAttribute('data-theme','light'); localStorage.setItem('pc-theme','light'); themeBtn.textContent = '🌙'; }
  });

  // Mobile nav
  toggle?.addEventListener('click', () => {
    const open = nav.classList.toggle('show');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  // Menu filters
  const pills = document.querySelectorAll('.filters .pill');
  const items = document.querySelectorAll('.menu-item');
  pills.forEach(p => p.addEventListener('click', () => {
    pills.forEach(x => x.classList.remove('active'));
    p.classList.add('active');
    const cat = p.dataset.filter;
    items.forEach(it => {
      it.style.display = (cat === 'all' || it.dataset.cat === cat) ? '' : 'none';
    });
  }));
})();
