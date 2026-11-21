import { createRun, step, WIDTH, HEIGHT, LANDMARKS, isRoad } from './files/src/simulator.mjs';

const files = [
  ['README.md', 'Full guide and project status'],
  ['package.json', 'Commands and runtime'],
  ['docs/PROTOCOL.md', 'Local bridge contract'],
  ['docs/OPERATIONS.md', 'Run and evidence operations'],
  ['src/simulator.mjs', 'City and route planning'],
  ['src/bridge.mjs', 'Local HTTP transport'],
  ['src/providers.mjs', 'Simulation and vision decisions'],
  ['src/runtime.mjs', 'Agent loop and trace'],
  ['src/cli.mjs', 'Command line interface'],
  ['examples/mock-bridge.mjs', 'Working HTTP bridge example'],
  ['adapters/requirements.txt', 'Windows bridge dependency'],
  ['adapters/windows_desktop_bridge.py', 'Windows capture and input bridge'],
  ['adapters/test_windows_bridge.py', 'Windows bridge verification'],
  ['test/simulator.test.mjs', 'Planner verification'],
  ['test/runtime.test.mjs', 'Bridge and provider checks'],
  ['LICENSE', 'MIT license'],
];
const $ = selector => document.querySelector(selector);
const fileList = $('#file-list');
const code = $('#code');
const fileName = $('#file-name');
const fileSize = $('#file-size');
let activeFile = files[0][0];
let activeText = '';
for (const [name, description] of files) {
  const button = document.createElement('button');
  button.type = 'button';
  button.dataset.file = name;
  button.innerHTML = `<span class="icon">${name.includes('.') ? '▤' : '▣'}</span><span><b></b><small></small></span>`;
  button.querySelector('b').textContent = name;
  button.querySelector('small').textContent = description;
  button.addEventListener('click', () => openFile(name));
  fileList.append(button);
}
async function openFile(name) {
  if (!files.some(([allowed]) => allowed === name)) return;
  activeFile = name;
  fileName.textContent = name;
  code.textContent = 'Loading source…';
  document.querySelectorAll('[data-file]').forEach(button => button.setAttribute('aria-current', String(button.dataset.file === name)));
  try {
    const response = await fetch(`./files/${name}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    activeText = await response.text();
    code.textContent = activeText;
    fileSize.textContent = `${activeText.split('\n').length} lines · ${new Blob([activeText]).size.toLocaleString()} bytes`;
  } catch (error) {
    activeText = '';
    code.textContent = `Could not load ${name}: ${error.message}`;
  }
}
$('#download-file').addEventListener('click', () => {
  if (!activeText) return;
  const url = URL.createObjectURL(new Blob([activeText], { type: 'text/plain' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = activeFile.split('/').at(-1);
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
openFile('README.md');

const tabs = [...document.querySelectorAll('[role=tab]')];
function showTab(name, updateHash = true) {
  for (const tab of tabs) tab.setAttribute('aria-selected', String(tab.dataset.tab === name));
  for (const pane of document.querySelectorAll('[role=tabpanel]')) pane.hidden = pane.id !== `pane-${name}`;
  if (updateHash) history.replaceState(null, '', `#tab-${name}`);
}
for (const tab of tabs) tab.addEventListener('click', () => showTab(tab.dataset.tab));
showTab(location.hash === '#tab-demo' ? 'demo' : 'code', !location.hash || location.hash.startsWith('#tab-'));

let run = createRun(6);
let timer = null;
const map = $('#city-map');
for (let y = 0; y < HEIGHT; y++) for (let x = 0; x < WIDTH; x++) {
  const cell = document.createElement('div');
  cell.className = 'cell';
  cell.dataset.x = x;
  cell.dataset.y = y;
  map.append(cell);
}
function render() {
  for (const cell of map.children) {
    const x = Number(cell.dataset.x), y = Number(cell.dataset.y);
    const id = `${x},${y}`;
    cell.className = 'cell' + (isRoad(x, y) ? ' road' : '') + (run.visited[id] ? ' seen' : '') +
      (LANDMARKS.some(p => p.x === x && p.y === y) ? ' landmark' : '') +
      (run.goal?.x === x && run.goal?.y === y ? ' goal' : '') +
      (run.position.x === x && run.position.y === y ? ' agent' : '');
    cell.title = LANDMARKS.find(p => p.x === x && p.y === y)?.name || `Street ${id}`;
  }
  $('#step-value').textContent = String(run.tick).padStart(3, '0');
  $('#goal-value').textContent = run.goal?.name || 'Choosing…';
  $('#place-value').textContent = `${run.landmarks.length} / ${LANDMARKS.length}`;
  $('#trace').replaceChildren(...run.events.slice(-6).reverse().map(event => {
    const row = document.createElement('div');
    row.className = 'trace-item';
    const number = document.createElement('b');
    number.textContent = `#${String(event.tick).padStart(3, '0')}`;
    const action = document.createTextNode(`${event.action.toUpperCase()} · ${event.outcome}`);
    const detail = document.createElement('span');
    detail.textContent = `${event.observation} ${event.decision}.`;
    row.append(number, action, detail);
    return row;
  }));
}
$('#step-button').addEventListener('click', () => { run = step(run); render(); });
$('#play-button').addEventListener('click', event => {
  if (timer) { clearInterval(timer); timer = null; event.currentTarget.textContent = '▶ Run'; return; }
  timer = setInterval(() => { run = step(run); render(); }, 380);
  event.currentTarget.textContent = 'Ⅱ Pause';
});
$('#reset-button').addEventListener('click', () => { run = createRun(6); render(); });
$('#download-trace').addEventListener('click', () => {
  const url = URL.createObjectURL(new Blob([JSON.stringify(run, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = 'afksix-simulation-run.json'; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
render();
