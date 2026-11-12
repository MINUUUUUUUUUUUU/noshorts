const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
function popup() {
  const elements = Object.fromEntries(['toggle-enabled', 'toggle-show', 'status'].map(id => [id, { disabled: true, checked: false, addEventListener(event, cb) { this[event] = cb; } }]));
  let read, changed;
  const writes = [];
  vm.runInNewContext(fs.readFileSync(`${__dirname}/../src/popup.js`, 'utf8'), {
    document: { getElementById: id => elements[id], querySelectorAll: () => [] },
    chrome: { i18n: { getMessage: key => key }, storage: {
      sync: { get(defaults, cb) { read = cb; }, set(value) { writes.push(JSON.parse(JSON.stringify(value))); } },
      onChanged: { addListener(cb) { changed = cb; } }
    } }
  });
  return { elements, writes, read: v => read(v), changed: v => changed(v, 'sync') };
}
test('master off keeps showVideo editable and does not change the master', () => {
  const p = popup();
  p.read({ enabled: true, showVideo: true });
  const master = p.elements['toggle-enabled'], show = p.elements['toggle-show'];
  master.checked = false;
  master.change();
  assert.equal(show.disabled, false);
  assert.equal(show.checked, true);
  show.checked = false;
  show.change();
  assert.equal(master.checked, false);
  assert.equal(p.elements.status.textContent, 'statusOff');
  assert.deepEqual(p.writes, [{ enabled: false }, { showVideo: false }]);
});
test('newer settings take precedence over a stale popup initialization', () => {
  const p = popup();
  assert.equal(p.elements['toggle-enabled'].disabled, true);
  p.changed({ enabled: { newValue: false }, showVideo: { newValue: true } });
  p.read({ enabled: true, showVideo: false });
  assert.equal(p.elements['toggle-enabled'].checked, false);
  assert.equal(p.elements['toggle-show'].checked, true);
  assert.equal(p.elements.status.textContent, 'statusOff');
  p.changed({ enabled: { newValue: true } });
  assert.equal(p.elements.status.textContent, 'statusShow');
});
