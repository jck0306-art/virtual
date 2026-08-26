import { cloudData, syncData } from './firebase.js';

export function renderPhotocards(currentGroup) {
  const pcs = (cloudData.photocards && cloudData.photocards[currentGroup]) || [];
  const pcGrid = document.getElementById('photocard-grid');
  if (!pcGrid) return;

  if (pcs.length === 0) {
    pcGrid.innerHTML = `<p class="text-xs text-slate-500 py-10 col-span-5 text-center">등록된 포토카드가 없습니다.</p>`;
  } else {
    pcGrid.innerHTML = pcs.map((pc, idx) => `
      <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg flex flex-col justify-between relative group">
        <div class="absolute top-2 right-2 z-10 flex gap-1 bg-slate-950/70 p-1 rounded-lg backdrop-blur-sm">
          <button onclick="window.openPhotocardModal(${idx})" class="text-slate-400 hover:text-indigo-400 text-xs p-1"><i class="fa-solid fa-pen"></i></button>
          <button onclick="window.deletePhotocard(${idx})" class="text-slate-400 hover:text-rose-400 text-xs p-1"><i class="fa-solid fa-trash"></i></button>
        </div>
        <div>
          ${pc.img ? `
            <div class="w-full aspect-[2/3] bg-slate-950 overflow-hidden relative">
              <img src="${pc.img}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
            </div>
          ` : `
            <div class="w-full aspect-[2/3] bg-slate-950/70 flex flex-col items-center justify-center text-slate-600 gap-1 border-b border-slate-800">
              <i class="fa-solid fa-id-badge text-3xl"></i>
              <span class="text-[10px] text-slate-500">사진 없음</span>
            </div>
          `}
          <div class="p-3 text-center">
            <h5 class="text-xs font-bold text-white">${pc.member}</h5>
            <p class="text-[11px] text-slate-400 mt-0.5 line-clamp-1">${pc.version}</p>
          </div>
        </div>
        <div class="p-2 pt-0">
          <button onclick="window.togglePcCollected(${idx})" class="w-full py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
            pc.collected 
              ? 'bg-pink-600 hover:bg-pink-500 text-white border-pink-500 shadow-md shadow-pink-600/20' 
              : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border-slate-700'
          }">
            <i class="fa-solid ${pc.collected ? 'fa-check' : 'fa-plus'} text-[10px]"></i>
            <span>${pc.collected ? '보유' : '미보유'}</span>
          </button>
        </div>
      </div>
    `).join('');
  }
}

export function openPhotocardModal(idx, currentGroup) {
  document.getElementById('edit-pc-idx').value = idx;
  document.getElementById('pc-file-input').value = '';
  if (idx >= 0) {
    const item = cloudData.photocards[currentGroup][idx];
    document.getElementById('pc-modal-title').innerText = '포토카드 정보 수정';
    document.getElementById('pc-member').value = item.member;
    document.getElementById('pc-version').value = item.version;
    document.getElementById('pc-collected').value = item.collected ? 'true' : 'false';
    document.getElementById('pc-img-base64').value = item.img || '';
    if (item.img) {
      document.getElementById('pc-img-preview').src = item.img;
      document.getElementById('pc-preview-wrap').classList.remove('hidden');
    } else {
      document.getElementById('pc-preview-wrap').classList.add('hidden');
    }
  } else {
    document.getElementById('pc-modal-title').innerText = '새 포토카드 등록';
    document.getElementById('pc-member').value = '';
    document.getElementById('pc-version').value = '';
    document.getElementById('pc-collected').value = 'false';
    document.getElementById('pc-img-base64').value = '';
    document.getElementById('pc-preview-wrap').classList.add('hidden');
  }
  document.getElementById('photocard-modal').classList.replace('hidden', 'flex');
}

export function savePhotocard(currentGroup, onRender) {
  const idx = parseInt(document.getElementById('edit-pc-idx').value);
  const member = document.getElementById('pc-member').value.trim();
  const version = document.getElementById('pc-version').value.trim();
  const img = document.getElementById('pc-img-base64').value;
  const collected = document.getElementById('pc-collected').value === 'true';

  if (!member || !version) return alert('멤버와 포카 버전을 입력해주세요.');
  if (!cloudData.photocards[currentGroup]) cloudData.photocards[currentGroup] = [];

  const payload = { member, version, img, collected };
  if (idx >= 0) cloudData.photocards[currentGroup][idx] = payload;
  else cloudData.photocards[currentGroup].unshift(payload);

  window.closeModals();
  syncData(onRender);
}

export function togglePcCollected(idx, currentGroup, onRender) {
  cloudData.photocards[currentGroup][idx].collected = !cloudData.photocards[currentGroup][idx].collected;
  syncData(onRender);
}

export function deletePhotocard(idx, currentGroup, onRender) {
  if (!confirm('이 포토카드를 삭제하시겠습니까?')) return;
  cloudData.photocards[currentGroup].splice(idx, 1);
  syncData(onRender);
}