import { cloudData, syncData } from './firebase.js';

export function renderProfile(currentGroup) {
  const g = cloudData.groups[currentGroup];
  const grid = document.getElementById('member-grid');
  if (!grid) return;

  grid.innerHTML = g.members.map((m, idx) => `
    <div class="relative bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 text-center hover:border-slate-600 transition shadow-lg flex flex-col justify-between items-center group">
      <button onclick="window.openMemberModal(${idx})" class="absolute top-2.5 right-2.5 text-slate-500 hover:text-indigo-400 p-1 rounded transition opacity-60 group-hover:opacity-100" title="수정">
        <i class="fa-solid fa-pen text-xs"></i>
      </button>
      <div class="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-2 mt-1 shadow-inner" style="background: ${m.color}22; border: 1px solid ${m.color}55;">
        ${m.emoji || '✨'}
      </div>
      <div>
        <h4 class="font-bold text-sm text-white">${m.name}</h4>
        <p class="text-[11px] text-slate-400 mt-0.5 line-clamp-1">${m.role}</p>
      </div>
      <div class="mt-2.5 pt-2 border-t border-slate-800 w-full text-[10px] text-slate-400">
        생일 <span class="font-bold text-slate-200">${m.bday}</span>
      </div>
    </div>
  `).join('');
}

export function openMemberModal(idx, currentGroup) {
  const mem = cloudData.groups[currentGroup].members[idx];
  document.getElementById('edit-member-idx').value = idx;
  document.getElementById('mem-name').value = mem.name;
  document.getElementById('mem-role').value = mem.role;
  document.getElementById('mem-bday').value = mem.bday;
  document.getElementById('mem-emoji').value = mem.emoji || '✨';
  document.getElementById('mem-color').value = mem.color || '#4B6BFB';
  document.getElementById('member-modal').classList.replace('hidden', 'flex');
}

export function saveMember(currentGroup, onRender) {
  const idx = document.getElementById('edit-member-idx').value;
  const mem = cloudData.groups[currentGroup].members[idx];
  mem.name = document.getElementById('mem-name').value.trim();
  mem.role = document.getElementById('mem-role').value.trim();
  mem.bday = document.getElementById('mem-bday').value.trim();
  mem.emoji = document.getElementById('mem-emoji').value.trim();
  mem.color = document.getElementById('mem-color').value.trim();
  
  window.closeModals();
  syncData(onRender);
}