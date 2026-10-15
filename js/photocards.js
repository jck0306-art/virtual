import { cloudData, syncData } from './firebase.js';
import { escapeHTML } from './security.js';

let activeMemberFilter = 'all';
let activeCategoryFilter = 'all';
let activeStatusFilter = 'all'; // 'all' | 'collected' | 'missing' | 'duplicate'

const MEMBER_COLORS = {
  '예준': 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  '노아': 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  '밤비': 'bg-pink-500/20 text-pink-300 border-pink-500/40',
  '은호': 'bg-rose-500/20 text-rose-300 border-rose-500/40',
  '하민': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  '단체': 'bg-amber-500/20 text-amber-300 border-amber-500/40'
};

// 📌 1. 메인 렌더링 함수
export function renderPhotocards(currentGroup) {
  const grp = currentGroup || 'plave';
  if (!cloudData.photocards) cloudData.photocards = { plave: [], wego6: [] };
  if (!cloudData.photocards[grp]) cloudData.photocards[grp] = [];

  const pcs = cloudData.photocards[grp];

  renderPhotocardStats(pcs);
  renderFilterBar(pcs, grp);
  renderPhotocardGrid(pcs, grp);
}

// 📌 2. 수집률 대시보드
function renderPhotocardStats(pcs) {
  const totalCount = pcs.length;
  const collectedList = pcs.filter(p => p.collected);
  const collectedCount = collectedList.length;
  const totalQuantity = collectedList.reduce((sum, p) => sum + (Number(p.quantity) || 1), 0);
  const duplicatesCount = collectedList.filter(p => (Number(p.quantity) || 1) > 1).length;
  const rate = totalCount > 0 ? Math.round((collectedCount / totalCount) * 100) : 0;

  const statContainer = document.getElementById('pc-stat-dashboard');
  if (!statContainer) return;

  statContainer.innerHTML = `
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
        <div class="text-[11px] text-slate-500 mt-1 font-mono">총 보유 장수: <strong class="text-indigo-300 font-bold">${totalQuantity}</strong>장</div>
      </div>

      <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
        <div class="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
          <i class="fa-solid fa-clone text-amber-400"></i> 여분/중복
        </div>
        <div class="text-2xl font-bold text-amber-300 font-mono">${duplicatesCount} <span class="text-xs font-normal text-slate-400">종</span></div>
        <div class="text-[11px] text-slate-500 mt-1">교환 가능한 카드</div>
      </div>

      <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
        <div class="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
          <i class="fa-solid fa-heart-crack text-rose-400"></i> 위시/미보유
        </div>
        <div class="text-2xl font-bold text-rose-300 font-mono">${totalCount - collectedCount} <span class="text-xs font-normal text-slate-400">종</span></div>
        <div class="text-[11px] text-slate-500 mt-1">남은 목표 포카</div>
      </div>
    </div>
  `;
}

// 📌 3. 멤버 및 카테고리 필터바
function renderFilterBar(pcs, currentGroup) {
  const container = document.getElementById('pc-filter-bar');
  if (!container) return;

  const members = ['all', ...new Set(pcs.map(p => p.member).filter(Boolean))];
  const categories = ['all', ...new Set(pcs.map(p => p.category || '앨범').filter(Boolean))];

  container.innerHTML = `
    <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 space-y-2.5">
      <!-- 멤버 탭 -->
      <div class="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <span class="text-[11px] font-bold text-slate-500 mr-1 shrink-0">멤버</span>
        ${members.map(m => {
          const isAct = activeMemberFilter === m;
          const label = m === 'all' ? '전체 멤버' : m;
          const badgeClass = m !== 'all' && MEMBER_COLORS[m] ? MEMBER_COLORS[m] : 'border-slate-700 text-slate-300';
          return `
            <button onclick="window.setPcFilter('member', '${escapeHTML(m)}')" 
              class="px-3 py-1 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                isAct 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
                  : 'bg-slate-950/80 hover:bg-slate-800 text-slate-400 border border-slate-800'
              }">
              ${escapeHTML(label)}
            </button>
          `;
        }).join('')}
      </div>

      <!-- 카테고리 & 보유 여부 토글 -->
      <div class="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
        <div class="flex items-center gap-1.5 overflow-x-auto">
          <span class="text-[11px] font-bold text-slate-500 mr-1 shrink-0">분류</span>
          ${categories.map(c => {
            const isAct = activeCategoryFilter === c;
            const label = c === 'all' ? '전체' : c;
            return `
              <button onclick="window.setPcFilter('category', '${escapeHTML(c)}')" 
                class="px-2.5 py-0.5 rounded-lg text-xs font-medium transition ${
                  isAct 
                    ? 'bg-pink-600 text-white font-bold' 
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }">
                ${escapeHTML(label)}
              </button>
            `;
          }).join('')}
        </div>

        <div class="flex items-center gap-1 bg-slate-950 p-0.5 rounded-xl border border-slate-800">
          <button onclick="window.setPcFilter('status', 'all')" class="px-2 py-0.5 rounded-lg text-[11px] font-semibold transition ${activeStatusFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400'}">전체</button>
          <button onclick="window.setPcFilter('status', 'collected')" class="px-2 py-0.5 rounded-lg text-[11px] font-semibold transition ${activeStatusFilter === 'collected' ? 'bg-pink-600/30 text-pink-300 border border-pink-500/40' : 'text-slate-400'}">보유</button>
          <button onclick="window.setPcFilter('status', 'missing')" class="px-2 py-0.5 rounded-lg text-[11px] font-semibold transition ${activeStatusFilter === 'missing' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'text-slate-400'}">미보유</button>
          <button onclick="window.setPcFilter('status', 'duplicate')" class="px-2 py-0.5 rounded-lg text-[11px] font-semibold transition ${activeStatusFilter === 'duplicate' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-400'}">중복</button>
        </div>
      </div>
    </div>
  `;
}

