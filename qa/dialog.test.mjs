import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { withDialog } from './dialog.mjs';
for (const action of ['accept', 'dismiss']) test(`${action} waits for trigger and handling, then removes listener`, async () => {
  const page = new EventEmitter(); let handled = false, triggered = false;
  await withDialog(page, action, async () => {
    page.emit('dialog', { [action]: async () => { await new Promise(r => setTimeout(r, 5)); handled = true; } });
    await new Promise(r => setTimeout(r, 10)); triggered = true;
  }, 500);
  assert.equal(handled, true); assert.equal(triggered, true); assert.equal(page.listenerCount('dialog'), 0);
});
test('missing dialog fails promptly and removes listener', async () => {
  const page = new EventEmitter();
  await assert.rejects(withDialog(page, 'accept', () => {}, 20), /Timed out after 20ms/);
  assert.equal(page.listenerCount('dialog'), 0);
});
test('dialog handler rejection reaches caller and removes listener', async () => {
  const page = new EventEmitter();
  await assert.rejects(withDialog(page, 'accept', () => page.emit('dialog', { accept: async () => { throw new Error('handler failed'); } }), 500), /handler failed/);
  assert.equal(page.listenerCount('dialog'), 0);
});
test('trigger failure reaches caller and removes listener', async () => {
  const page = new EventEmitter();
  await assert.rejects(withDialog(page, 'accept', () => { throw new Error('trigger failed'); }, 500), /trigger failed/);
  assert.equal(page.listenerCount('dialog'), 0);
});
test('hanging trigger is bounded even when dialog is handled', async () => {
  const page = new EventEmitter();
  await assert.rejects(withDialog(page, 'dismiss', () => { page.emit('dialog', { dismiss: async () => {} }); return new Promise(() => {}); }, 20), /Timed out/);
  assert.equal(page.listenerCount('dialog'), 0);
});
