import { cloudData, syncData } from './firebase.js';
import { escapeHTML } from './security.js';

let activeMemberFilter = 'all';
let activeAlbumFilter = 'all';
let activeStatusFilter = 'all'; // 'all' | 'collected' | 'missing' | 'duplicate'
let currentMode = 'catalog';    // 'catalog' | 'trade'

const MEMBER_COLORS = {
  '예준': 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  '노아': 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  '밤비': 'bg-pink-500/20 text-pink-300 border-pink-500/40',
  '은호': 'bg-rose-500/20 text-rose-300 border-rose-500/40',
  '하민': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  '단체': 'bg-amber-500/20 text-amber-300 border-amber-500/40'
};

// 📌 1. 포토카드 메인 렌더링
export function renderPhotocards(currentGroup) {
  const grp = currentGroup || (window.currentGroup || 'plave');
  if (!cloudData.photocards) cloudData.photocards = { plave: [], wego6: [] };
  if (!cloudData.photocards[grp]) cloudData.photocards[grp] = [];

  const pcs = cloudData.photocards[grp];

  renderCatalogView(pcs);
  renderTradeBoard(pcs);
}

// 📌 2. 도감 뷰 렌더링
function renderCatalogView(pcs) {
  const pcGrid = document.getElementById('photocard-grid');
  if (!pcGrid) return;

  const totalCount = pcs.length;
  const collectedList = pcs.filter(p => p.collected);
  const collectedCount = collectedList.length;
  const totalQuantity = collectedList.reduce((sum, p) => sum + (Number(p.quantity) || 1), 0);
  const duplicatesCount = collectedList.filter(p => (Number(p.quantity) || 1) > 1).length;
  const rate = totalCount > 0 ? Math.round((collectedCount / totalCount) * 100) : 0;

  // 앨범/이벤트 고유값 및 멤버 추출
  const albumList = ['all', ...new Set(pcs.map(p => p.album || p.category).filter(Boolean))];
  const members = ['all', '예준', '노아', '밤비', '은호', '하민', '단체'];

  const filtered = pcs.map((pc, originalIdx) => ({ ...pc, originalIdx })).filter(pc => {
    if (activeMemberFilter !== 'all' && pc.member !== activeMemberFilter) return false;
    const itemAlbum = pc.album || pc.category || '기타';
    if (activeAlbumFilter !== 'all' && itemAlbum !== activeAlbumFilter) return false;
    if (activeStatusFilter === 'collected' && !pc.collected) return false;
    if (activeStatusFilter === 'missing' && pc.collected) return false;
    if (activeStatusFilter === 'duplicate' && (!pc.collected || (Number(pc.quantity) || 1) <= 1)) return false;
    return true;
  });

  pcGrid.className = "space-y-4";
  pcGrid.innerHTML = `
    <!-- 수집률 대시보드 -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
        <div class="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
          <i class="fa-solid fa-chart-pie text-pink-400"></i> 수집률
        </div>
        <div class="flex items-baseline gap-2">
          <span class="text-2xl font-black text-pink-400 font-mono">${rate}%</span>
          <span class="text-xs text-slate-500 font-mono">(${collectedCount}/${totalCount})</span>
        </div>
        <div class="w-full bg-slate-950 h-1.5 rounded-full mt-2 overflow-hidden border border-slate-800">
          <div class="bg-gradient-to-r from-pink-500 to-indigo-500 h-full rounded-full transition-all duration-500" style="width: ${rate}%"></div>
        </div>
      </div>
      <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
        <div class="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
          <i class="fa-solid fa-check-double text-indigo-400"></i> 보유 카드
        </div>
        <div class="text-2xl font-bold text-white font-mono">${collectedCount} <span class="text-xs font-normal text-slate-400">종</span></div>
        <div class="text-[11px] text-slate-500 mt-1 font-mono">총 보유 수량: <strong class="text-indigo-300 font-bold">${totalQuantity}</strong>장</div>
      </div>
      <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
        <div class="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
          <i class="fa-solid fa-clone text-amber-400"></i> 교환가능(중복)
        </div>
        <div class="text-2xl font-bold text-amber-300 font-mono">${duplicatesCount} <span class="text-xs font-normal text-slate-400">종</span></div>
        <div class="text-[11px] text-slate-500 mt-1">2장 이상 소장</div>
      </div>
      <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
        <div class="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
          <i class="fa-solid fa-heart text-rose-400"></i> 위시/구함
        </div>
        <div class="text-2xl font-bold text-rose-300 font-mono">${totalCount - collectedCount} <span class="text-xs font-normal text-slate-400">종</span></div>
        <div class="text-[11px] text-slate-500 mt-1">미소장 카드</div>
      </div>
    </div>

    <!-- 필터 컨트롤 바 -->
    <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 space-y-3">
      <div class="flex flex-wrap items-center justify-between gap-2.5 pb-2 border-b border-slate-800/70">
        <div class="flex items-center gap-2 flex-1 min-w-[240px]">
          <span class="text-xs font-bold text-slate-400 flex items-center gap-1.5 shrink-0">
            <i class="fa-solid fa-compact-disc text-indigo-400"></i> 앨범/이벤트
          </span>
          <select onchange="window.setPcFilter('album', this.value)" class="w-full sm:w-64 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-pink-500 font-medium cursor-pointer">
            ${albumList.map(alb => `
              <option value="${escapeHTML(alb)}" ${activeAlbumFilter === alb ? 'selected' : ''}>
                ${alb === 'all' ? '✨ 전체 앨범 / 전체 이벤트 보기' : escapeHTML(alb)}
              </option>
            `).join('')}
          </select>
        </div>

        <div class="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button onclick="window.setPcFilter('status', 'all')" class="px-2.5 py-1 rounded-lg text-xs font-semibold transition ${activeStatusFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400'}">전체</button>
          <button onclick="window.setPcFilter('status', 'collected')" class="px-2.5 py-1 rounded-lg text-xs font-semibold transition ${activeStatusFilter === 'collected' ? 'bg-pink-600/30 text-pink-300 border border-pink-500/40' : 'text-slate-400'}">보유</button>
          <button onclick="window.setPcFilter('status', 'missing')" class="px-2.5 py-1 rounded-lg text-xs font-semibold transition ${activeStatusFilter === 'missing' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'text-slate-400'}">미보유</button>
          <button onclick="window.setPcFilter('status', 'duplicate')" class="px-2.5 py-1 rounded-lg text-xs font-semibold transition ${activeStatusFilter === 'duplicate' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-400'}">중복</button>
        </div>
      </div>

      <div class="flex items-center gap-1.5 overflow-x-auto pb-0.5">
        <span class="text-xs font-bold text-slate-500 mr-1 shrink-0">멤버</span>
        ${members.map(m => {
          const isAct = activeMemberFilter === m;
          const label = m === 'all' ? '전체' : m;
          return `
            <button onclick="window.setPcFilter('member', '${escapeHTML(m)}')" 
              class="px-3 py-1 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                isAct 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
                  : 'bg-slate-950 hover:bg-slate-800 text-slate-400 border border-slate-800'
              }">
              ${escapeHTML(label)}
            </button>
          `;
        }).join('')}
      </div>
    </div>

    <!-- 카드 그리드 -->
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 pt-1">
      ${filtered.length === 0 ? `
        <div class="col-span-full py-16 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-3xl bg-slate-900/30">
          <i class="fa-solid fa-id-badge text-3xl mb-2 block text-slate-600"></i>
          조건에 일치하는 포토카드가 없습니다.
        </div>
      ` : filtered.map(pc => {
        const isCollected = Boolean(pc.collected);
        const qty = Number(pc.quantity) || 1;
        const memberColor = MEMBER_COLORS[pc.member] || 'bg-slate-800 text-slate-300 border-slate-700';
        const displayAlbum = pc.album || pc.category || '기타';

        return `
          <div class="bg-slate-900 border rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between transition-all duration-200 group relative ${
            isCollected 
              ? 'border-pink-500/40 hover:border-pink-400 hover:shadow-pink-950/30 ring-1 ring-pink-500/20' 
              : 'border-slate-800/80 hover:border-slate-700 opacity-60 hover:opacity-90'
          }">
            <div class="absolute top-2 right-2 z-20 flex gap-1 bg-slate-950/80 p-1 rounded-xl backdrop-blur-md opacity-0 group-hover:opacity-100 transition shadow">
              <button onclick="window.openPhotocardModal(${pc.originalIdx})" class="text-slate-400 hover:text-indigo-300 p-1 text-xs" title="수정"><i class="fa-solid fa-pen"></i></button>
              <button onclick="window.deletePhotocard(${pc.originalIdx})" class="text-slate-400 hover:text-rose-400 p-1 text-xs" title="삭제"><i class="fa-solid fa-trash"></i></button>
            </div>

            <div onclick="window.togglePcCollected(${pc.originalIdx})" class="cursor-pointer relative overflow-hidden aspect-[2/3] bg-slate-950 select-none">
              ${pc.img ? `
                <img src="${pc.img}" class="w-full h-full object-cover transition duration-300 group-hover:scale-105 ${isCollected ? '' : 'grayscale contrast-75 brightness-75'}" alt="${escapeHTML(pc.version)}" />
              ` : `
                <div class="w-full h-full flex flex-col items-center justify-center text-slate-600 gap-1.5">
                  <i class="fa-solid fa-id-badge text-3xl"></i>
                  <span class="text-[10px] text-slate-500 font-medium">사진 없음</span>
                </div>
              `}

              ${isCollected ? `
                <div class="absolute top-2 left-2 w-6 h-6 rounded-full bg-pink-600 text-white flex items-center justify-center text-xs font-bold shadow-md shadow-pink-600/50">
                  <i class="fa-solid fa-check text-[10px]"></i>
                </div>
              ` : ''}

              <span class="absolute bottom-2 left-2 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-950/80 backdrop-blur-sm text-slate-300 border border-slate-800 max-w-[85%] truncate">
                ${escapeHTML(displayAlbum)}
              </span>
            </div>

            <div class="p-3">
              <div class="flex items-center justify-between mb-1">
                <span class="px-2 py-0.5 rounded-md text-[10px] font-bold border ${memberColor}">
                  ${escapeHTML(pc.member)}
                </span>
                ${isCollected && qty > 1 ? `
                  <span class="text-[10px] font-mono font-bold text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                    x${qty}
                  </span>
                ` : ''}
              </div>
              <h4 class="text-xs font-bold text-white truncate" title="${escapeHTML(pc.version)}">
                ${escapeHTML(pc.version)}
              </h4>
              ${pc.memo ? `<p class="text-[10px] text-slate-500 truncate mt-0.5">${escapeHTML(pc.memo)}</p>` : ''}
            </div>

            <div class="p-2.5 pt-0 flex items-center gap-1.5">
              <button onclick="window.togglePcCollected(${pc.originalIdx})" class="flex-1 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border cursor-pointer ${
                isCollected 
                  ? 'bg-pink-600 hover:bg-pink-500 text-white border-pink-500 shadow-md shadow-pink-600/20' 
                  : 'bg-slate-950 hover:bg-slate-800 text-slate-400 border-slate-800'
              }">
                <i class="fa-solid ${isCollected ? 'fa-check' : 'fa-plus'} text-[10px]"></i>
                <span>${isCollected ? '보유중' : '미보유'}</span>
              </button>
              ${isCollected ? `
                <div class="inline-flex items-center bg-slate-950 border border-slate-800 rounded-xl p-0.5">
                  <button onclick="window.changePcQty(${pc.originalIdx}, -1)" class="w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:text-white hover:bg-slate-800"><i class="fa-solid fa-minus text-[9px]"></i></button>
                  <span class="px-1.5 text-xs font-mono font-bold text-pink-400">${qty}</span>
                  <button onclick="window.changePcQty(${pc.originalIdx}, 1)" class="w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:text-white hover:bg-slate-800"><i class="fa-solid fa-plus text-[9px]"></i></button>
                </div>
              ` : ''}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// 📌 3. 교환판(HAVE vs WANT) 렌더링
