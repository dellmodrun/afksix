const allowedHosts = new Set(['127.0.0.1', 'localhost', '[::1]']);

export class BridgeClient {
  constructor(baseUrl, { timeoutMs = 5000, fetchImpl = fetch } = {}) {
    const url = new URL(baseUrl);
    if (url.protocol !== 'http:' || !allowedHosts.has(url.hostname)) {
      throw new Error('The control bridge must use loopback HTTP (127.0.0.1 or localhost)');
    }
    if (!Number.isInteger(timeoutMs) || timeoutMs < 100 || timeoutMs > 60000) throw new RangeError('invalid bridge timeout');
    this.baseUrl = url.href.replace(/\/$/, '');
    this.timeoutMs = timeoutMs;
    this.fetchImpl = fetchImpl;
  }

  async request(method, path, body) {
    const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
      method,
      headers: { accept: 'application/json', ...(body ? { 'content-type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(this.timeoutMs),
    });
    if (!response.ok) throw new Error(`bridge ${method} ${path}: HTTP ${response.status}`);
    const data = await response.json();
    if (!data || typeof data !== 'object') throw new Error('bridge returned invalid JSON');
    return data;
  }

  health() { return this.request('GET', '/health'); }
  observe() { return this.request('GET', '/v1/observation'); }
  act(action, expectedTick) { return this.request('POST', '/v1/action', { action, expected_tick: expectedTick }); }
}
