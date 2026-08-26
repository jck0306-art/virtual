import { cloudData, syncData } from './firebase.js';

export function renderEvents(currentGroup) {
  const evts = (cloudData.events && cloudData.events[currentGroup]) || [];
  const eventGrid = document.getElementById('event-grid');
  if (!eventGrid) return;

  if (evts.length === 0) {
    eventGrid.innerHTML = `<p class="text-xs text-slate-500 py-10 col-span-3 text-center">등록된 나눔/이벤트가 없습니다.</p>`;
  } else {
    eventGrid.innerHTML = evts.map((ev, idx) => {
      const total = Number(ev.total) || 0;
      const done = Number(ev.done) || 0;
      const percent = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;
      const statusColors = {
        '준비중': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        '진행중': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        '종료': 'bg-slate-800 text-slate-400 border-slate-700'
      };
      return `
        <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg flex flex-col justify-between group">
          <div>
            ${ev.img ? `
              <div class="w-full h-40 bg-slate-950 overflow-hidden relative border-b border-slate-800">
                <img src="${ev.img}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
              </div>
            ` : `
              <div class="w-full h-24 bg-slate-950/60 flex items-center justify-center border-b border-slate-800 text-purple-400/60">
                <i class="fa-solid fa-gift text-2xl"></i>
              </div>
            `}
            <div class="p-4 space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-bold px-2 py-0.5 rounded border ${statusColors[ev.status] || statusColors['준비중']}">${ev.status || '준비중'}</span>
                <span class="text-[11px] text-slate-400"><i class="fa-regular fa-clock mr-1 text-[10px]"></i>${ev.date || '일정 미정'}</span>
              </div>
              <h4 class="text-sm font-bold text-white">${ev.name}</h4>
              
              <div class="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                <div class="flex justify-between text-[11px] font-semibold mb-1">
                  <span class="text-slate-400">배부 현황</span>
                  <span class="text-purple-300 font-bold">${done} / ${total}개 (${percent}%)</span>
                </div>
                <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div class="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-all duration-300" style="width: ${percent}%"></div>
                </div>
                <div class="flex justify-end gap-1.5 mt-2">
                  <button onclick="window.changeEventCount(${idx}, -1)" class="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold">-1</button>
                  <button onclick="window.changeEventCount(${idx}, +1)" class="px-2 py-0.5 rounded bg-purple-600/30 hover:bg-purple-600 text-purple-200 text-[10px] font-bold">+1</button>
                </div>
              </div>

              <p class="text-xs text-slate-400 leading-relaxed bg-slate-950/40 p-2 rounded-lg border border-slate-800/80">${ev.memo || '장소 및 메모 없음'}</p>
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
    document.getElementById('event-modal-title').innerText = '나눔/이벤트 수정';
    document.getElementById('event-name').value = item.name;
    document.getElementById('event-total').value = item.total || '';
    document.getElementById('event-done').value = item.done || 0;
    document.getElementById('event-date').value = item.date || '';
    document.getElementById('event-status').value = item.status || '준비중';
    document.getElementById('event-memo').value = item.memo || '';
    document.getElementById('event-img-base64').value = item.img || '';
    if (item.img) {
      document.getElementById('event-img-preview').src = item.img;
      document.getElementById('event-preview-wrap').classList.remove('hidden');
    } else {
      document.getElementById('event-preview-wrap').classList.add('hidden');
    }
  } else {
    document.getElementById('event-modal-title').innerText = '새 나눔/이벤트 등록';
    document.getElementById('event-name').value = '';
    document.getElementById('event-total').value = '';
    document.getElementById('event-done').value = 0;
    document.getElementById('event-date').value = '';
    document.getElementById('event-status').value = '준비중';
    document.getElementById('event-memo').value = '';
    document.getElementById('event-img-base64').value = '';
    document.getElementById('event-preview-wrap').classList.add('hidden');
  }
  document.getElementById('event-modal').classList.replace('hidden', 'flex');
}

export function saveEvent(currentGroup, onRender) {
  const idx = parseInt(document.getElementById('edit-event-idx').value);
  const name = document.getElementById('event-name').value.trim();
  const total = parseInt(document.getElementById('event-total').value) || 0;
  const done = parseInt(document.getElementById('event-done').value) || 0;
  const date = document.getElementById('event-date').value.trim();
  const status = document.getElementById('event-status').value;
  const memo = document.getElementById('event-memo').value.trim();
  const img = document.getElementById('event-img-base64').value;

  if (!name) return alert('이벤트/나눔 이름을 입력해주세요.');
  if (!cloudData.events[currentGroup]) cloudData.events[currentGroup] = [];

  const payload = { name, total, done, date, status, memo, img };
  if (idx >= 0) cloudData.events[currentGroup][idx] = payload;
  else cloudData.events[currentGroup].unshift(payload);

  window.closeModals();
  syncData(onRender);
}

export function changeEventCount(idx, delta, currentGroup, onRender) {
  const item = cloudData.events[currentGroup][idx];
  const newDone = Math.max(0, (Number(item.done) || 0) + delta);
  item.done = newDone;
  if (item.total && newDone >= Number(item.total)) {
    item.status = '종료';
  } else if (newDone > 0 && item.status === '준비중') {
    item.status = '진행중';
  }
  syncData(onRender);
}

export function deleteEvent(idx, currentGroup, onRender) {
  if (!confirm('이 나눔/이벤트를 삭제하시겠습니까?')) return;
  cloudData.events[currentGroup].splice(idx, 1);
  syncData(onRender);
}