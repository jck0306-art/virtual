import { cloudData, syncData, ensureDataStructure } from './firebase.js';
import { escapeHTML, sanitizeHandle } from './security.js';

let currentManagingEventIdx = -1;
let currentAppFilter = 'all';

export function renderEvents(currentGroup) {
  ensureDataStructure();
  const evts = (cloudData.events && cloudData.events[currentGroup]) || [];
  const eventGrid = document.getElementById('event-grid');
  if (!eventGrid) return;

  if (evts.length === 0) {
    eventGrid.innerHTML = `<p class="text-xs text-slate-500 py-10 col-span-3 text-center">등록된 나눔/이벤트가 없습니다.</p>`;
  } else {
    eventGrid.innerHTML = evts.map((ev, idx) => {
      const applicants = ev.applicants || [];
      const winners = applicants.filter(a => a.isWinner);
      
      return `
        <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg flex flex-col justify-between group">
          <div>
            ${ev.img ? `
              <div class="w-full h-40 bg-slate-950 overflow-hidden relative border-b border-slate-800">
                <img src="${escapeHTML(ev.img)}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300" alt="이벤트 이미지" />
              </div>
            ` : `
              <div class="w-full h-24 bg-slate-950/60 flex items-center justify-center border-b border-slate-800 text-purple-400/60">
                <i class="fa-solid fa-gift text-2xl"></i>
              </div>
            `}
            <div class="p-4 space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  나눔 총 ${Number(ev.total) || 0}개
                </span>
                <span class="text-xs text-slate-400">
                  당첨 <strong class="text-pink-400 font-bold">${winners.length}</strong> / 신청 <strong class="text-slate-200">${applicants.length}</strong>명
                </span>
              </div>
              
              <h4 class="text-base font-bold text-white">${escapeHTML(ev.name)}</h4>
              <p class="text-xs text-slate-400 leading-relaxed bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/80">${escapeHTML(ev.memo || '메모 없음')}</p>

              <button onclick="window.openApplicantManageModal(${idx})" class="w-full py-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600 border border-purple-500/40 hover:text-white text-purple-300 text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm">
                <i class="fa-brands fa-threads text-sm"></i>
                <span>스레드 신청자 & 당첨자 관리 (${applicants.length}명)</span>
              </button>
            </div>
          </div>
          <div class="px-4 pb-3 pt-1 border-t border-slate-800/60 flex justify-end gap-2 text-xs">
            <button onclick="window.openEventModal(${idx})" class="text-slate-400 hover:text-indigo-400 flex items-center gap-1"><i class="fa-solid fa-pen text-[10px]"></i> 수정</button>
            <button onclick="window.deleteEvent(${idx})" class="text-slate-500 hover:text-rose-400 flex items-center gap-1"><i class="fa-solid fa-trash text-[10px]"></i> 삭제</button>
          </div>
        </div>
      `;
    }).join('');
  }
}

export function openEventModal(idx, currentGroup) {
  document.getElementById('edit-event-idx').value = idx;
  document.getElementById('event-file-input').value = '';
  if (idx >= 0) {
    const item = cloudData.events[currentGroup][idx];
    document.getElementById('event-modal-title').innerText = '나눔 이벤트 수정';
    document.getElementById('event-name').value = item.name || '';
    document.getElementById('event-total').value = item.total || '';
    document.getElementById('event-memo').value = item.memo || '';
    document.getElementById('event-img-base64').value = item.img || '';
    if (item.img) {
      document.getElementById('event-img-preview').src = item.img;
      document.getElementById('event-preview-wrap').classList.remove('hidden');
    } else {
      document.getElementById('event-preview-wrap').classList.add('hidden');
    }
  } else {
    document.getElementById('event-modal-title').innerText = '새 나눔 이벤트 등록';
    document.getElementById('event-name').value = '';
    document.getElementById('event-total').value = '';
    document.getElementById('event-memo').value = '';
    document.getElementById('event-img-base64').value = '';
    document.getElementById('event-preview-wrap').classList.add('hidden');
  }
  document.getElementById('event-modal').classList.replace('hidden', 'flex');
}

