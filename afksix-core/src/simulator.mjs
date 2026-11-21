// Deterministic, dependency-free exploration core. This is a simulated city,
// not a GTA VI connection. The same module runs in Node.js and in the browser.
export const WIDTH = 17;
export const HEIGHT = 11;
export const LANDMARKS = Object.freeze([
  { name: 'Marina', x: 2, y: 2 },
  { name: 'Arcade', x: 8, y: 2 },
  { name: 'Market', x: 14, y: 2 },
  { name: 'Station', x: 2, y: 8 },
  { name: 'Nightclub', x: 8, y: 8 },
  { name: 'Airfield', x: 14, y: 8 },
]);

const key = (x, y) => `${x},${y}`;
const distance = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
const neighbors = ({ x, y }) => [
  { x, y: y - 1, direction: 'north' },
  { x: x + 1, y, direction: 'east' },
  { x, y: y + 1, direction: 'south' },
  { x: x - 1, y, direction: 'west' },
];
export const isRoad = (x, y) => x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT &&
  (x % 3 === 2 || y % 3 === 2);

function route(start, goal, blocked = new Set()) {
  const queue = [start];
  const previous = new Map([[key(start.x, start.y), null]]);
  for (let index = 0; index < queue.length; index++) {
    const here = queue[index];
    if (here.x === goal.x && here.y === goal.y) break;
    for (const next of neighbors(here)) {
      const id = key(next.x, next.y);
      if (!isRoad(next.x, next.y) || blocked.has(id) || previous.has(id)) continue;
      previous.set(id, here);
      queue.push(next);
    }
  }
  if (!previous.has(key(goal.x, goal.y))) return null;
  const path = [goal];
  while (path[0].x !== start.x || path[0].y !== start.y) {
    path.unshift(previous.get(key(path[0].x, path[0].y)));
  }
  return path;
}

export function createRun(seed = 6) {
  if (!Number.isInteger(seed) || seed < 0) throw new TypeError('seed must be a non-negative integer');
  return {
    seed, tick: 0, position: { x: 8, y: 5 }, goal: null,
    visited: { [key(8, 5)]: 1 }, landmarks: [],
    memory: [], events: [], status: 'ready',
  };
}

function chooseGoal(run) {
  const unvisited = LANDMARKS.filter(place => !run.landmarks.includes(place.name));
  if (unvisited.length) {
    const place = unvisited
      .map(place => ({ place, score: distance(run.position, place) + ((run.seed + run.tick + place.x) % 5) }))
      .sort((a, b) => a.score - b.score || a.place.name.localeCompare(b.place.name))[0].place;
    return { x: place.x, y: place.y, name: place.name };
  }
  const roads = [];
  for (let y = 0; y < HEIGHT; y++) for (let x = 0; x < WIDTH; x++) {
    if (isRoad(x, y) && distance(run.position, { x, y }) > 2) roads.push({ x, y });
  }
  roads.sort((a, b) => (run.visited[key(a.x, a.y)] || 0) - (run.visited[key(b.x, b.y)] || 0) ||
    distance(run.position, a) - distance(run.position, b) || a.y - b.y || a.x - b.x);
  return { ...roads[(run.seed + run.tick) % Math.min(6, roads.length)], name: 'Unmapped street' };
}

// One full observe -> choose -> act -> check -> remember cycle.
export function step(run) {
  if (!run || !isRoad(run.position?.x, run.position?.y)) throw new TypeError('invalid run state');
  const next = structuredClone(run);
  next.tick++;
  if (!next.goal) next.goal = chooseGoal(next);
  const observation = `At ${next.position.x},${next.position.y}; ${neighbors(next.position).filter(p => isRoad(p.x, p.y)).length} open exits.`;
  const path = route(next.position, next.goal);
  if (!path || path.length < 2) {
    const arrived = next.goal?.name || 'destination';
    if (LANDMARKS.some(place => place.name === arrived) && !next.landmarks.includes(arrived)) next.landmarks.push(arrived);
    next.memory.unshift(`Reached ${arrived} at step ${next.tick}.`);
    next.memory = next.memory.slice(0, 6);
    next.goal = null;
    next.status = 'destination reached';
    next.events.push({ tick: next.tick, observation, decision: 'Choose another place to explore', action: 'pause', outcome: next.status, position: { ...next.position } });
    return next;
  }
  const destination = path[1];
  const action = neighbors(next.position).find(p => p.x === destination.x && p.y === destination.y)?.direction;
  if (!action || !isRoad(destination.x, destination.y)) throw new Error('planner produced an invalid move');
  next.position = { x: destination.x, y: destination.y };
  const id = key(destination.x, destination.y);
  next.visited[id] = (next.visited[id] || 0) + 1;
  next.status = `moving ${action}`;
  next.events.push({ tick: next.tick, observation, decision: `Explore ${next.goal.name}`, action, outcome: `Moved to ${id}`, position: { ...next.position } });
  return next;
}

export function runSteps(seed = 6, count = 60) {
  if (!Number.isInteger(count) || count < 0 || count > 10000) throw new RangeError('count must be 0..10000');
  let run = createRun(seed);
  for (let i = 0; i < count; i++) run = step(run);
  return run;
}
