(function(){
  const nav = document.querySelector('.nav');
  const toggle = document.querySelector('.nav-toggle');

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
