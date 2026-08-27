import { cloudData, syncData, ensureDataStructure } from './firebase.js'; 

export function renderDeliveries(currentGroup) {
  ensureDataStructure();
  const deliveries = (cloudData.deliveries && cloudData.deliveries[currentGroup]) || [];
  const listEl = document.getElementById('delivery-list');
  if (!listEl) return;

  if (deliveries.length === 0) {
    listEl.innerHTML = `<p class="text-xs text-slate-500 py-10 col-span-2 text-center">등록된 반택/택배 배송 정보가 없습니다. '배송지 등록'을 눌러보세요.</p>`;
  } else {
    listEl.innerHTML = deliveries.map((d, idx) => `
      <div class="bg-slate-900 border ${d.shipped ? 'border-emerald-500/40 bg-emerald-950/10' : 'border-slate-800'} rounded-2xl p-4 shadow-lg flex flex-col justify-between space-y-3">
        <div>
          <div class="flex items-center justify-between gap-2 mb-2">
            <div class="flex items-center gap-2">
              <span class="text-[10px] font-bold px-2 py-0.5 rounded ${
                d.type === 'CU알뜰' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
              }">${d.type || 'GS반택'}</span>
              <span class="text-sm font-bold text-white">${d.recipient}</span>
            </div>
            
            <button onclick="window.toggleShipped(${idx})" class="text-[10px] font-bold px-2.5 py-0.5 rounded-full border transition ${
              d.shipped ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-slate-800 text-slate-400 border-slate-700'
            }">
              <i class="fa-solid ${d.shipped ? 'fa-check' : 'fa-box'} text-[9px]"></i> ${d.shipped ? '발송완료' : '발송대기'}
            </button>
          </div>

          <div class="text-xs space-y-1 text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
            <p><span class="text-slate-500 mr-1">연락처:</span>${d.phone || '미입력'}</p>
            <p><span class="text-slate-500 mr-1">도착점포:</span><strong class="text-indigo-300">${d.storeName}</strong></p>
            ${d.memo ? `<p><span class="text-slate-500 mr-1">품목/메모:</span>${d.memo}</p>` : ''}
          </div>
        </div>

        <div class="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <button onclick="window.copyDeliveryAddress(${idx})" class="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1">
            <i class="fa-regular fa-copy"></i> 주소정보 복사
          </button>
          <div class="flex gap-2">
            <button onclick="window.openDeliveryModal(${idx})" class="text-slate-400 hover:text-indigo-400"><i class="fa-solid fa-pen text-[11px]"></i></button>
            <button onclick="window.deleteDelivery(${idx})" class="text-slate-500 hover:text-rose-400"><i class="fa-solid fa-trash text-[11px]"></i></button>
          </div>
        </div>
      </div>
    `).join('');
  }
}

export function openDeliveryModal(idx = -1, currentGroup) {
  document.getElementById('edit-delivery-idx').value = idx;
  if (idx >= 0) {
    const item = cloudData.deliveries[currentGroup][idx];
    document.getElementById('delivery-modal-title').innerText = '반택 주소 수정';
    document.getElementById('del-type').value = item.type || 'GS반택';
    document.getElementById('del-recipient').value = item.recipient || '';
    document.getElementById('del-phone').value = item.phone || '';
    document.getElementById('del-store').value = item.storeName || '';
    document.getElementById('del-memo').value = item.memo || '';
    document.getElementById('del-shipped').value = item.shipped ? 'true' : 'false';
  } else {
    document.getElementById('delivery-modal-title').innerText = '새 반택 주소 등록';
    document.getElementById('del-type').value = 'GS반택';
    document.getElementById('del-recipient').value = '';
    document.getElementById('del-phone').value = '';
    document.getElementById('del-store').value = '';
    document.getElementById('del-memo').value = '';
    document.getElementById('del-shipped').value = 'false';
  }
  document.getElementById('delivery-modal').classList.replace('hidden', 'flex');
}

export function saveDelivery(currentGroup, onRender) {
  const idx = parseInt(document.getElementById('edit-delivery-idx').value);
  const type = document.getElementById('del-type').value;
  const recipient = document.getElementById('del-recipient').value.trim();
  const phone = document.getElementById('del-phone').value.trim();
  const storeName = document.getElementById('del-store').value.trim();
  const memo = document.getElementById('del-memo').value.trim();
  const shipped = document.getElementById('del-shipped').value === 'true';

  if (!recipient || !storeName) return alert('받는분 이름과 편의점 점포명을 입력하세요.');
  if (!cloudData.deliveries) cloudData.deliveries = { plave: [], wego6: [] };
  if (!cloudData.deliveries[currentGroup]) cloudData.deliveries[currentGroup] = [];

  const payload = { type, recipient, phone, storeName, memo, shipped };
  if (idx >= 0) cloudData.deliveries[currentGroup][idx] = payload;
  else cloudData.deliveries[currentGroup].unshift(payload);

  window.closeModals();
  syncData(onRender);
}

export function toggleShipped(idx, currentGroup, onRender) {
  cloudData.deliveries[currentGroup][idx].shipped = !cloudData.deliveries[currentGroup][idx].shipped;
  syncData(onRender);
}

export function copyDeliveryAddress(idx, currentGroup) {
  const d = cloudData.deliveries[currentGroup][idx];
  const copyText = `[${d.type}] ${d.recipient} / ${d.phone} / ${d.storeName} (${d.memo || ''})`;
  navigator.clipboard.writeText(copyText).then(() => {
    alert('배송 정보가 클립보드에 복사되었습니다!\n\n' + copyText);
  });
}

export function deleteDelivery(idx, currentGroup, onRender) {
  if (!confirm('이 배송지 정보를 삭제하시겠습니까?')) return;
  cloudData.deliveries[currentGroup].splice(idx, 1);
  syncData(onRender);
}
