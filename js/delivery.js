import { cloudData, syncData, ensureDataStructure } from './firebase.js';
import { escapeHTML } from './security.js';

let activeGroup = 'plave';

export function renderDeliveries(currentGroup) {
  if (currentGroup) activeGroup = currentGroup;
  ensureDataStructure();

  const tbody = document.getElementById('delivery-table-body');
  if (!tbody) return;

  const rawList = (cloudData.deliveries && cloudData.deliveries[activeGroup]) || [];

  if (rawList.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="py-12 text-center text-slate-500 text-xs">
          <i class="fa-solid fa-truck-ramp-box text-3xl mb-2 block text-slate-600"></i>
          등록된 반값택배 배송지 정보가 없습니다.
        </td>
      </tr>
    `;
    return;
  }

  // 🌟 원본 인덱스를 보존한 상태에서 받는분 이름 기준 오름차순(가나다순) 정렬
  const sortedList = rawList
    .map((item, originalIdx) => ({ ...item, originalIdx }))
    .sort((a, b) => (a.recipient || '').localeCompare(b.recipient || '', 'ko'));

  tbody.innerHTML = sortedList.map(d => {
    const isShipped = Boolean(d.shipped);
    const badgeColor = {
      'GS반택': 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
      'CU알뜰': 'bg-purple-500/10 text-purple-300 border-purple-500/30',
      '일반택배': 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
    }[d.type] || 'bg-slate-800 text-slate-300 border-slate-700';

    const threadsClean = d.threads ? d.threads.replace(/^@/, '') : '';

    return `
      <tr class="hover:bg-slate-800/40 transition">
        <!-- 1. 택배 종류 -->
        <td class="py-2.5 px-3 text-center">
          <span class="text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeColor}">
            ${escapeHTML(d.type || 'GS반택')}
          </span>
        </td>

        <!-- 2. 발송 상태 토글 -->
        <td class="py-2.5 px-3 text-center">
          <button onclick="window.toggleShipped(${d.originalIdx})" class="text-[10px] font-bold px-2 py-0.5 rounded-full border transition ${
            isShipped 
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30' 
              : 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
          }">
            ${isShipped ? '<i class="fa-solid fa-check"></i> 완료' : '⏳ 대기'}
          </button>
        </td>

        <!-- 3. 받는분 (이름 + 스레드) -->
        <td class="py-2.5 px-3">
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="font-bold text-white">${escapeHTML(d.recipient)}</span>
            ${threadsClean ? `
              <a href="https://www.threads.net/@${escapeHTML(threadsClean)}" target="_blank" rel="noopener noreferrer" 
                 class="text-[11px] text-purple-400 hover:text-purple-300 font-mono flex items-center gap-0.5 bg-purple-500/10 px-1.5 py-0.2 rounded border border-purple-500/20">
                <i class="fa-brands fa-threads text-[10px]"></i>@${escapeHTML(threadsClean)}
              </a>
            ` : ''}
          </div>
        </td>

        <!-- 4. 전화번호 -->
        <td class="py-2.5 px-3 font-mono text-slate-300">
          ${escapeHTML(d.phone || '-')}
        </td>

        <!-- 5. 도착 점포명 -->
        <td class="py-2.5 px-3 font-semibold text-cyan-300">
          <div class="flex items-center gap-1">
            <i class="fa-solid fa-store text-slate-500 text-[10px]"></i>
            <span>${escapeHTML(d.store)}</span>
          </div>
        </td>

        <!-- 6. 품목 / 메모 -->
        <td class="py-2.5 px-3 text-slate-400 max-w-[200px] truncate" title="${escapeHTML(d.memo || '')}">
          ${escapeHTML(d.memo || '-')}
        </td>

        <!-- 7. 복사 버튼 -->
        <td class="py-2.5 px-3 text-center">
          <button onclick="window.copyDeliveryAddress(${d.originalIdx})" class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition border border-slate-700 flex items-center justify-center gap-1 mx-auto" title="배송정보 전체 복사">
            <i class="fa-regular fa-copy text-cyan-400"></i> 복사
          </button>
        </td>

        <!-- 8. 수정/삭제 -->
        <td class="py-2.5 px-3 text-center">
          <div class="flex items-center justify-center gap-1">
            <button onclick="window.openDeliveryModal(${d.originalIdx})" class="text-slate-500 hover:text-cyan-400 p-1 text-xs"><i class="fa-solid fa-pen"></i></button>
            <button onclick="window.deleteDelivery(${d.originalIdx})" class="text-slate-500 hover:text-rose-400 p-1 text-xs"><i class="fa-solid fa-trash"></i></button>
          </div>
        </td>
      </tr>
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
    alert(`배송 정보가 복사되었습니다!\n\n${text}`);
  }).catch(() => {
    alert('클립보드 복사 권한이 거부되었습니다.');
  });
}

export function deleteDelivery(idx, currentGroup, onRender) {
  const grp = currentGroup || activeGroup;
  if (!confirm('이 배송지 정보를 삭제하시겠습니까?')) return;
  cloudData.deliveries[grp].splice(idx, 1);
  syncData(onRender);
}
