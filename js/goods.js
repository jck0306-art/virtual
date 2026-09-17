import { cloudData, syncData } from './firebase.js';
import { escapeHTML } from './security.js';

export function renderGoods(currentGroup) {
  const goods = (cloudData.goods && cloudData.goods[currentGroup]) || [];
  const goodsGrid = document.getElementById('goods-grid');
  if (!goodsGrid) return;

  if (goods.length === 0) {
    goodsGrid.innerHTML = `<p class="text-xs text-slate-500 py-10 col-span-full text-center">등록된 굿즈가 없습니다.</p>`;
    return;
  }

  goodsGrid.innerHTML = goods.map((g, idx) => {
    const isOwned = g.owned === true || g.owned === 'true';
    const quantity = g.quantity !== undefined ? Number(g.quantity) : (isOwned ? 1 : 0);

    return `
      <div class="bg-slate-900 border ${isOwned ? 'border-slate-800 hover:border-emerald-500/40' : 'border-slate-800/60 opacity-75'} rounded-2xl overflow-hidden shadow-lg flex flex-col justify-between group transition">
        <div>
          ${g.img ? `
            <div class="w-full aspect-square bg-slate-950 overflow-hidden relative border-b border-slate-800">
              <img src="${g.img}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
              ${!isOwned ? `
                <div class="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] flex items-center justify-center">
                  <span class="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-900/90 text-slate-400 border border-slate-700">미보유 (위시)</span>
                </div>
              ` : ''}
            </div>
          ` : `
            <div class="w-full h-32 bg-slate-950/60 flex items-center justify-center border-b border-slate-800 text-slate-600">
              <i class="fa-solid fa-box-open text-3xl"></i>
            </div>
          `}

          <div class="p-4 space-y-2">
            <div class="flex items-center justify-between gap-2">
              <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                ${escapeHTML(g.cat || '굿즈')}
              </span>
              <button onclick="window.toggleGoodsOwned(${idx})" class="text-[10px] font-bold px-2 py-0.5 rounded-full border transition ${
                isOwned 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
              }">
                ${isOwned ? '✓ 보유 중' : '위시 (미보유)'}
              </button>
            </div>

            <h4 class="text-sm font-bold text-white leading-snug break-words">${escapeHTML(g.name)}</h4>
            
            <div class="flex items-center justify-between text-xs font-mono">
              <span class="text-slate-400">${g.price ? `₩${Number(g.price).toLocaleString()}` : '가격 미기재'}</span>
              
              <!-- 🌟 실시간 보유 수량 카운터 UI -->
              <div class="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5" title="보유 수량">
                <button onclick="window.changeGoodsQuantity(${idx}, -1)" class="w-5 h-5 flex items-center justify-center rounded text-slate-400 hover:text-white hover:bg-slate-800 transition">
                  <i class="fa-solid fa-minus text-[9px]"></i>
                </button>
                <span class="px-2 text-xs font-bold ${quantity > 0 ? 'text-emerald-400' : 'text-slate-500'}">${quantity}개</span>
                <button onclick="window.changeGoodsQuantity(${idx}, 1)" class="w-5 h-5 flex items-center justify-center rounded text-slate-400 hover:text-white hover:bg-slate-800 transition">
                  <i class="fa-solid fa-plus text-[9px]"></i>
                </button>
              </div>
            </div>

            ${g.memo ? `
              <p class="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 leading-relaxed break-words whitespace-pre-wrap">
                ${escapeHTML(g.memo)}
              </p>
            ` : ''}
          </div>
        </div>

        <div class="px-4 pb-3 pt-1 border-t border-slate-800/60 flex justify-end gap-2 text-xs">
          <button onclick="window.openGoodsModal(${idx})" class="text-slate-400 hover:text-emerald-400 flex items-center gap-1">
            <i class="fa-solid fa-pen text-[10px]"></i> 수정
          </button>
          <button onclick="window.deleteGoods(${idx})" class="text-slate-500 hover:text-rose-400 flex items-center gap-1">
            <i class="fa-solid fa-trash text-[10px]"></i> 삭제
          </button>
        </div>
      </div>
    `;
  }).join('');
}

