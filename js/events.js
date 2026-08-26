import { cloudData, syncData } from './firebase.js';

export function renderEvents(currentGroup) {
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
                <img src="${ev.img}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
              </div>
            ` : `
              <div class="w-full h-24 bg-slate-950/60 flex items-center justify-center border-b border-slate-800 text-purple-400/60">
                <i class="fa-solid fa-gift text-2xl"></i>
              </div>
            `}
            <div class="p-4 space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  나눔 수량: ${ev.total || 0}개
                </span>
                <span class="text-[11px] text-slate-400">
                  당첨 <strong class="text-pink-400">${winners.length}</strong> / 신청 ${applicants.length}명
                </span>
              </div>
              <h4 class="text-sm font-bold text-white">${ev.name}</h4>
              <p class="text-xs text-slate-400 leading-relaxed bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/80">${ev.memo || '메모 없음'}</p>

              <!-- 신청자 및 당첨자 관리 박스 -->
              <div class="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-2">
                <div class="flex justify-between items-center text-xs font-bold">
                  <span class="text-slate-300">신청자 / 당첨자 명단</span>
                  <button onclick="window.openApplicantAddPrompt(${idx})" class="text-[10px] px-2 py-0.5 rounded bg-purple-600 hover:bg-purple-500 text-white font-bold transition">
                    + 신청자 추가
                  </button>
                </div>
                
                <div class="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                  ${applicants.length === 0 ? `
                    <p class="text-[11px] text-slate-600 py-2 text-center">신청자가 없습니다.</p>
                  ` : applicants.map((app, appIdx) => `
                    <div class="flex items-center justify-between text-xs p-1.5 rounded-lg bg-slate-900 border ${app.isWinner ? 'border-pink-500/40 bg-pink-950/20' : 'border-slate-800'}">
                      <div class="flex items-center gap-2">
                        <button onclick="window.toggleWinner(${idx}, ${appIdx})" class="text-[10px] px-1.5 py-0.5 rounded font-bold transition ${app.isWinner ? 'bg-pink-600 text-white' : 'bg-slate-800 text-slate-500 hover:text-slate-300'}">
                          ${app.isWinner ? '★ 당첨' : '미선정'}
                        </button>
                        <span class="font-semibold ${app.isWinner ? 'text-pink-300' : 'text-slate-300'}">${app.name}</span>
                        ${app.tag ? `<span class="text-[10px] text-slate-500">(${app.tag})</span>` : ''}
                      </div>
                      <button onclick="window.deleteApplicant(${idx}, ${appIdx})" class="text-slate-600 hover:text-rose-400 p-0.5">
                        <i class="fa-solid fa-xmark text-xs"></i>
                      </button>
                    </div>
                  `).join('')}
                </div>
              </div>

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
  const memo = document.getElementById('event-memo').value.trim();
  const img = document.getElementById('event-img-base64').value;

  if (!name) return alert('이벤트/나눔 이름을 입력해주세요.');
  if (!cloudData.events[currentGroup]) cloudData.events[currentGroup] = [];

  if (idx >= 0) {
    const existing = cloudData.events[currentGroup][idx];
    cloudData.events[currentGroup][idx] = { 
      ...existing, 
      name, 
      total, 
      memo, 
      img 
    };
  } else {
    cloudData.events[currentGroup].unshift({ 
      name, 
      total, 
      memo, 
      img, 
      applicants: [] 
    });
  }

  window.closeModals();
  syncData(onRender);
}

export function openApplicantAddPrompt(eventIdx, currentGroup, onRender) {
  const name = prompt('신청자 이름(또는 닉네임)을 입력하세요:');
  if (!name || !name.trim()) return;
  const tag = prompt('신청자 연락처나 폼 번호/X(트위터) 아이디 (선택):') || '';

  const ev = cloudData.events[currentGroup][eventIdx];
  if (!ev.applicants) ev.applicants = [];
  ev.applicants.push({ name: name.trim(), tag: tag.trim(), isWinner: false });

  syncData(onRender);
}

export function toggleWinner(eventIdx, appIdx, currentGroup, onRender) {
  const ev = cloudData.events[currentGroup][eventIdx];
  ev.applicants[appIdx].isWinner = !ev.applicants[appIdx].isWinner;
  syncData(onRender);
}

export function deleteApplicant(eventIdx, appIdx, currentGroup, onRender) {
  if (!confirm('이 신청자를 명단에서 삭제하시겠습니까?')) return;
  cloudData.events[currentGroup][eventIdx].applicants.splice(appIdx, 1);
  syncData(onRender);
}

export function deleteEvent(idx, currentGroup, onRender) {
  if (!confirm('이 나눔/이벤트를 삭제하시겠습니까?')) return;
  cloudData.events[currentGroup].splice(idx, 1);
  syncData(onRender);
}
