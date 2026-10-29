const pages = [...document.querySelectorAll('main > section')];
const main = document.querySelector('main');
main.classList.add('book-stage');
pages.forEach((page, index) => {
  page.classList.add('book-page');
  page.setAttribute('aria-hidden', 'true');
  page.dataset.page = index;
});

const bookControls = document.createElement('div');
bookControls.className = 'book-controls';
bookControls.innerHTML = `
  <button class="page-button" id="previous-page" type="button" aria-label="Página anterior">← <span>anterior</span></button>
  <div class="page-progress"><div class="page-dots" aria-label="Escolher página"></div><span class="page-count" aria-live="polite"></span></div>
  <button class="page-button" id="next-page" type="button" aria-label="Próxima página"><span>próxima</span> →</button>`;
main.after(bookControls);

const pageCount = bookControls.querySelector('.page-count');
const dots = bookControls.querySelector('.page-dots');
let currentPage = -1;

pages.forEach((page, index) => {
  const marker = document.createElement('span');
  marker.className = 'page-number';
  marker.textContent = `${String(index + 1).padStart(2, '0')}  /  ${String(pages.length).padStart(2, '0')}`;
  page.append(marker);
  const dot = document.createElement('button');
  dot.type = 'button';
  dot.className = 'page-dot';
  dot.setAttribute('aria-label', `Ir para a página ${index + 1}`);
  dot.addEventListener('click', () => showPage(index));
  dots.append(dot);
});

function showPage(index, direction = 'forward') {
  if (main.querySelector('.flip-sheet')) return;
  const nextPage = Math.max(0, Math.min(pages.length - 1, index));
  if (nextPage === currentPage) return;
  const previousPage = currentPage;

  if (previousPage >= 0) {
    const sourcePage = pages[previousPage];
    const sheet = document.createElement('div');
    sheet.className = `flip-sheet ${direction === 'back' ? 'flip-backward' : 'flip-forward'}`;
    sheet.setAttribute('aria-hidden', 'true');
    sheet.inert = true;

    const front = document.createElement('div');
    front.className = 'flip-front';
    const snapshot = sourcePage.cloneNode(true);
    snapshot.classList.remove('is-active');
    snapshot.classList.add('flip-content');
    snapshot.removeAttribute('id');
    snapshot.removeAttribute('data-page');
    snapshot.removeAttribute('aria-hidden');
    snapshot.querySelectorAll('[id]').forEach((element) => element.removeAttribute('id'));
    snapshot.querySelectorAll('.page-number').forEach((element) => element.remove());
    snapshot.inert = true;
    snapshot.scrollTop = sourcePage.scrollTop;
    front.append(snapshot);

    const back = document.createElement('div');
    back.className = 'flip-back';
    back.innerHTML = '<span class="flip-back-mark">♡</span><span class="flip-back-caption">um pedacinho de nós</span>';
    sheet.append(front, back);
    main.append(sheet);

    sourcePage.classList.remove('is-active', 'turn-forward', 'turn-back');
    sourcePage.setAttribute('aria-hidden', 'true');
    sourcePage.inert = true;
    const removeSheet = () => sheet.remove();
    sheet.addEventListener('animationend', removeSheet, { once: true });
    window.setTimeout(removeSheet, 1800);
  }

  currentPage = nextPage;
  const activePage = pages[currentPage];
  activePage.classList.add('is-active');
  activePage.setAttribute('aria-hidden', 'false');
  activePage.inert = false;
  activePage.scrollTop = 0;
  dots.querySelectorAll('.page-dot').forEach((dot, dotIndex) => {
    dot.classList.toggle('is-current', dotIndex === currentPage);
    dot.setAttribute('aria-current', dotIndex === currentPage ? 'page' : 'false');
  });
  pageCount.textContent = `página ${String(currentPage + 1).padStart(2, '0')} de ${String(pages.length).padStart(2, '0')}`;
  bookControls.querySelector('#previous-page').disabled = currentPage === 0;
  bookControls.querySelector('#next-page').disabled = currentPage === pages.length - 1;
  history.replaceState(null, '', `#${pages[currentPage].id || 'inicio'}`);
}

