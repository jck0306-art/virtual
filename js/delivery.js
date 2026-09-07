import { cloudData, syncData, ensureDataStructure } from './firebase.js';
import { escapeHTML } from './security.js';

let activeGroup = 'plave';

export function renderDeliveries(currentGroup) {
  if (currentGroup) activeGroup = currentGroup;
  ensureDataStructure();

  const container = document.getElementById('delivery-list');
  if (!container) return;

  const list = (cloudData.deliveries && cloudData.deliveries[activeGroup]) || [];

  if (list.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-12 text-center bg-slate-900/60 rounded-3xl border border-dashed border-slate-800 text-slate-500 text-xs">
        <i class="fa-solid fa-truck-ramp-box text-3xl mb-2 block text-slate-600"></i>
        등록된 반값택배 주소가 없습니다.
      </div>
    `;
    return;
  }

  container.innerHTML = list.map((d, idx) => {
    const isShipped = Boolean(d.shipped);
    const badgeColor = {
      'GS반택': 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      'CU알뜰': 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      '일반택배': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
    }[d.type] || 'bg-slate-800 text-slate-300 border-slate-700';

    const threadsClean = d.threads ? d.threads.replace(/^@/, '') : '';

    return `
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col justify-between space-y-3 transition hover:border-slate-700">
        <div class="space-y-2">
          <div class="flex justify-between items-start">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeColor}">${escapeHTML(d.type || 'GS반택')}</span>
              <button onclick="window.toggleShipped(${idx})" class="text-[10px] font-bold px-2 py-0.5 rounded-full border transition ${
                isShipped 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }">
                ${isShipped ? '<i class="fa-solid fa-check"></i> 발송완료' : '⏳ 발송대기'}
              </button>
            </div>
            <div class="flex items-center gap-1">
              <button onclick="window.openDeliveryModal(${idx})" class="text-slate-500 hover:text-cyan-400 p-1 text-xs"><i class="fa-solid fa-pen"></i></button>
              <button onclick="window.deleteDelivery(${idx})" class="text-slate-500 hover:text-rose-400 p-1 text-xs"><i class="fa-solid fa-trash"></i></button>
            </div>
          </div>

          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <h4 class="text-sm font-bold text-white">${escapeHTML(d.recipient)}</h4>
              ${threadsClean ? `
                <a href="https://www.threads.net/@${escapeHTML(threadsClean)}" target="_blank" rel="noopener noreferrer" class="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 font-mono font-semibold bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20">
                  <i class="fa-brands fa-threads text-[11px]"></i>@${escapeHTML(threadsClean)}
                </a>
              ` : ''}
            </div>
            ${d.phone ? `<p class="text-xs text-slate-400 font-mono mt-0.5">${escapeHTML(d.phone)}</p>` : ''}
          </div>

          <div class="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 space-y-1 font-mono">
            <div class="flex items-center gap-1.5 font-sans font-semibold text-cyan-300">
              <i class="fa-solid fa-store text-slate-500 text-xs"></i>
              <span>${escapeHTML(d.store)}</span>
            </div>
            ${d.memo ? `
              <div class="text-slate-400 font-sans text-[11px] pt-1 border-t border-slate-800/80">
                ${escapeHTML(d.memo)}
              </div>
            ` : ''}
          </div>
        </div>

        <button onclick="window.copyDeliveryAddress(${idx})" class="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 border border-slate-700">
          <i class="fa-regular fa-copy text-cyan-400"></i> 배송 정보 전체 복사
        </button>
      </div>
    `;
  }).join('');
}

export function toggleShipped(idx, currentGroup, onRender) {
  const grp = currentGroup || activeGroup;
  ensureDataStructure();
  if (cloudData.deliveries[grp] && cloudData.deliveries[grp][idx]) {
    cloudData.deliveries[grp][idx].shipped = !cloudData.deliveries[grp][idx].shipped;
    syncData(onRender);
  }
}

export function copyDeliveryAddress(idx, currentGroup) {
  const grp = currentGroup || activeGroup;
  ensureDataStructure();
  const d = cloudData.deliveries[grp]?.[idx];
  if (!d) return;

  const threadsClean = d.threads ? `@${d.threads.replace(/^@/, '')}` : '';
  const text = [
    `[${d.type || 'GS반택'}]`,
    threadsClean ? `계정: ${threadsClean}` : '',
    `받는분: ${d.recipient}`,
    d.phone ? `연락처: ${d.phone}` : '',
    `도착점포: ${d.store}`,
    d.memo ? `품목: ${d.memo}` : ''
  ].filter(Boolean).join('\n');

  navigator.clipboard.writeText(text).then(() => {
    alert(`배송 정보가 클립보드에 복사되었습니다!\n\n${text}`);
  }).catch(() => {
    alert('복사 권한이 거부되었습니다.');
  });
}

export function deleteDelivery(idx, currentGroup, onRender) {
  const grp = currentGroup || activeGroup;
  if (!confirm('이 배송지 정보를 삭제하시겠습니까?')) return;
  cloudData.deliveries[grp].splice(idx, 1);
  syncData(onRender);
}
