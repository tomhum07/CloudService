const qs = s => document.querySelector(s);
const escapeHtml = s => String(s ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
async function api(url, options={}) {
  const response = await fetch(url, { headers: { 'Content-Type': 'application/json', ...(options.headers||{}) }, ...options });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Có lỗi xảy ra');
  return data;
}
function bindForm(selector, endpoint) {
  const form = qs(selector), message = qs('#message');
  form.addEventListener('submit', async e => {
    e.preventDefault(); const button = form.querySelector('button[type=submit]');
    button.disabled = true; button.textContent = 'Đang gửi...'; message.className = 'message';
    try {
      const body = Object.fromEntries(new FormData(form));
      await api(endpoint, { method:'POST', body:JSON.stringify(body) });
      message.textContent = 'Gửi thông tin thành công! Chúng tôi sẽ liên hệ với bạn sớm.'; message.className = 'message show ok'; form.reset();
    } catch (err) { message.textContent = err.message; message.className = 'message show error'; }
    finally { button.disabled = false; button.textContent = button.dataset.label; }
  });
}