bookControls.querySelector('#previous-page').addEventListener('click', () => showPage(currentPage - 1, 'back'));
bookControls.querySelector('#next-page').addEventListener('click', () => showPage(currentPage + 1));
document.addEventListener('keydown', (event) => {
  if (event.altKey || event.ctrlKey || event.metaKey || event.target.matches('input, textarea, button')) return;
  if (event.key === 'ArrowRight') showPage(currentPage + 1);
  if (event.key === 'ArrowLeft') showPage(currentPage - 1, 'back');
});
let swipeStart = null;
main.addEventListener('pointerdown', (event) => {
  if (event.pointerType !== 'touch' || event.target.closest('button, a')) return;
  swipeStart = { x: event.clientX, y: event.clientY };
});
main.addEventListener('pointerup', (event) => {
  if (!swipeStart) return;
  const dx = event.clientX - swipeStart.x;
  const dy = event.clientY - swipeStart.y;
  swipeStart = null;
  if (Math.abs(dx) < 85 || Math.abs(dx) < Math.abs(dy) * 1.4) return;
  showPage(currentPage + (dx < 0 ? 1 : -1), dx < 0 ? 'forward' : 'back');
});
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (event) => {
    const destination = document.querySelector(link.getAttribute('href'));
    const pageIndex = pages.indexOf(destination);
    if (pageIndex >= 0) {
      event.preventDefault();
      showPage(pageIndex, pageIndex < currentPage ? 'back' : 'forward');
    }
  });
});
const initialPage = pages.findIndex((page) => `#${page.id}` === location.hash);
showPage(initialPage >= 0 ? initialPage : 0);

const musicButton = document.querySelector('#music-toggle');
const musicLabel = document.querySelector('#music-label');
const musicPopover = document.querySelector('#music-popover');
const spotifyPlayer = document.querySelector('#spotify-player');

function closeMusic() {
  musicPopover.hidden = true;
  musicButton.setAttribute('aria-expanded', 'false');
  musicButton.setAttribute('aria-pressed', 'false');
  musicLabel.textContent = 'Só Nós Dois';
  spotifyPlayer.replaceChildren();
}

musicButton.addEventListener('click', () => {
  if (!musicPopover.hidden) {
    closeMusic();
    return;
  }
  const player = document.createElement('iframe');
  player.title = 'Só Nós Dois, de Tim Bernardes, no Spotify';
  player.src = 'https://open.spotify.com/embed/track/3yiXy2ydZP9ZpsYxvUI6sO?utm_source=generator&theme=0';
  player.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
  player.allowFullscreen = true;
  player.loading = 'lazy';
  player.referrerPolicy = 'strict-origin-when-cross-origin';
  spotifyPlayer.replaceChildren(player);
  musicPopover.hidden = false;
  musicButton.setAttribute('aria-expanded', 'true');
  musicButton.setAttribute('aria-pressed', 'true');
  musicLabel.textContent = 'fechar música';
});

document.addEventListener('click', (event) => {
  if (!musicPopover.hidden && !musicPopover.contains(event.target) && !musicButton.contains(event.target)) closeMusic();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !musicPopover.hidden) closeMusic();
});

const board = document.querySelector('#puzzle-board');
const status = document.querySelector('#puzzle-status');
const imageUrl = 'url("assets/foto-quebra-cabeca.jpg")';
let order = [];
let selected = null;

function isSolved() {
  return order.every((piece, index) => piece === index);
}

function paintPuzzle() {
  board.replaceChildren();
  order.forEach((piece, position) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'puzzle-piece';
    button.setAttribute('aria-label', `Peça ${piece + 1}`);
    button.style.setProperty('--piece-x', `${(piece % 3) * 50}%`);
    button.style.setProperty('--piece-y', `${Math.floor(piece / 3) * 50}%`);
    button.style.setProperty('--puzzle-image', imageUrl);
    button.innerHTML = `<span>${piece + 1}</span>`;
    if (position === selected) button.classList.add('selected');
    if (isSolved()) button.classList.add('solved');
    button.addEventListener('click', () => choosePiece(position));
    board.append(button);
  });
  status.textContent = isSolved() ? 'Você conseguiu! Nosso pedacinho de mundo ♡' : 'Dica: comece pelos cantinhos ♡';
}

function choosePiece(position) {
  if (selected === null) {
    selected = position;
  } else if (selected === position) {
    selected = null;
  } else {
    [order[selected], order[position]] = [order[position], order[selected]];
    selected = null;
  }
  paintPuzzle();
}

function shufflePuzzle() {
  order = Array.from({ length: 9 }, (_, index) => index);
  for (let index = order.length - 1; index > 0; index -= 1) {
    const other = Math.floor(Math.random() * (index + 1));
    [order[index], order[other]] = [order[other], order[index]];
  }
  if (isSolved()) [order[0], order[1]] = [order[1], order[0]];
  selected = null;
  paintPuzzle();
}

document.querySelector('#shuffle-puzzle').addEventListener('click', shufflePuzzle);
shufflePuzzle();
