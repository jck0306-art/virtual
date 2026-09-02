import { cloudData, syncData, ensureDataStructure } from './firebase.js';
import { escapeHTML, sanitizeURL } from './security.js';

export function calculateDDay(dateString) {
  if (!dateString) return '-';
  const target = new Date(dateString + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = target - today;
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'D-Day';
  return days > 0 ? `D-${days}` : `D+${Math.abs(days)}`;
}

export function renderOfficialEvents(currentGroup) {
  ensureDataStructure();
  const events = (cloudData.officialEvents && cloudData.officialEvents[currentGroup]) || [];
  const container = document.getElementById('official-event-grid');
  const filterType = document.getElementById('official-filter-type')?.value || 'all';

  if (!container) return;

  const filtered = events
    .map((ev, idx) => ({ ...ev, originalIdx: idx }))
    .filter(ev => filterType === 'all' || ev.type === filterType)
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''));

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-12 text-center bg-slate-900/60 rounded-2xl border border-dashed border-slate-800 text-slate-500 text-xs">
        <i class="fa-solid fa-calendar-xmark text-2xl mb-2 block text-slate-600"></i>
        등록된 공식 스케줄 및 이벤트가 없습니다.
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(ev => {
    const dday = calculateDDay(ev.date);
    const isPast = dday.startsWith('D+');

    const statusBadge = {
      '참여확정': 'bg-pink-500/20 text-pink-300 border-pink-500/40',
      '예정': 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
      '고민중': 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      '종료': 'bg-slate-800 text-slate-400 border-slate-700'
    }[ev.status] || 'bg-slate-800 text-slate-300 border-slate-700';

    const safeUrl = sanitizeURL(ev.url);

    return `
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg hover:border-slate-700 transition flex flex-col justify-between space-y-3">
        <div class="space-y-2.5">
          <div class="flex justify-between items-start">
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusBadge}">${escapeHTML(ev.status || '예정')}</span>
            <div class="flex items-center gap-1.5">
              <span class="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-950 border border-slate-800 ${isPast ? 'text-slate-500' : 'text-pink-400'}">${dday}</span>
              <button onclick="window.openOfficialModal(${ev.originalIdx})" class="text-slate-500 hover:text-indigo-400 p-1 text-xs"><i class="fa-solid fa-pen"></i></button>
              <button onclick="window.deleteOfficialEvent(${ev.originalIdx})" class="text-slate-500 hover:text-rose-400 p-1 text-xs"><i class="fa-solid fa-trash"></i></button>
            </div>
          </div>

          <div>
            <span class="text-[10px] text-pink-400 font-bold block mb-0.5">${escapeHTML(ev.type || '이벤트')}</span>
            <h4 class="text-sm font-bold text-white leading-snug">${escapeHTML(ev.title)}</h4>
          </div>

          <div class="text-xs space-y-1 text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 font-mono">
            <div class="flex items-center gap-1.5">
              <i class="fa-regular fa-calendar text-slate-500 text-[11px]"></i>
              <span>${escapeHTML(ev.date)}${ev.endDate ? ` ~ ${escapeHTML(ev.endDate)}` : ''}</span>
            </div>
            ${ev.location ? `
              <div class="flex items-center gap-1.5 font-sans text-slate-400">
                <i class="fa-solid fa-location-dot text-slate-500 text-[11px]"></i>
                <span class="truncate">${escapeHTML(ev.location)}</span>
              </div>
            ` : ''}
          </div>

          ${ev.memo ? `
            <p class="text-xs text-slate-400 bg-slate-950/40 p-2 rounded-lg border border-slate-800/80 leading-relaxed">${escapeHTML(ev.memo)}</p>
          ` : ''}
        </div>

        ${safeUrl ? `
          <div class="pt-2 border-t border-slate-800/80">
            <a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="text-xs text-pink-400 hover:text-pink-300 flex items-center gap-1.5 font-semibold">
              <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i> 공식 공지/예매 바로가기
            </a>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
}

export function openOfficialModal(idx = -1, currentGroup) {
  document.getElementById('edit-official-idx').value = idx;
  if (idx >= 0) {
    const item = cloudData.officialEvents[currentGroup][idx];
    document.getElementById('official-modal-title').innerText = '공식 스케줄 수정';
    document.getElementById('off-title').value = item.title || '';
    document.getElementById('off-type').value = item.type || '콘서트/팬미팅';
    document.getElementById('off-status').value = item.status || '예정';
    document.getElementById('off-date').value = item.date || '';
    document.getElementById('off-end-date').value = item.endDate || '';
    document.getElementById('off-location').value = item.location || '';
    document.getElementById('off-url').value = item.url || '';
    document.getElementById('off-memo').value = item.memo || '';
  } else {
    document.getElementById('official-modal-title').innerText = '새 공식 스케줄 등록';
    document.getElementById('off-title').value = '';
    document.getElementById('off-type').value = '콘서트/팬미팅';
    document.getElementById('off-status').value = '예정';
    document.getElementById('off-date').value = '';
    document.getElementById('off-end-date').value = '';
    document.getElementById('off-location').value = '';
    document.getElementById('off-url').value = '';
    document.getElementById('off-memo').value = '';
  }
  document.getElementById('official-modal').classList.replace('hidden', 'flex');
}

export function saveOfficialEvent(currentGroup, onRender) {
  const idx = parseInt(document.getElementById('edit-official-idx').value);
  const title = document.getElementById('off-title').value.trim();
  const type = document.getElementById('off-type').value;
  const status = document.getElementById('off-status').value;
  const date = document.getElementById('off-date').value;
  const endDate = document.getElementById('off-end-date').value;
  const location = document.getElementById('off-location').value.trim();
  const url = document.getElementById('off-url').value.trim();
  const memo = document.getElementById('off-memo').value.trim();

  if (!title || !date) return alert('명칭과 시작 날짜는 필수입니다.');
  if (!cloudData.officialEvents[currentGroup]) cloudData.officialEvents[currentGroup] = [];

  const payload = { title, type, status, date, endDate, location, url, memo };
  if (idx >= 0) cloudData.officialEvents[currentGroup][idx] = payload;
  else cloudData.officialEvents[currentGroup].unshift(payload);

  window.closeModals();
  syncData(onRender);
}

export function deleteOfficialEvent(idx, currentGroup, onRender) {
  if (!confirm('이 일정을 삭제하시겠습니까?')) return;
  cloudData.officialEvents[currentGroup].splice(idx, 1);
  syncData(onRender);
}