function renderTradeBoard(pcs) {
  const haveListEl = document.getElementById('trade-have-list');
  const wantListEl = document.getElementById('trade-want-list');
  const haveCountEl = document.getElementById('trade-have-count');
  const wantCountEl = document.getElementById('trade-want-count');
  const dateEl = document.getElementById('trade-board-date');

  if (!haveListEl || !wantListEl) return;
  if (dateEl) dateEl.innerText = `업데이트: ${new Date().toLocaleDateString('ko-KR')}`;

  // HAVE: 보유 중이면서 수량이 2장 이상인 카드(또는 양도 표시된 카드)
  const haveCards = pcs.filter(p => p.collected && (Number(p.quantity) || 1) > 1);
  // WANT: 미보유 카드
  const wantCards = pcs.filter(p => !p.collected);

  if (haveCountEl) haveCountEl.innerText = `${haveCards.length}종`;
  if (wantCountEl) wantCountEl.innerText = `${wantCards.length}종`;

  haveListEl.innerHTML = haveCards.length === 0 ? `
    <div class="col-span-full py-8 text-center text-slate-600 text-xs">중복 카드가 없습니다.</div>
  ` : haveCards.map(p => `
    <div class="bg-slate-950 border border-amber-500/30 rounded-xl overflow-hidden p-2 text-center">
      <div class="aspect-[2/3] bg-slate-900 rounded-lg overflow-hidden mb-1.5">
        ${p.img ? `<img src="${p.img}" class="w-full h-full object-cover" />` : `<div class="w-full h-full flex items-center justify-center text-slate-700 text-xs font-bold">${escapeHTML(p.member)}</div>`}
      </div>
      <div class="text-[11px] font-bold text-amber-300 truncate">${escapeHTML(p.member)}</div>
      <div class="text-[10px] text-slate-400 truncate">${escapeHTML(p.version)}</div>
      <span class="inline-block mt-1 text-[9px] font-mono font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">여분 ${(Number(p.quantity) || 1) - 1}장</span>
    </div>
  `).join('');

  wantListEl.innerHTML = wantCards.length === 0 ? `
    <div class="col-span-full py-8 text-center text-slate-600 text-xs">모든 포카를 소장 중입니다! 🎉</div>
  ` : wantCards.map(p => `
    <div class="bg-slate-950 border border-rose-500/30 rounded-xl overflow-hidden p-2 text-center">
      <div class="aspect-[2/3] bg-slate-900 rounded-lg overflow-hidden mb-1.5 opacity-60">
        ${p.img ? `<img src="${p.img}" class="w-full h-full object-cover grayscale" />` : `<div class="w-full h-full flex items-center justify-center text-slate-700 text-xs font-bold">${escapeHTML(p.member)}</div>`}
      </div>
      <div class="text-[11px] font-bold text-rose-300 truncate">${escapeHTML(p.member)}</div>
      <div class="text-[10px] text-slate-400 truncate">${escapeHTML(p.version)}</div>
      <span class="inline-block mt-1 text-[9px] text-rose-400 bg-rose-500/10 px-1.5 py-0.2 rounded border border-rose-500/20">WISH</span>
    </div>
  `).join('');
}