export function saveEvent(currentGroup, onRender) {
  const idx = parseInt(document.getElementById('edit-event-idx').value);
  const name = document.getElementById('event-name').value.trim();
  const total = document.getElementById('event-total').value;
  const memo = document.getElementById('event-memo').value.trim();
  const img = document.getElementById('event-img-base64').value;

  if (!name) return alert('이벤트 이름을 입력해주세요.');
  if (!cloudData.events) cloudData.events = { plave: [], wego6: [] };
  if (!cloudData.events[currentGroup]) cloudData.events[currentGroup] = [];

  const oldApplicants = (idx >= 0 && cloudData.events[currentGroup][idx]) ? cloudData.events[currentGroup][idx].applicants : [];
  const payload = { name, total, memo, img, applicants: oldApplicants || [] };

  if (idx >= 0) cloudData.events[currentGroup][idx] = payload;
  else cloudData.events[currentGroup].unshift(payload);

  window.closeModals();
  syncData(onRender);
}

export function openApplicantManageModal(eventIdx, currentGroup) {
  currentManagingEventIdx = eventIdx;
  const ev = cloudData.events[currentGroup][eventIdx];
  if (!ev.applicants) ev.applicants = [];

  const titleEl = document.getElementById('app-modal-event-name');
  if (titleEl) titleEl.innerText = ev.name;
  
  renderApplicantListTable(currentGroup);
  document.getElementById('applicant-manage-modal').classList.replace('hidden', 'flex');
}