// 📌 4. 포카 그리드 렌더링
function renderPhotocardGrid(pcs, currentGroup) {
  const pcGrid = document.getElementById('photocard-grid');
  if (!pcGrid) return;

  const filtered = pcs.map((pc, originalIdx) => ({ ...pc, originalIdx })).filter(pc => {
    if (activeMemberFilter !== 'all' && pc.member !== activeMemberFilter) return false;
    if (activeCategoryFilter !== 'all' && (pc.category || '앨범') !== activeCategoryFilter) return false;
    if (activeStatusFilter === 'collected' && !pc.collected) return false;
    if (activeStatusFilter === 'missing' && pc.collected) return false;
    if (activeStatusFilter === 'duplicate' && (!pc.collected || (Number(pc.quantity) || 1) <= 1)) return false;
    return true;
  });

  if (filtered.length === 0) {
    pcGrid.innerHTML = `
      <div class="col-span-full py-16 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-3xl bg-slate-900/30">
        <i class="fa-solid fa-id-badge text-3xl mb-2 block text-slate-600"></i>
        조건에 맞는 포토카드가 없습니다.
      </div>
    `;
    return;
  }

  pcGrid.innerHTML = filtered.map(pc => {
    const isCollected = Boolean(pc.collected);
    const qty = Number(pc.quantity) || 1;
    const memberColor = MEMBER_COLORS[pc.member] || 'bg-slate-800 text-slate-300 border-slate-700';

    return `
      <div class="bg-slate-900 border rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between transition-all duration-200 group relative ${
        isCollected 
          ? 'border-pink-500/40 hover:border-pink-400 hover:shadow-pink-950/30 ring-1 ring-pink-500/20' 
          : 'border-slate-800/80 hover:border-slate-700 opacity-70 hover:opacity-90'
      }">
        <!-- 상단 액션 오버레이 버튼 -->
        <div class="absolute top-2 right-2 z-20 flex gap-1 bg-slate-950/80 p-1 rounded-xl backdrop-blur-md opacity-0 group-hover:opacity-100 transition shadow">
          <button onclick="window.openPhotocardModal(${pc.originalIdx})" class="text-slate-400 hover:text-indigo-300 p-1 text-xs" title="수정"><i class="fa-solid fa-pen"></i></button>
          <button onclick="window.deletePhotocard(${pc.originalIdx})" class="text-slate-400 hover:text-rose-400 p-1 text-xs" title="삭제"><i class="fa-solid fa-trash"></i></button>
        </div>

        <!-- 이미지 영역 (원클릭 보유 토글) -->
        <div onclick="window.togglePcCollected(${pc.originalIdx})" class="cursor-pointer relative overflow-hidden aspect-[2/3] bg-slate-950 select-none">
          ${pc.img ? `
            <img src="${pc.img}" class="w-full h-full object-cover transition duration-300 group-hover:scale-105 ${isCollected ? '' : 'grayscale contrast-75 brightness-75'}" alt="${escapeHTML(pc.version)}" />
          ` : `
            <div class="w-full h-full flex flex-col items-center justify-center text-slate-600 gap-1.5">
              <i class="fa-solid fa-id-badge text-3xl"></i>
              <span class="text-[10px] text-slate-500 font-medium">이미지 미등록</span>
            </div>
