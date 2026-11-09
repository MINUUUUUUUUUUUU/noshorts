const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const source = fs.readFileSync(`${__dirname}/../src/content.js`, 'utf8');

function load({ root = true, url = 'https://www.youtube.com/shorts/example' } = {}) {
  const redirects = [], classes = new Set(), listeners = {};
  let read, changed, observe;
  const element = { classList: { toggle(name, on) { on ? classes.add(name) : classes.delete(name); } } };
  const document = { documentElement: root ? element : null };
  const location = { href: url, replace(target) { redirects.push(target); } };
  vm.runInNewContext(source, {
    document, location, URL, setInterval() {},
    MutationObserver: class { constructor(cb) { observe = cb; } observe() {} disconnect() {} },
    window: { addEventListener(name, cb) { listeners[name] = cb; } },
    chrome: {
      runtime: { getURL: p => `chrome-extension://test/${p}` },
      storage: { sync: { get(defaults, cb) { read = cb; } }, onChanged: { addListener(cb) { changed = cb; } } }
    }
  });
  return { redirects, classes, document, location, listeners, read: v => read(v), changed: v => changed(v, 'sync'), mount() { document.documentElement = element; observe(); } };
}

test('disabled setting prevents redirect before and after asynchronous load', () => {
  const s = load();
  assert.deepEqual(s.redirects, []);
  s.read({ enabled: false, showVideo: false });
  assert.deepEqual(s.redirects, []);
  assert.equal(s.classes.has('ysb-on'), false);
});
test('showVideo setting is honored on direct Shorts entry', () => {
  const s = load();
  s.read({ enabled: true, showVideo: true });
  assert.deepEqual(s.redirects, ['https://www.youtube.com/watch?v=example']);
});
test('blocking navigates to the extension page', () => {
  const s = load();
  s.read({ enabled: true, showVideo: false });
  assert.deepEqual(s.redirects, ['chrome-extension://test/src/blocked.html']);
});
test('missing document root initializes safely and respects disabled state', () => {
  const s = load({ root: false });
  s.read({ enabled: false, showVideo: false });
  s.mount();
  assert.equal(s.classes.has('ysb-on'), false);
  assert.deepEqual(s.redirects, []);
});
test('SPA navigation and removed settings restore defaults', () => {
  const s = load({ url: 'https://www.youtube.com/' });
  s.read({ enabled: false, showVideo: true });
  s.location.href = 'https://www.youtube.com/shorts/example';
  s.listeners['yt-navigate-finish']();
  assert.deepEqual(s.redirects, []);
  s.changed({ enabled: { newValue: undefined }, showVideo: { newValue: undefined } });
  assert.deepEqual(s.redirects, ['chrome-extension://test/src/blocked.html']);
});