export function openGoodsModal(idx, currentGroup) {
  document.getElementById('edit-goods-idx').value = idx;
  document.getElementById('goods-file-input').value = '';

  if (idx >= 0) {
    const item = cloudData.goods[currentGroup][idx];
    document.getElementById('goods-modal-title').innerText = '굿즈 정보 수정';
    document.getElementById('goods-name').value = item.name || '';
    document.getElementById('goods-cat').value = item.cat || '';
    document.getElementById('goods-price').value = item.price || '';
    document.getElementById('goods-quantity').value = item.quantity !== undefined ? item.quantity : (item.owned ? 1 : 0);
    document.getElementById('goods-owned').value = String(Boolean(item.owned));
    document.getElementById('goods-memo').value = item.memo || '';
    document.getElementById('goods-img-base64').value = item.img || '';

    if (item.img) {
      document.getElementById('goods-img-preview').src = item.img;
      document.getElementById('goods-preview-wrap').classList.remove('hidden');
    } else {
      document.getElementById('goods-preview-wrap').classList.add('hidden');
    }
  } else {
    document.getElementById('goods-modal-title').innerText = '새 굿즈 등록';
    document.getElementById('goods-name').value = '';
    document.getElementById('goods-cat').value = '';
    document.getElementById('goods-price').value = '';
    document.getElementById('goods-quantity').value = 1;
    document.getElementById('goods-owned').value = 'true';
    document.getElementById('goods-memo').value = '';
    document.getElementById('goods-img-base64').value = '';
    document.getElementById('goods-preview-wrap').classList.add('hidden');
  }

  document.getElementById('goods-modal').classList.replace('hidden', 'flex');
}

export function saveGoods(currentGroup, onRender) {
  const idx = parseInt(document.getElementById('edit-goods-idx').value);
  const name = document.getElementById('goods-name').value.trim();
  const cat = document.getElementById('goods-cat').value.trim();
  const price = document.getElementById('goods-price').value.replace(/[^0-9]/g, '');
  const quantity = Math.max(0, parseInt(document.getElementById('goods-quantity').value) || 0);
  let owned = document.getElementById('goods-owned').value === 'true';

  // 수량이 0이면 미보유로, 1개 이상이면 보유로 자동 동기화
  if (quantity === 0) owned = false;
  else if (quantity > 0) owned = true;

  const memo = document.getElementById('goods-memo').value.trim();
  const img = document.getElementById('goods-img-base64').value;

  if (!name) return alert('굿즈 이름을 입력해주세요.');
  if (!cloudData.goods) cloudData.goods = { plave: [], wego6: [] };
  if (!cloudData.goods[currentGroup]) cloudData.goods[currentGroup] = [];

  const payload = {
    id: idx >= 0 ? cloudData.goods[currentGroup][idx].id : 'g_' + Date.now(),
    name, cat, price, quantity, owned, memo, img
  };

  if (idx >= 0) cloudData.goods[currentGroup][idx] = payload;
  else cloudData.goods[currentGroup].unshift(payload);

  window.closeModals();
  syncData(onRender);
}

// 🌟 보유 여부 토글 (미보유로 바꾸면 수량 0, 보유로 바꾸면 최소 1개 보장)
export function toggleGoodsOwned(idx, currentGroup, onRender) {
  const item = cloudData.goods[currentGroup][idx];
  if (item) {
    item.owned = !item.owned;
    if (item.owned && (!item.quantity || item.quantity === 0)) {
      item.quantity = 1;
    } else if (!item.owned) {
      item.quantity = 0;
    }
    syncData(onRender);
  }
}

// 🌟 카드에서 원클릭으로 수량 증감
export function changeGoodsQuantity(idx, delta, currentGroup, onRender) {
  const item = cloudData.goods[currentGroup][idx];
  if (item) {
    const currentQty = item.quantity !== undefined ? Number(item.quantity) : (item.owned ? 1 : 0);
    const newQty = Math.max(0, currentQty + delta);
    item.quantity = newQty;
    item.owned = newQty > 0;
    syncData(onRender);
  }
}

export function deleteGoods(idx, currentGroup, onRender) {
  if (!confirm('이 굿즈를 삭제하시겠습니까?')) return;
  cloudData.goods[currentGroup].splice(idx, 1);
  syncData(onRender);
}
