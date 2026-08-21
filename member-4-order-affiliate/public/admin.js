let state = { orders: [], affiliates: [], tab: 'orders' };
const statusText = { pending:'Chờ duyệt', approved:'Đã duyệt', cancelled:'Đã hủy' };
const dateText = value => new Intl.DateTimeFormat('vi-VN',{dateStyle:'short',timeStyle:'short'}).format(new Date(value));
async function loadData(){
  try { [state.orders,state.affiliates] = await Promise.all([api('/api/order-requests'),api('/api/affiliates')]); render(); }
  catch(err){ qs('#table').innerHTML=`<div class="empty">${escapeHtml(err.message)}</div>`; }
}
function render(){
  const all=[...state.orders,...state.affiliates];
  qs('#total').textContent=all.length; ['pending','approved','cancelled'].forEach(s=>qs('#'+s).textContent=all.filter(x=>x.status===s).length);
  const list=state[state.tab];
  if(!list.length){qs('#table').innerHTML='<div class="empty">Chưa có yêu cầu nào trong danh sách.</div>';return}
  const affiliate=state.tab==='affiliates';
  qs('#table').innerHTML=`<table><thead><tr><th>Khách hàng</th><th>Liên hệ</th><th>${affiliate?'Kênh hoạt động':'Dịch vụ'}</th><th>Ngày gửi</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>${list.map(x=>`<tr><td><strong>${escapeHtml(x.fullName)}</strong><br><small>${escapeHtml(affiliate?(x.experience||'Chưa có kinh nghiệm'):(x.note||'Không có ghi chú'))}</small></td><td>${escapeHtml(x.phone)}<br><small>${escapeHtml(x.email||'—')}</small></td><td>${escapeHtml(affiliate?x.channel:x.service)}</td><td>${dateText(x.createdAt)}</td><td><span class="badge ${x.status}">${statusText[x.status]}</span></td><td><div class="row-actions"><button class="btn success" onclick="setStatus('${x.id}','approved')">Duyệt</button><button class="btn danger" onclick="setStatus('${x.id}','cancelled')">Hủy</button></div></td></tr>`).join('')}</tbody></table>`;
}
async function setStatus(id,status){
  const resource=state.tab==='orders'?'order-requests':'affiliates';
  try{await api(`/api/${resource}/${id}/status`,{method:'PATCH',body:JSON.stringify({status})});await loadData()}catch(err){alert(err.message)}
}
document.querySelectorAll('.tab').forEach(button=>button.onclick=()=>{document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));button.classList.add('active');state.tab=button.dataset.tab;render()});
loadData();
