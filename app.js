// Número de WhatsApp de ventas, con lada de país y sin signos.
const WA_NUMBER = '523781024593';   // 378 102 4593 (52 = México)

// Precio por bolsa según cantidad (de mayor a menor).
const TIERS = [[50, 50], [20, 60], [5, 65], [1, 70]];
const unitPrice = n => TIERS.find(([min]) => n >= min)[1];
const money = n => '$' + n.toLocaleString('es-MX');
const $ = s => document.querySelector(s);

console.assert(unitPrice(1) === 70 && unitPrice(4) === 70 && unitPrice(5) === 65 &&
  unitPrice(19) === 65 && unitPrice(20) === 60 && unitPrice(49) === 60 && unitPrice(50) === 50, 'precios por volumen');

const waLink = text => WA_NUMBER ? `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}` : null;
const goWa = (e, text) => {
  const url = waLink(text);
  e.preventDefault();
  if (url) window.open(url, '_blank', 'noopener');
  else alert('Todavía no está configurado el número de WhatsApp.');
};

// Selector de cantidad
const qty = $('[data-qty]');
const clamp = v => Math.min(999, Math.max(1, parseInt(v, 10) || 1));
function renderQty() {
  const n = clamp(qty.value), u = unitPrice(n);
  $('[data-unit]').textContent = money(u) + ' c/u';
  $('[data-total]').textContent = money(u * n);
  const tier = TIERS.find(([min]) => n >= min)[0];
  document.querySelectorAll('[data-tier]').forEach(r => r.classList.toggle('is-on', +r.dataset.tier === tier));
}
document.querySelectorAll('[data-step]').forEach(b => b.addEventListener('click', () => {
  qty.value = clamp(clamp(qty.value) + +b.dataset.step); renderQty();
}));
qty.addEventListener('input', renderQty);
qty.addEventListener('blur', () => { qty.value = clamp(qty.value); renderQty(); });

// Pedido: bolsas por sabor. El precio por bolsa depende del total (se pueden combinar sabores).
const SABORES = { natural: 'Natural', botana: 'Botana' };
let order = { natural: 0, botana: 0 };
try { const o = JSON.parse(localStorage.getItem('tc-pedido')); for (const k in SABORES) order[k] = Math.min(999, Math.max(0, parseInt(o?.[k], 10) || 0)); } catch {}
const totalBags = () => order.natural + order.botana;
console.assert(totalBags() >= 0, 'pedido válido');
const cart = $('[data-cart]');
function renderCart() {
  try { localStorage.setItem('tc-pedido', JSON.stringify(order)); } catch {}
  const bags = totalBags(), u = bags ? unitPrice(bags) : 0, btn = $('[data-checkout]');
  $('[data-cart-count]').textContent = bags;
  $('[data-cart-body]').innerHTML = bags
    ? Object.keys(SABORES).filter(k => order[k]).map(k =>
        `<div class="cart__row"><span>${SABORES[k]} 40 g × ${order[k]}</span><button type="button" class="cart__rm" data-rm="${k}" aria-label="Quitar ${SABORES[k]}">Quitar</button></div>`).join('') +
      `<div class="cart__row"><span>${bags} bolsa${bags > 1 ? 's' : ''}</span><span>${money(u)} c/u</span></div>
       <div class="cart__row cart__row--total"><span>Total</span><span>${money(u * bags)}</span></div>`
    : '<p>Tu pedido está vacío. Agrega bolsas desde la sección de producto.</p>';
  btn.setAttribute('aria-disabled', String(!bags));
  document.querySelectorAll('[data-rm]').forEach(b => b.addEventListener('click', () => { order[b.dataset.rm] = 0; renderCart(); }));
}
const openCart = open => { cart.hidden = !open; if (open) cart.querySelector('header button').focus(); };
const sabor = () => document.querySelector('input[name=sabor]:checked').value;
$('[data-add]').addEventListener('click', () => { const k = sabor(); order[k] = Math.min(999, order[k] + clamp(qty.value)); renderCart(); openCart(true); });
document.querySelectorAll('[data-pick]').forEach(b => b.addEventListener('click', () => {
  document.querySelector(`input[name=sabor][value=${b.dataset.pick}]`).checked = true;
  $('#producto').scrollIntoView();
}));
$('[data-open-cart]').addEventListener('click', () => openCart(true));
document.querySelectorAll('[data-close-cart]').forEach(b => b.addEventListener('click', () => openCart(false)));
document.addEventListener('keydown', e => { if (e.key === 'Escape') openCart(false); });
$('[data-checkout]').addEventListener('click', e => {
  const bags = totalBags();
  if (!bags) return e.preventDefault();
  const u = unitPrice(bags);
  const detalle = Object.keys(SABORES).filter(k => order[k]).map(k => `${order[k]} ${SABORES[k].toLowerCase()}`).join(' y ');
  goWa(e, `Hola, quiero pedir ${bags} bolsa${bags > 1 ? 's' : ''} de cecina Toro Chingón de 40 g: ${detalle} (${money(u)} c/u). Total: ${money(u * bags)}.`);
});
document.querySelectorAll('[data-wa]').forEach(a => a.addEventListener('click', e => goWa(e, a.dataset.wa)));

