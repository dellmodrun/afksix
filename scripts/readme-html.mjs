const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const slug = text => text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
function inline(text) {
  return escape(text)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) => {
      const safe = /^(https:\/\/|#|[a-zA-Z0-9_.\/-]+$)/.test(href) ? href : '#';
      const target = safe.startsWith('docs/') || safe === 'LICENSE' ? `files/${safe}` : safe;
      return `<a href="${escape(target)}"${safe.startsWith('https://') ? ' target="_blank" rel="noopener noreferrer"' : ''}>${label}</a>`;
    });
}

export function renderReadme(markdown) {
  const lines = markdown.replaceAll('\r\n', '\n').split('\n');
  const html = [];
  let paragraph = [];
  let list = null;
  const flushParagraph = () => { if (paragraph.length) { html.push(`<p>${inline(paragraph.join(' '))}</p>`); paragraph = []; } };
  const closeList = () => { if (list) { html.push(`</${list}>`); list = null; } };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) { flushParagraph(); closeList(); continue; }
    if (line.startsWith('```')) {
      flushParagraph(); closeList();
      const code = [];
      while (++i < lines.length && !lines[i].startsWith('```')) code.push(lines[i]);
      html.push(`<pre><code>${escape(code.join('\n'))}</code></pre>`);
      continue;
    }
    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (heading) { flushParagraph(); closeList(); const level = heading[1].length; html.push(`<h${level} id="${slug(heading[2])}">${inline(heading[2])}</h${level}>`); continue; }
    if (line.startsWith('|') && i + 1 < lines.length && /^\|[\s:|-]+\|$/.test(lines[i + 1])) {
      flushParagraph(); closeList();
      const cells = row => row.slice(1, -1).split('|').map(cell => cell.trim());
      html.push('<div class="readme-table"><table><thead><tr>' + cells(line).map(cell => `<th>${inline(cell)}</th>`).join('') + '</tr></thead><tbody>');
      i++;
      while (i + 1 < lines.length && lines[i + 1].startsWith('|')) html.push('<tr>' + cells(lines[++i]).map(cell => `<td>${inline(cell)}</td>`).join('') + '</tr>');
      html.push('</tbody></table></div>');
      continue;
    }
    const item = /^(?:(-)|\d+\.)\s+(.+)$/.exec(line);
    if (item) {
      flushParagraph();
      const kind = item[1] ? 'ul' : 'ol';
      if (list !== kind) { closeList(); html.push(`<${kind}>`); list = kind; }
      html.push(`<li>${inline(item[2])}</li>`);
      continue;
    }
    if (line.startsWith('> ')) { flushParagraph(); closeList(); html.push(`<blockquote>${inline(line.slice(2))}</blockquote>`); continue; }
    if (line.trim() === '---') { flushParagraph(); closeList(); html.push('<hr>'); continue; }
    paragraph.push(line.trim());
  }
  flushParagraph(); closeList();
  return `<article class="box readme">${html.join('\n')}</article>`;
}
