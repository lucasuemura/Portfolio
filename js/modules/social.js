// Lista de redes sociais + botão "copiar link" com confirmação.
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function renderSocial(listEl, links) {
  listEl.innerHTML = links.map((l) => `
    <li>
      <a class="slink" href="${esc(l.url)}" target="_blank" rel="noopener noreferrer" data-cursor="Abrir ↗">
        <span class="slink__label u-link">${esc(l.label)}</span>
        <span class="slink__handle">${esc(l.handle)}</span>
        <span class="slink__arrow" aria-hidden="true">↗</span>
      </a>
    </li>`).join('');
}

async function writeClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = Object.assign(document.createElement('textarea'), { value: text, readOnly: true });
    ta.style.cssText = 'position:fixed;opacity:0';
    document.body.append(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
}

export function initCopy(cursor) {
  const status = document.querySelector('[data-copy-status]');
  document.querySelectorAll('[data-copy]').forEach((btn) => {
    let timer;
    btn.addEventListener('click', async () => {
      const ok = await writeClipboard(btn.dataset.copy);
      status.textContent = ok ? 'Link do GitHub copiado.' : 'Não foi possível copiar. Selecione o link e copie manualmente.';
      if (!ok) return;
      btn.classList.add('is-done');
      btn.dataset.cursor = 'Copiado!';
      cursor?.flash('Copiado!');
      clearTimeout(timer);
      timer = setTimeout(() => {
        btn.classList.remove('is-done');
        btn.dataset.cursor = 'Copiar';
      }, 1800);
    });
  });
}
