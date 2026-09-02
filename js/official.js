import { cloudData, syncData, ensureDataStructure } from './firebase.js';
import { escapeHTML, sanitizeURL } from './security.js';

let activeGroup = 'plave';
let calCurrentDate = new Date(); // 달력 기준 날짜

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

export function changeCalendarMonth(delta) {
  calCurrentDate.setMonth(calCurrentDate.getMonth() + delta);
  renderOfficialEvents(activeGroup);
}

export function goCalendarToday() {
  calCurrentDate = new Date();
  renderOfficialEvents(activeGroup);
}

// 📅 달력 그리드 렌더링
function renderCalendarGrid(events) {
  const gridEl = document.getElementById('calendar-days-grid');
  const titleEl = document.getElementById('cal-month-title');
  if (!gridEl || !titleEl) return;

  const year = calCurrentDate.getFullYear();
  const month = calCurrentDate.getMonth();
  titleEl.innerText = `${year}년 ${month + 1}월`;

  const firstDay = new Date(year, month, 1).getDay(); // 1일의 요일 (0: 일요일)
  const lastDate = new Date(year, month + 1, 0).getDate(); // 이번 달 마지막 일자
  const prevLastDate = new Date(year, month, 0).getDate(); // 지난 달 마지막 일자

  const todayStr = new Date().toISOString().slice(0, 10);
  let html = '';

  // 1. 이전 달 날짜 칸 (비활성화 느낌)
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = prevLastDate - i;
    html += `
      <div class="min-h-[75px] md:min-h-[90px] p-1.5 rounded-xl bg-slate-950/40 border border-slate-900/60 opacity-30 select-none">
        <span class="text-[10px] md:text-xs font-mono text-slate-500">${d}</span>
      </div>
    `;
  }

  // 2. 이번 달 날짜 칸
  for (let day = 1; day <= lastDate; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isToday = dateStr === todayStr;

    // 해당 날짜에 걸쳐 있는 이벤트 검색 (date <= dateStr <= endDate)
    const dayEvents = events.filter(ev => {
      if (!ev.date) return false;
      const start = ev.date;
      const end = ev.endDate || ev.date;
      return dateStr >= start && dateStr <= end;
    });

    html += `
      <div onclick="window.openOfficialModalWithDate('${dateStr}')" 
           class="min-h-[75px] md:min-h-[90px] p-1.5 rounded-xl border transition flex flex-col justify-between cursor-pointer group ${
             isToday 
               ? 'bg-slate-900/90 border-pink-500/60 shadow-md shadow-pink-500/10' 
               : 'bg-slate-950/80 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/50'
           }">
        <div class="flex items-center justify-between">
          <span class="text-[11px] md:text-xs font-mono font-bold ${
            isToday ? 'px-1.5 py-0.2 rounded-md bg-pink-600 text-white' : 'text-slate-300 group-hover:text-pink-400'
          }">
            ${day}
          </span>
          ${dayEvents.length > 0 ? `
            <span class="text-[9px] font-mono text-pink-400 font-bold hidden md:inline">
              ${dayEvents.length}개
            </span>
          ` : ''}
        </div>

        <!-- 날짜 칸 내 일정 태그 목록 -->
        <div class="space-y-1 overflow-hidden my-1">
          ${dayEvents.slice(0, 2).map(ev => {
            const badgeColor = {
              '콘서트/팬미팅': 'bg-pink-500/20 text-pink-300 border-pink-500/30',
              '팝업/전시': 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
              '콜라보/카페': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
              '티켓팅/굿즈': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
            }[ev.type] || 'bg-slate-800 text-slate-300 border-slate-700';

            return `
              <div class="truncate text-[9px] md:text-[10px] px-1.5 py-0.5 rounded border ${badgeColor} font-semibold" title="${escapeHTML(ev.title)}">
                ${escapeHTML(ev.title)}
              </div>
            `;
          }).join('')}
          ${dayEvents.length > 2 ? `
            <div class="text-[9px] text-slate-500 font-mono pl-1">+${dayEvents.length - 2} more</div>
          ` : ''}
        </div>
      </div>
    `;
  }

  // 3. 다음 달 날짜 칸 (총 35 or 42칸 맞추기)
  const totalSlots = Math.ceil((firstDay + lastDate) / 7) * 7;
  const remainingSlots = totalSlots - (firstDay + lastDate);
  for (let j = 1; j <= remainingSlots; j++) {
    html += `
      <div class="min-h-[75px] md:min-h-[90px] p-1.5 rounded-xl bg-slate-950/40 border border-slate-900/60 opacity-30 select-none">
        <span class="text-[10px] md:text-xs font-mono text-slate-500">${j}</span>
      </div>
    `;
  }

  gridEl.innerHTML = html;
}

// 📌 공식 스케줄 전체 렌더링 (달력 + 하단 카드 목록)
export function renderOfficialEvents(currentGroup) {
  if (currentGroup) activeGroup = currentGroup;
  ensureDataStructure();
  const events = (cloudData.officialEvents && cloudData.officialEvents[activeGroup]) || [];

  // 1. 달력 렌더링
  renderCalendarGrid(events);

  // 2. 하단 상세 카드 목록 렌더링
  const container = document.getElementById('official-event-grid');
  const filterType = document.getElementById('official-filter-type')?.value || 'all';
  if (!container) return;

  const filtered = events
    .map((ev, idx) => ({ ...ev, originalIdx: idx }))
    .filter(ev => filterType === 'all' || ev.type === filterType)
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''));

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-10 text-center bg-slate-900/60 rounded-2xl border border-dashed border-slate-800 text-slate-500 text-xs">
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

// 📌 모달 열기 (기본 및 특정 일자 클릭)
export function openOfficialModal(idx = -1, currentGroup) {
  if (currentGroup) activeGroup = currentGroup;
  document.getElementById('edit-official-idx').value = idx;
  if (idx >= 0) {
    const item = cloudData.officialEvents[activeGroup][idx];
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
    document.getElementById('off-date').value = new Date().toISOString().slice(0, 10);
    document.getElementById('off-end-date').value = '';
    document.getElementById('off-location').value = '';
    document.getElementById('off-url').value = '';
    document.getElementById('off-memo').value = '';
  }
  document.getElementById('official-modal').classList.replace('hidden', 'flex');
}

export function openOfficialModalWithDate(dateStr) {
  openOfficialModal(-1, activeGroup);
  document.getElementById('off-date').value = dateStr;
}

export function saveOfficialEvent(currentGroup, onRender) {
  const grp = currentGroup || activeGroup;
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
  if (!cloudData.officialEvents) cloudData.officialEvents = { plave: [], wego6: [] };
  if (!cloudData.officialEvents[grp]) cloudData.officialEvents[grp] = [];

  const payload = { title, type, status, date, endDate, location, url, memo };
  if (idx >= 0) cloudData.officialEvents[grp][idx] = payload;
  else cloudData.officialEvents[grp].unshift(payload);

  window.closeModals();
  syncData(onRender);
}

export function deleteOfficialEvent(idx, currentGroup, onRender) {
  const grp = currentGroup || activeGroup;
  if (!confirm('이 일정을 삭제하시겠습니까?')) return;
  cloudData.officialEvents[grp].splice(idx, 1);
  syncData(onRender);
}