// Menú móvil
const burger = $('[data-burger]'), links = $('.nav__links');
burger.addEventListener('click', () => burger.setAttribute('aria-expanded', links.classList.toggle('is-open')));
links.addEventListener('click', () => { links.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false'); });

$('[data-year]').textContent = new Date().getFullYear();
renderQty(); renderCart();

// ===== Animación y 3D (solo si el usuario no pidió reducir movimiento) =====
if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.documentElement.classList.add('js');
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('[data-rv]').forEach(el => io.observe(el));

  // Hero: el cursor mueve las capas
  const hero = $('.hero');
  hero.addEventListener('pointermove', e => {
    const r = hero.getBoundingClientRect();
    hero.style.setProperty('--mx', ((e.clientX - r.left) / r.width - .5) * 2);
    hero.style.setProperty('--my', ((e.clientY - r.top) / r.height - .5) * 2);
  });

  // Tarjetas 3D (bolsa del inicio y foto del producto)
  document.querySelectorAll('[data-tilt]').forEach(tilt => {
    tilt.addEventListener('pointermove', e => {
      const r = tilt.getBoundingClientRect();
      tilt.style.setProperty('--tx', ((e.clientX - r.left) / r.width - .5) * 2);
      tilt.style.setProperty('--ty', ((e.clientY - r.top) / r.height - .5) * 2);
    });
    tilt.addEventListener('pointerleave', () => { tilt.style.setProperty('--tx', 0); tilt.style.setProperty('--ty', 0); });
  });

  // Parallax al hacer scroll (--p va de -1 a 1 según la posición en pantalla)
  const px = [...document.querySelectorAll('[data-px]')];
  let tick = false;
  const onScroll = () => {
    hero.style.setProperty('--sy', scrollY);
    px.forEach(el => { const r = el.getBoundingClientRect(); el.style.setProperty('--p', Math.max(-1, Math.min(1, (r.top + r.height / 2) / innerHeight - .5))); });
    tick = false;
  };
  addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  // Proceso como película: el avance del scroll (0 a 1) elige la toma y su zoom
  const seq = $('[data-seq]'), scenes = [...seq.querySelectorAll('.scene')];
  const onSeq = () => {
    const r = seq.getBoundingClientRect();
    const t = Math.max(0, Math.min(1, -r.top / (r.height - innerHeight)));
    seq.style.setProperty('--t', t);
    const pos = Math.max(0, (t - .1) / .9) * scenes.length;   // el primer 10% es el título
    scenes.forEach((sc, i) => { sc.classList.toggle('on', t > .04 && Math.min(scenes.length - 1, Math.floor(pos)) === i); sc.style.setProperty('--k', Math.max(0, Math.min(1, pos - i))); });
  };
  addEventListener('scroll', () => requestAnimationFrame(onSeq), { passive: true });
  onSeq();

  // Inicio interactivo: cerrada (orbitan) → abriendo (sale la cecina) → abierta (escena 4K)
  hero.dataset.estado = 'cerrada';
  $('[data-abrir]').addEventListener('click', () => {
    hero.dataset.estado = 'abriendo';
    setTimeout(() => { hero.dataset.estado = 'abierta'; }, 3300);
  });
  $('[data-cerrar]').addEventListener('click', () => { hero.dataset.estado = 'cerrada'; });

  // Polvo que cruza las tomas del toro y del rancho
  document.querySelectorAll('[data-polvo]').forEach(el => {
    el.innerHTML = Array.from({ length: +el.dataset.polvo }, () => {
      const r = Math.random;
      return `<i style="--y:${(30 + r() * 68).toFixed(1)}%;--s:${(2 + r() * 5).toFixed(1)}px;--d:${(4 + r() * 8).toFixed(1)}s;--w:${(-r() * 12).toFixed(1)}s;--dy:${(r() * 80 - 60).toFixed(0)}px;--o:${(.25 + r() * .55).toFixed(2)}"></i>`;
    }).join('');
  });

  // Revólver: dispara al entrar a la vista, cada pocos segundos mientras se ve, y al tocarlo o pasar por un contacto
  const contacto = $('.contacto'), arma = $('[data-arma]');
  let visto = false, ultimo = 0;
  const dispara = () => {
    if (performance.now() - ultimo < 900) return;
    ultimo = performance.now();
    contacto.classList.remove('dispara'); void contacto.offsetWidth; contacto.classList.add('dispara');
  };
  new IntersectionObserver(es => { visto = es[0].isIntersecting; if (visto) setTimeout(dispara, 500); }, { threshold: .45 }).observe(contacto);
  setInterval(() => { if (visto && !document.hidden) dispara(); }, 4200);
  arma.addEventListener('click', dispara);
  contacto.querySelectorAll('.channels a').forEach(a2 => a2.addEventListener('pointerenter', dispara));

  // Brasas
  $('[data-brasas]').innerHTML = Array.from({ length: 22 }, () => {
    const r = Math.random;
    return `<i style="--x:${(r() * 100).toFixed(1)}%;--s:${(2 + r() * 4).toFixed(1)}px;--d:${(7 + r() * 9).toFixed(1)}s;--w:${(-r() * 14).toFixed(1)}s;--dx:${(r() * 160 - 80).toFixed(0)}px"></i>`;
  }).join('');

  // Latido del contador al agregar
  $('[data-add]').addEventListener('click', () => { const b = $('[data-cart-count]'); b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); });
}
