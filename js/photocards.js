import { cloudData, syncData } from './firebase.js';
import { escapeHTML } from './security.js';

let activeCategory = 'all';
let activeFilter = 'all'; // all, have, wish, trade

export function renderPhotocards(currentGroup) {
  const pcs = (cloudData.photocards && cloudData.photocards[currentGroup]) || [];
  const pcGrid = document.getElementById('photocard-grid');
  if (!pcGrid) return;

  // 1. 등록된 모든 고유 카테고리 추출
  const categories = Array.from(new Set(pcs.map(p => p.category).filter(Boolean)));
  renderCategoryTabs(categories);
  renderCategoryDatalist(categories);

  // 2. 카테고리 및 보유 서브 필터 적용
  let filtered = pcs.map((pc, originalIdx) => ({ ...pc, originalIdx }));

  if (activeCategory !== 'all') {
    filtered = filtered.filter(p => p.category === activeCategory);
  }

  if (activeFilter === 'have') {
    filtered = filtered.filter(p => p.collected && (Number(p.quantity) || 1) >= 1);
  } else if (activeFilter === 'wish') {
    filtered = filtered.filter(p => !p.collected || (Number(p.quantity) || 0) === 0);
  } else if (activeFilter === 'trade') {
    filtered = filtered.filter(p => p.collected && (Number(p.quantity) || 0) >= 2);
  }

  // 3. 통계 텍스트 업데이트
  const totalCount = pcs.length;
  const haveCount = pcs.filter(p => p.collected && (Number(p.quantity) || 1) >= 1).length;
  const wishCount = totalCount - haveCount;
  const statEl = document.getElementById('pc-summary-stats');
  if (statEl) {
    statEl.innerHTML = `보유 <span class="text-emerald-400 font-bold">${haveCount}</span> / 위시 <span class="text-rose-400 font-bold">${wishCount}</span> (총 ${totalCount}장)`;
  }

  // 4. 카드 그리드 출력
  if (filtered.length === 0) {
    pcGrid.innerHTML = `
      <div class="col-span-full py-16 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-2xl bg-slate-950/40">
        <i class="fa-solid fa-id-badge text-3xl mb-2 block text-slate-600"></i>
        조건에 맞는 포토카드가 없습니다.
      </div>
    `;
    return;
  }

  pcGrid.innerHTML = filtered.map((pc) => {
    const qty = Number(pc.quantity) !== undefined && pc.quantity !== null ? Number(pc.quantity) : (pc.collected ? 1 : 0);
    const isCollected = Boolean(pc.collected && qty > 0);
    const isTradeable = qty >= 2;

    return `
      <div class="bg-slate-900 border ${isTradeable ? 'border-amber-500/50 ring-1 ring-amber-500/30' : isCollected ? 'border-pink-500/30' : 'border-slate-800'} rounded-2xl overflow-hidden shadow-lg flex flex-col justify-between relative group transition hover:border-slate-600">
        
        <!-- 수정/삭제 버튼 -->
        <div class="absolute top-2 right-2 z-10 flex gap-1 bg-slate-950/80 p-1 rounded-lg backdrop-blur-sm opacity-90 group-hover:opacity-100 transition">
          <button onclick="window.openPhotocardModal(${pc.originalIdx})" class="text-slate-400 hover:text-indigo-400 text-xs p-1" title="수정"><i class="fa-solid fa-pen"></i></button>
          <button onclick="window.deletePhotocard(${pc.originalIdx})" class="text-slate-400 hover:text-rose-400 text-xs p-1" title="삭제"><i class="fa-solid fa-trash"></i></button>
        </div>

        <!-- 카테고리 태그 배지 -->
        ${pc.category ? `
          <div class="absolute top-2 left-2 z-10">
            <span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-950/85 text-pink-300 border border-pink-500/30 backdrop-blur-sm">
              ${escapeHTML(pc.category)}
            </span>
          </div>
        ` : ''}

        <div>
          ${pc.img ? `
            <div class="w-full aspect-[2/3] bg-slate-950 overflow-hidden relative ${!isCollected ? 'opacity-40 grayscale' : ''}">
              <img src="${pc.img}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
            </div>
          ` : `
            <div class="w-full aspect-[2/3] bg-slate-950/70 flex flex-col items-center justify-center text-slate-600 gap-1 border-b border-slate-800 ${!isCollected ? 'opacity-40' : ''}">
              <i class="fa-solid fa-id-badge text-3xl"></i>
              <span class="text-[10px] text-slate-500">사진 없음</span>
            </div>
          `}

          <div class="p-3 text-center">
            <h5 class="text-xs font-bold text-white">${escapeHTML(pc.member)}</h5>
            <p class="text-[11px] text-slate-400 mt-0.5 line-clamp-1" title="${escapeHTML(pc.version)}">${escapeHTML(pc.version)}</p>
          </div>
        </div>

        <div class="p-2.5 pt-0 space-y-2">
          <!-- 수량 증감 컨트롤러 -->
          <div class="flex items-center justify-between bg-slate-950/80 px-2 py-1 rounded-xl border border-slate-800">
            <span class="text-[10px] text-slate-400 font-bold">수량</span>
            <div class="flex items-center gap-1.5 font-mono">
              <button onclick="window.changePcQty(${pc.originalIdx}, -1)" class="w-5 h-5 flex items-center justify-center rounded text-slate-400 hover:text-white hover:bg-slate-800">
                <i class="fa-solid fa-minus text-[8px]"></i>
              </button>
              <span class="text-xs font-bold ${qty > 1 ? 'text-amber-400 font-black' : isCollected ? 'text-emerald-400' : 'text-slate-500'}">${qty}</span>
              <button onclick="window.changePcQty(${pc.originalIdx}, 1)" class="w-5 h-5 flex items-center justify-center rounded text-slate-400 hover:text-white hover:bg-slate-800">
                <i class="fa-solid fa-plus text-[8px]"></i>
              </button>
            </div>
          </div>

          <!-- 상태 토글 버튼 -->
          <button onclick="window.togglePcCollected(${pc.originalIdx})" class="w-full py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
            isCollected 
              ? 'bg-pink-600 hover:bg-pink-500 text-white border-pink-500 shadow-md shadow-pink-600/20' 
              : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border-slate-700'
          }">
            <i class="fa-solid ${isCollected ? 'fa-check' : 'fa-plus'} text-[10px]"></i>
            <span>${isCollected ? (qty > 1 ? `있어요 (${qty}장)` : '있어요') : '없어요 (위시)'}</span>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// 📌 상단 카테고리 탭 렌더링
function renderCategoryTabs(categories) {
  const container = document.getElementById('pc-category-tabs');
  if (!container) return;

  const allCats = ['all', ...categories];
  container.innerHTML = allCats.map(cat => {
    const isAct = (activeCategory === cat);
    return `
      <button onclick="window.setPcCategory('${escapeHTML(cat)}')" class="px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
        isAct 
          ? 'bg-gradient-to-r from-pink-600 to-indigo-600 text-white shadow-md' 
          : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
      }">
        <span>${cat === 'all' ? '✨ 전체 카테고리' : cat}</span>
      </button>
    `;
  }).join('');
}

// 📌 모달 입력창의 datalist 채우기
function renderCategoryDatalist(categories) {
  const datalist = document.getElementById('pc-category-datalist');
  if (!datalist) return;
  datalist.innerHTML = categories.map(cat => `<option value="${escapeHTML(cat)}"></option>`).join('');
}

export function setPcCategory(cat) {
  activeCategory = cat;
  window.renderAllApp?.();
}

export function setPcFilter(filterType) {
  activeFilter = filterType;
  ['all', 'have', 'wish', 'trade'].forEach(type => {
    const btn = document.getElementById(`btn-pc-filter-${type}`);
    if (btn) {
      if (type === filterType) {
        btn.className = "px-3 py-1 rounded-lg font-bold bg-slate-800 text-white transition";
      } else {
        btn.className = "px-3 py-1 rounded-lg text-slate-400 hover:text-white transition";
      }
    }
  });
  window.renderAllApp?.();
}

export function openPhotocardModal(idx, currentGroup) {
  document.getElementById('edit-pc-idx').value = idx !== undefined ? idx : -1;
  document.getElementById('pc-file-input').value = '';

  const pcs = (cloudData.photocards && cloudData.photocards[currentGroup]) || [];
  const categories = Array.from(new Set(pcs.map(p => p.category).filter(Boolean)));
  renderCategoryDatalist(categories);

  if (idx >= 0 && pcs[idx]) {
    const item = pcs[idx];
    document.getElementById('pc-modal-title').innerHTML = '<i class="fa-solid fa-pen text-pink-400"></i> 포토카드 정보 수정';
    document.getElementById('pc-category').value = item.category || '';
    document.getElementById('pc-member').value = item.member || '';
    document.getElementById('pc-version').value = item.version || '';
    document.getElementById('pc-collected').value = item.collected ? 'true' : 'false';
    document.getElementById('pc-quantity').value = item.quantity !== undefined ? item.quantity : (item.collected ? 1 : 0);
    document.getElementById('pc-img-base64').value = item.img || '';

    if (item.img) {
      document.getElementById('pc-img-preview').src = item.img;
      document.getElementById('pc-preview-wrap').classList.remove('hidden');
    } else {
      document.getElementById('pc-preview-wrap').classList.add('hidden');
    }
  } else {
    document.getElementById('pc-modal-title').innerHTML = '<i class="fa-solid fa-id-badge text-pink-400"></i> 새 포토카드 등록';
    document.getElementById('pc-category').value = activeCategory !== 'all' ? activeCategory : '';
    document.getElementById('pc-member').value = '';
    document.getElementById('pc-version').value = '';
    document.getElementById('pc-collected').value = 'true';
    document.getElementById('pc-quantity').value = '1';
    document.getElementById('pc-img-base64').value = '';
    document.getElementById('pc-preview-wrap').classList.add('hidden');
  }

  document.getElementById('photocard-modal').classList.replace('hidden', 'flex');
}

export function handlePcModalCollectedChange(val) {
  const qtyEl = document.getElementById('pc-quantity');
  if (!qtyEl) return;
  if (val === 'false') {
    qtyEl.value = '0';
  } else if (parseInt(qtyEl.value) <= 0) {
    qtyEl.value = '1';
  }
}

export function savePhotocard(currentGroup, onRender) {
  const idx = parseInt(document.getElementById('edit-pc-idx').value);
  const category = (document.getElementById('pc-category').value || '').trim();
  const member = (document.getElementById('pc-member').value || '').trim();
  const version = (document.getElementById('pc-version').value || '').trim();
  const img = document.getElementById('pc-img-base64').value;
  let quantity = Math.max(0, parseInt(document.getElementById('pc-quantity').value) || 0);
  const collected = document.getElementById('pc-collected').value === 'true' && quantity > 0;

  if (!member || !version) return alert('멤버와 포카 버전/출처를 입력해주세요.');
  if (!cloudData.photocards[currentGroup]) cloudData.photocards[currentGroup] = [];

  const payload = { category: category || '기타', member, version, img, collected, quantity };

  if (idx >= 0) cloudData.photocards[currentGroup][idx] = payload;
  else cloudData.photocards[currentGroup].unshift(payload);

  window.closeModals();
  syncData(onRender);
}

export function togglePcCollected(idx, currentGroup, onRender) {
  const item = cloudData.photocards[currentGroup][idx];
  if (!item) return;

  item.collected = !item.collected;
  if (item.collected) {
    if (!item.quantity || Number(item.quantity) <= 0) item.quantity = 1;
  } else {
    item.quantity = 0;
  }
  syncData(onRender);
}

export function changePcQty(idx, delta, currentGroup, onRender) {
  const item = cloudData.photocards[currentGroup][idx];
  if (!item) return;

  const curQty = Number(item.quantity) || (item.collected ? 1 : 0);
  const newQty = Math.max(0, curQty + delta);
  item.quantity = newQty;
  item.collected = (newQty > 0);

  syncData(onRender);
}

export function deletePhotocard(idx, currentGroup, onRender) {
  if (!confirm('이 포토카드를 삭제하시겠습니까?')) return;
  cloudData.photocards[currentGroup].splice(idx, 1);
  syncData(onRender);
}
