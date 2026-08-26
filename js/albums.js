import { cloudData, syncData } from './firebase.js';

export function renderAlbums(currentGroup) {
  const albums = (cloudData.albums && cloudData.albums[currentGroup]) || [];
  const albumGrid = document.getElementById('album-grid');
  if (!albumGrid) return;

  if (albums.length === 0) {
    albumGrid.innerHTML = `<p class="text-xs text-slate-500 py-10 col-span-3 text-center">등록된 발매 앨범이 없습니다.</p>`;
  } else {
    albumGrid.innerHTML = albums.map((a, idx) => `
      <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg flex flex-col justify-between group">
        <div>
          ${a.img ? `
            <div class="w-full aspect-square bg-slate-950 overflow-hidden relative border-b border-slate-800">
              <img src="${a.img}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
            </div>
          ` : `
            <div class="w-full h-32 bg-slate-950/60 flex items-center justify-center border-b border-slate-800 text-slate-600">
              <i class="fa-solid fa-compact-disc text-3xl"></i>
            </div>
          `}
          <div class="p-4">
            <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">${a.type || '앨범'}</span>
            <h4 class="text-sm font-bold text-white mt-2">${a.title}</h4>
            <p class="text-xs text-slate-400 mt-1"><i class="fa-regular fa-calendar-days text-[10px] mr-1"></i>${a.date || '발매일 미정'}</p>
            <p class="text-xs text-slate-300 mt-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 leading-relaxed">${a.tracks || '수록곡 정보 없음'}</p>
          </div>
        </div>
        <div class="px-4 pb-3 pt-1 border-t border-slate-800/60 flex justify-end gap-2 text-xs">
          <button onclick="window.openAlbumModal(${idx})" class="text-slate-400 hover:text-indigo-400 flex items-center gap-1"><i class="fa-solid fa-pen text-[10px]"></i> 수정</button>
          <button onclick="window.deleteAlbum(${idx})" class="text-slate-500 hover:text-rose-400 flex items-center gap-1"><i class="fa-solid fa-trash text-[10px]"></i> 삭제</button>
        </div>
      </div>
    `).join('');
  }
}

export function openAlbumModal(idx, currentGroup) {
  document.getElementById('edit-album-idx').value = idx;
  document.getElementById('album-file-input').value = '';
  if (idx >= 0) {
    const item = cloudData.albums[currentGroup][idx];
    document.getElementById('album-modal-title').innerText = '앨범 정보 수정';
    document.getElementById('album-title').value = item.title;
    document.getElementById('album-type').value = item.type || '';
    document.getElementById('album-date').value = item.date || '';
    document.getElementById('album-tracks').value = item.tracks || '';
    document.getElementById('album-img-base64').value = item.img || '';
    if (item.img) {
      document.getElementById('album-img-preview').src = item.img;
      document.getElementById('album-preview-wrap').classList.remove('hidden');
    } else {
      document.getElementById('album-preview-wrap').classList.add('hidden');
    }
  } else {
    document.getElementById('album-modal-title').innerText = '새 앨범 등록';
    document.getElementById('album-title').value = '';
    document.getElementById('album-type').value = '';
    document.getElementById('album-date').value = '';
    document.getElementById('album-tracks').value = '';
    document.getElementById('album-img-base64').value = '';
    document.getElementById('album-preview-wrap').classList.add('hidden');
  }
  document.getElementById('album-modal').classList.replace('hidden', 'flex');
}

export function saveAlbum(currentGroup, onRender) {
  const idx = parseInt(document.getElementById('edit-album-idx').value);
  const title = document.getElementById('album-title').value.trim();
  const type = document.getElementById('album-type').value.trim();
  const date = document.getElementById('album-date').value.trim();
  const tracks = document.getElementById('album-tracks').value.trim();
  const img = document.getElementById('album-img-base64').value;

  if (!title) return alert('앨범명을 입력해주세요.');
  if (!cloudData.albums[currentGroup]) cloudData.albums[currentGroup] = [];

  const payload = { title, type, date, tracks, img };
  if (idx >= 0) cloudData.albums[currentGroup][idx] = payload;
  else cloudData.albums[currentGroup].unshift(payload);

  window.closeModals();
  syncData(onRender);
}

export function deleteAlbum(idx, currentGroup, onRender) {
  if (!confirm('이 앨범을 삭제하시겠습니까?')) return;
  cloudData.albums[currentGroup].splice(idx, 1);
  syncData(onRender);
}