// 📌 4. 모드 전환 (도감 vs 교환판)
export function switchPcMode(mode) {
  currentMode = mode;
  const btnCatalog = document.getElementById('pc-tab-catalog');
  const btnTrade = document.getElementById('pc-tab-trade');
  const viewCatalog = document.getElementById('pc-view-catalog');
  const viewTrade = document.getElementById('pc-view-trade');

  if (!btnCatalog || !btnTrade || !viewCatalog || !viewTrade) return;

  if (mode === 'catalog') {
    btnCatalog.className = "px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 bg-pink-600 text-white shadow-sm";
    btnTrade.className = "px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 text-slate-400 hover:text-white";
    viewCatalog.classList.remove('hidden');
    viewTrade.classList.add('hidden');
  } else {
    btnTrade.className = "px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 bg-amber-500 text-slate-950 shadow-sm font-bold";
    btnCatalog.className = "px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 text-slate-400 hover:text-white";
    viewTrade.classList.remove('hidden');
    viewCatalog.classList.add('hidden');
    renderTradeBoard(cloudData.photocards[window.currentGroup || 'plave'] || []);
  }
}

// 📌 5. 교환판 이미지(PNG) 저장 (HTML2Canvas)
export function downloadTradeBoard() {
  const target = document.getElementById('trade-board-canvas-area');
  if (!target || !window.html2canvas) {
    return alert('이미지 캡처 모듈을 불러오는 중입니다. 잠시 후 다시 눌러주세요.');
  }

  window.html2canvas(target, { backgroundColor: '#020617', scale: 2 }).then(canvas => {
    const link = document.createElement('a');
    link.download = `PLAVE_포카교환판_${new Date().toISOString().slice(0, 10)}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  });
}

// 📌 6. 필터 및 상태 변경
export function setPcFilter(type, value, currentGroup) {
  if (type === 'member') activeMemberFilter = value;
  if (type === 'album') activeAlbumFilter = value;
  if (type === 'status') activeStatusFilter = value;
  const grp = currentGroup || (window.currentGroup || 'plave');
  renderPhotocards(grp);
}

export function changePcQty(idx, delta, currentGroup, onRender) {
  const grp = currentGroup || (window.currentGroup || 'plave');
  const item = cloudData.photocards[grp][idx];
  if (!item) return;

  const curQty = Number(item.quantity) || 1;
  const newQty = curQty + delta;
  if (newQty <= 0) {
    item.collected = false;
    item.quantity = 1;
  } else {
    item.quantity = newQty;
  }
  syncData(onRender);
}

export function togglePcCollected(idx, currentGroup, onRender) {
  const grp = currentGroup || (window.currentGroup || 'plave');
  const item = cloudData.photocards[grp][idx];
  if (!item) return;

  item.collected = !item.collected;
  if (item.collected && (!item.quantity || item.quantity < 1)) {
    item.quantity = 1;
  }
  syncData(onRender);
}

// 📌 7. 포토카드 모달 제어 & Firebase 저장
export function openPhotocardModal(idx, currentGroup) {
  const grp = currentGroup || (window.currentGroup || 'plave');
  const editInput = document.getElementById('edit-pc-idx');
  if (editInput) editInput.value = idx;

  const fileInput = document.getElementById('pc-file-input');
  if (fileInput) fileInput.value = '';

  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = (val !== undefined && val !== null) ? val : '';
  };

  if (idx >= 0) {
    const item = cloudData.photocards[grp][idx];
    document.getElementById('pc-modal-title').innerText = '포토카드 정보 수정';
    setVal('pc-member', item.member);
    setVal('pc-version', item.version);
    setVal('pc-category', item.album || item.category || '미니 2집');
    setVal('pc-quantity', item.quantity || 1);
    setVal('pc-memo', item.memo || '');
    setVal('pc-collected', item.collected ? 'true' : 'false');
    setVal('pc-img-base64', item.img || '');

    const preview = document.getElementById('pc-img-preview');
    const wrap = document.getElementById('pc-preview-wrap');
    if (item.img && preview && wrap) {
      preview.src = item.img;
      wrap.classList.remove('hidden');
    } else if (wrap) {
      wrap.classList.add('hidden');
    }
  } else {
    document.getElementById('pc-modal-title').innerText = '새 포토카드 등록';
    setVal('pc-member', '예준');
    setVal('pc-version', '');
    setVal('pc-category', '미니 2집');
    setVal('pc-quantity', 1);
    setVal('pc-memo', '');
    setVal('pc-collected', 'false');
    setVal('pc-img-base64', '');
    const wrap = document.getElementById('pc-preview-wrap');
    if (wrap) wrap.classList.add('hidden');
  }

  document.getElementById('photocard-modal')?.classList.replace('hidden', 'flex');
}

export function savePhotocard(currentGroup, onRender) {
  const grp = currentGroup || (window.currentGroup || 'plave');
  const idx = parseInt(document.getElementById('edit-pc-idx').value);
  const member = document.getElementById('pc-member').value.trim();
  const version = document.getElementById('pc-version').value.trim();
  const album = (document.getElementById('pc-category')?.value || '기타').trim();
  const quantity = Math.max(1, parseInt(document.getElementById('pc-quantity')?.value) || 1);
  const memo = (document.getElementById('pc-memo')?.value || '').trim();
  const img = document.getElementById('pc-img-base64').value;
  const collected = document.getElementById('pc-collected').value === 'true';

  if (!member || !version) return alert('멤버와 포카 명칭을 입력해주세요.');
  if (!cloudData.photocards[grp]) cloudData.photocards[grp] = [];

  const payload = { member, version, album, category: album, quantity, memo, img, collected };

  if (idx >= 0) {
    cloudData.photocards[grp][idx] = { ...cloudData.photocards[grp][idx], ...payload };
  } else {
    cloudData.photocards[grp].unshift(payload);
  }

  window.closeModals();
  syncData(onRender);
}

export function deletePhotocard(idx, currentGroup, onRender) {
  const grp = currentGroup || (window.currentGroup || 'plave');
  if (!confirm('이 포토카드를 삭제하시겠습니까?')) return;
  cloudData.photocards[grp].splice(idx, 1);
  syncData(onRender);
}
