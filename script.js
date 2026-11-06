document.addEventListener('DOMContentLoaded', () => {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // 1. Menu mobile
  const header = document.querySelector('.nav');
  const menuBtn = document.getElementById('mobileMenuBtn');
  const menu = document.getElementById('mainNav');
  const navLinks = document.querySelectorAll('.nav-link');

  const setMenu = (open) => {
    menu.classList.toggle('open', open);
    root.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  };

  if (menuBtn && menu) {
    menuBtn.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
    menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menu.classList.contains('open')) {
        setMenu(false);
        menuBtn.focus();
      }
    });
    window.matchMedia('(min-width: 1069px)').addEventListener('change', (e) => {
      if (e.matches) setMenu(false);
    });
  }

  // 2. Cabeçalho: borda só quando há conteúdo rolando por baixo + link ativo
  const sections = document.querySelectorAll('section[id]');
  let ticking = false;

  const onScroll = () => {
    const y = window.scrollY;
    header?.classList.toggle('is-scrolled', y > 4);

    const probe = y + 140;
    let current = '';
    sections.forEach((sec) => {
      if (probe >= sec.offsetTop && probe < sec.offsetTop + sec.offsetHeight) current = sec.id;
    });
    navLinks.forEach((link) => {
      link.classList.toggle('active', current !== '' && link.getAttribute('href') === `#${current}`);
    });
    ticking = false;
  };

  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(onScroll);
      }
    },
    { passive: true }
  );
  onScroll();

  // 3. Revelação ao rolar — itens que entram juntos aparecem em cascata curta
  const revealEls = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        const entering = entries.filter((e) => e.isIntersecting);
        entering.forEach((entry, i) => {
          entry.target.style.setProperty('--reveal-delay', `${Math.min(i, 4) * 80}ms`);
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );
    revealEls.forEach((el) => observer.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('revealed'));
  }

  // 4. Galeria de condomínios — scroll nativo (momentum e snap do sistema) + botões
  const track = document.getElementById('condoGallery');
  const prevBtn = document.querySelector('[data-gallery-prev]');
  const nextBtn = document.querySelector('[data-gallery-next]');

  if (track && prevBtn && nextBtn) {
    const step = () => {
      const card = track.querySelector('.condo');
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      return card ? card.getBoundingClientRect().width + gap : track.clientWidth * 0.8;
    };

    const updateButtons = () => {
      const max = track.scrollWidth - track.clientWidth - 2;
      prevBtn.disabled = track.scrollLeft <= 2;
      nextBtn.disabled = track.scrollLeft >= max;
    };

    const go = (dir) => {
      track.scrollBy({ left: dir * step(), behavior: reduceMotion.matches ? 'auto' : 'smooth' });
    };

    prevBtn.addEventListener('click', () => go(-1));
    nextBtn.addEventListener('click', () => go(1));
    track.addEventListener('scroll', () => requestAnimationFrame(updateButtons), { passive: true });
    track.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
    });
    window.addEventListener('resize', updateButtons);
    updateButtons();
  }

  // 5. Formulário → WhatsApp, com validação inline
  const form = document.getElementById('contactForm');

  const setError = (input, message) => {
    const field = input.closest('.field');
    if (!field) return;
    let msg = field.querySelector('.field-error');
    if (message) {
      field.classList.add('is-invalid');
      input.setAttribute('aria-invalid', 'true');
      if (!msg) {
        msg = document.createElement('p');
        msg.className = 'field-error';
        msg.id = `${input.id}-erro`;
        field.appendChild(msg);
        input.setAttribute('aria-describedby', msg.id);
      }
      msg.textContent = message;
    } else {
      field.classList.remove('is-invalid');
      input.removeAttribute('aria-invalid');
      msg?.remove();
      input.removeAttribute('aria-describedby');
    }
  };

  const messages = {
    nomeContato: 'Informe seu nome.',
    nomeCondominio: 'Informe o nome do condomínio.',
  };

  if (form) {
    const required = form.querySelectorAll('[required]');

    required.forEach((input) => {
      input.addEventListener('blur', () => {
        if (input.value.trim() === '' && input.dataset.touched) setError(input, messages[input.id]);
      });
      input.addEventListener('input', () => {
        input.dataset.touched = '1';
        if (input.value.trim() !== '') setError(input, '');
      });
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      let firstInvalid = null;
      required.forEach((input) => {
        input.dataset.touched = '1';
        const empty = input.value.trim() === '';
        setError(input, empty ? messages[input.id] : '');
        if (empty && !firstInvalid) firstInvalid = input;
      });
      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }

      const nome = document.getElementById('nomeContato').value.trim();
      const condominio = document.getElementById('nomeCondominio').value.trim();
      const unidades = document.getElementById('qtdUnidades')?.value.trim() || '';
      const mensagem = document.getElementById('mensagemContato')?.value.trim() || '';

      let texto = `Olá Roberta! Meu nome é *${nome}*.\n`;
      texto += `Entro em contato referente ao *${condominio}*`;
      if (unidades) texto += ` (${unidades} unidades)`;
      texto += '.\n';
      if (mensagem) texto += `\n*Demandas / Observações:*\n${mensagem}\n`;
      texto += '\nGostaria de conversar sobre a gestão do condomínio.';

      window.open(`https://wa.me/5511966730714?text=${encodeURIComponent(texto)}`, '_blank', 'noopener,noreferrer');
    });
  }

  // 6. Ano atual no rodapé
  const yearEl = document.getElementById('currentYear');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
});
