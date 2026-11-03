/** Run an action expecting one dialog; bound both the action and dialog handling. */
export function withDialog(page, action, trigger, timeoutMs = 5000) {
  if (!['accept', 'dismiss'].includes(action)) throw new Error('Unsupported dialog action');
  return new Promise((resolve, reject) => {
    let settled = false, triggered = false, handled = false;
    const cleanup = () => { clearTimeout(timer); page.off('dialog', onDialog); };
    const fail = error => { if (!settled) { settled = true; cleanup(); reject(error); } };
    const finish = () => { if (!settled && triggered && handled) { settled = true; cleanup(); resolve(); } };
    const onDialog = dialog => {
      page.off('dialog', onDialog);
      Promise.resolve().then(() => dialog[action]()).then(() => { handled = true; finish(); }, fail);
    };
    const timer = setTimeout(() => fail(new Error(`Timed out after ${timeoutMs}ms waiting for dialog ${action}`)), timeoutMs);
    page.on('dialog', onDialog);
    Promise.resolve().then(trigger).then(() => { triggered = true; finish(); }, fail);
  });
}