export function renderApplicantListTable(currentGroup) {
  if (currentManagingEventIdx < 0 || !cloudData.events[currentGroup] || !cloudData.events[currentGroup][currentManagingEventIdx]) return;

  const ev = cloudData.events[currentGroup][currentManagingEventIdx];
  const listEl = document.getElementById('app-table-body');
  const searchKeyword = (document.getElementById('app-search-input')?.value || '').trim().toLowerCase();
  
  let apps = ev.applicants || [];
  const winnersCount = apps.filter(a => a.isWinner).length;
  
  const statsEl = document.getElementById('app-stats-summary');
  if (statsEl) {
    statsEl.innerHTML = `신청 총 <strong class="text-white">${apps.length}</strong>명 · 당첨 <strong class="text-pink-400 font-bold">${winnersCount}</strong>명`;
  }

  let filtered = apps.map((a, originalIdx) => ({ ...a, originalIdx }));
  if (currentAppFilter === 'winner') {
    filtered = filtered.filter(a => a.isWinner);
  }
  if (searchKeyword) {
    filtered = filtered.filter(a => a.handle && a.handle.toLowerCase().includes(searchKeyword));
  }

  if (!listEl) return;

  if (filtered.length === 0) {
    listEl.innerHTML = `<tr><td colspan="3" class="py-8 text-center text-xs text-slate-500">등록된 스레드 신청자가 없습니다.</td></tr>`;
    return;
  }

  listEl.innerHTML = filtered.map((a, i) => {
    const rawClean = a.handle.replace(/[^a-zA-Z0-9._]/g, '');
    return `
      <tr class="border-b border-slate-800/60 hover:bg-slate-800/40 text-xs transition">
        <td class="py-2.5 px-3 text-slate-500 text-center w-12">${i + 1}</td>
        <td class="py-2.5 px-3 font-semibold ${a.isWinner ? 'text-pink-300 font-bold' : 'text-slate-200'}">
          <a href="https://www.threads.net/@${encodeURIComponent(rawClean)}" target="_blank" rel="noopener noreferrer" class="hover:underline flex items-center gap-1.5 inline-flex">
            <i class="fa-brands fa-threads text-[11px] text-slate-400"></i>
            <span>${escapeHTML(a.handle)}</span>
          </a>
        </td>
        <td class="py-2.5 px-3 text-right space-x-1.5 w-32">
          <button onclick="window.toggleWinnerFromModal(${a.originalIdx})" class="px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
            a.isWinner ? 'bg-pink-600 text-white shadow-sm' : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700'
          }">
            ${a.isWinner ? '★ 당첨' : '선정'}
          </button>
          <button onclick="window.deleteApplicantFromModal(${a.originalIdx})" class="p-1 text-slate-500 hover:text-rose-400 transition">
            <i class="fa-solid fa-trash text-[11px]"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

export function setAppFilter(filterType, currentGroup) {
  currentAppFilter = filterType;
  const btnAll = document.getElementById('btn-filter-all');
  const btnWin = document.getElementById('btn-filter-win');
  if (filterType === 'all') {
    if (btnAll) btnAll.className = "px-3 py-1 rounded-lg text-xs font-bold bg-slate-700 text-white";
    if (btnWin) btnWin.className = "px-3 py-1 rounded-lg text-xs font-semibold text-slate-400 hover:text-white";
  } else {
    if (btnWin) btnWin.className = "px-3 py-1 rounded-lg text-xs font-bold bg-pink-600 text-white";
    if (btnAll) btnAll.className = "px-3 py-1 rounded-lg text-xs font-semibold text-slate-400 hover:text-white";
  }
  renderApplicantListTable(currentGroup);
}

export function addSingleApplicant(currentGroup, onRender) {
  if (currentManagingEventIdx < 0) return;
  const handleInput = prompt('신청자의 스레드 아이디를 입력하세요:');
  if (!handleInput || !handleInput.trim()) return;

  const handle = sanitizeHandle(handleInput);
  const ev = cloudData.events[currentGroup][currentManagingEventIdx];
  if (!ev.applicants) ev.applicants = [];
  ev.applicants.push({ handle, isWinner: false });

  syncData(() => {
    renderApplicantListTable(currentGroup);
    onRender();
  });
}

export function addBulkApplicants(currentGroup, onRender) {
  if (currentManagingEventIdx < 0) return;
  const rawText = prompt("스레드 아이디 목록을 줄바꿈으로 붙여넣으세요:");
  if (!rawText || !rawText.trim()) return;

  const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const ev = cloudData.events[currentGroup][currentManagingEventIdx];
  if (!ev.applicants) ev.applicants = [];

  lines.forEach(line => {
    const handle = sanitizeHandle(line);
    if (handle && handle.length > 1) {
      ev.applicants.push({ handle, isWinner: false });
    }
  });

  alert(`총 ${lines.length}개의 스레드 아이디가 등록되었습니다!`);
  syncData(() => {
    renderApplicantListTable(currentGroup);
    onRender();
  });
}

export function toggleWinnerFromModal(originalIdx, currentGroup, onRender) {
  const ev = cloudData.events[currentGroup][currentManagingEventIdx];
  ev.applicants[originalIdx].isWinner = !ev.applicants[originalIdx].isWinner;
  syncData(() => {
    renderApplicantListTable(currentGroup);
    onRender();
  });
}

export function deleteApplicantFromModal(originalIdx, currentGroup, onRender) {
  if (!confirm('이 신청자를 삭제하시겠습니까?')) return;
  const ev = cloudData.events[currentGroup][currentManagingEventIdx];
  ev.applicants.splice(originalIdx, 1);
  syncData(() => {
    renderApplicantListTable(currentGroup);
    onRender();
  });
}

export function drawRandomWinners(currentGroup, onRender) {
  const ev = cloudData.events[currentGroup][currentManagingEventIdx];
  const apps = ev.applicants || [];
  if (apps.length === 0) return alert('추첨할 신청자가 없습니다.');

  const countStr = prompt(`현재 총 ${apps.length}명 중 몇 명을 랜덤 추첨할까요?`, '5');
  const count = parseInt(countStr);
  if (!count || count <= 0) return;

  apps.forEach(a => a.isWinner = false);
  const shuffled = [...apps].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, Math.min(count, apps.length));
  selected.forEach(s => s.isWinner = true);

  alert(`랜덤 추첨 완료! 총 ${selected.length}명이 당첨자로 선정되었습니다.`);
  syncData(() => {
    renderApplicantListTable(currentGroup);
    onRender();
  });
}

export function deleteEvent(idx, currentGroup, onRender) {
  if (!confirm('이 나눔/이벤트를 삭제하시겠습니까?')) return;
  cloudData.events[currentGroup].splice(idx, 1);
  syncData(onRender);
}
