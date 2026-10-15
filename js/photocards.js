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

// 📌 1. 포토카드 메뉴 렌더링 메인 함수
export function renderPhotocards(currentGroup) {
  const grp = currentGroup || 'plave';
  if (!cloudData.photocards) cloudData.photocards = { plave: [], wego6: [] };
  if (!cloudData.photocards[grp]) cloudData.photocards[grp] = [];

  const pcs = cloudData.photocards[grp];
  const pcGrid = document.getElementById('photocard-grid');
  if (!pcGrid) return;

  // 상단 통계 수치 계산
  const totalCount = pcs.length;
  const collectedList = pcs.filter(p => p.collected);
  const collectedCount = collectedList.length;
  const totalQuantity = collectedList.reduce((sum, p) => sum + (Number(p.quantity) || 1), 0);
  const duplicatesCount = collectedList.filter(p => (Number(p.quantity) || 1) > 1).length;
  const rate = totalCount > 0 ? Math.round((collectedCount / totalCount) * 100) : 0;

  // 멤버 및 카테고리 목록 추출
  const members = ['all', ...new Set(pcs.map(p => p.member).filter(Boolean))];
  const categories = ['all', ...new Set(pcs.map(p => p.category || '앨범').filter(Boolean))];

  // 필터링 적용
  const filtered = pcs.map((pc, originalIdx) => ({ ...pc, originalIdx })).filter(pc => {
    if (activeMemberFilter !== 'all' && pc.member !== activeMemberFilter) return false;
    if (activeCategoryFilter !== 'all' && (pc.category || '앨범') !== activeCategoryFilter) return false;
    if (activeStatusFilter === 'collected' && !pc.collected) return false;
    if (activeStatusFilter === 'missing' && pc.collected) return false;
    if (activeStatusFilter === 'duplicate' && (!pc.collected || (Number(pc.quantity) || 1) <= 1)) return false;
    return true;
  });

  // HTML 조립 (상단 대시보드 + 필터바 + 카드 그리드)
  pcGrid.className = "space-y-4";
  pcGrid.innerHTML = `
    <!-- 🌟 수집률 대시보드 -->
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

    <!-- 🌟 멤버 및 카테고리 퀵 필터바 -->
    <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 space-y-2.5">
      <!-- 멤버 탭 -->
      <div class="flex items-center gap-1.5 overflow-x-auto pb-1">
        <span class="text-[11px] font-bold text-slate-500 mr-1 shrink-0">멤버</span>
        ${members.map(m => {
          const isAct = activeMemberFilter === m;
          const label = m === 'all' ? '전체 멤버' : m;
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
          <span class="text-[11px] font-
