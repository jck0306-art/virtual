import { cloudData, syncData } from './firebase.js';

export function renderGoods(currentGroup) {
  const goods = (cloudData.goods && cloudData.goods[currentGroup]) || [];
  const goodsGrid = document.getElementById('goods-grid');
  if (!goodsGrid) return;

  if (goods.length === 0) {
    goodsGrid.innerHTML = `<p class="text-xs text-slate-500 py-10 col-span-3 text-center">등록된 굿즈가 없습니다.</p>`;
  } else {
    goodsGrid.innerHTML = goods.map((gItem, idx) => `
      <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg flex flex-col justify-between group">
        <div>
          ${gItem.img ? `
            <div class="w-full h-44 bg-slate-950 overflow-hidden relative border-b border-slate-800">
              <img src="${gItem.img}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
            </div>
          ` : `
            <div class="w-full h-28 bg-slate-950/60 flex items-center justify-center border-b border-slate-800 text-slate-600">
              <i class="fa-solid fa-box-open text-2xl"></i>
            </div>
          `}
          <div class="p-4">
            <div class="flex items-center justify-between gap-2 mb-2">
              <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">${gItem.cat || '굿즈'}</span>
              <button onclick="window.toggleGoodsOwned(${idx})" class="text-[10px] font-bold px-2.5 py-0.5 rounded-full border transition flex items-center gap-1 ${
                gItem.owned ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-slate-800 text-slate-400 border-slate-700'
              }">
                <i class="fa-solid ${gItem.owned ? 'fa-check' : 'fa-xmark'} text-[9px]"></i> ${gItem.owned ? '보유' : '미보유'}
              </button>
            </div>
            <h4 class="text-sm font-bold text-white">${gItem.name}</h4>
            <p class="text-xs font-semibold text-slate-300 mt-1">가격: <span class="text-emerald-400 font-bold">${gItem.price ? `${Number(gItem.price.replace(/,/g, '')).toLocaleString()}원` : '미입력'}</span></p>
            <p class="text-xs text-slate-400 mt-1.5 leading-relaxed bg-slate-950/40 p-2 rounded-lg border border-slate-800/80">${gItem.memo || '메모 없음'}</p>
          </div>
        </div>
        <div class="px-4 pb-3 pt-1 border-t border-slate-800/60 flex justify-end gap-2 text-xs">
          <button onclick="window.openGoodsModal(${idx})" class="text-slate-400 hover:text-indigo-400 flex items-center gap-1"><i class="fa-solid fa-pen text-[10px]"></i> 수정</button>
          <button onclick="window.deleteGoods(${idx})" class="text-slate-500 hover:text-rose-400 flex items-center gap-1"><i class="fa-solid fa-trash text-[10px]"></i> 삭제</button>
        </div>
      </div>
    `).join('');
  }
}

export function openGoodsModal(idx, currentGroup) {
  document.getElementById('edit-goods-idx').value = idx;
  document.getElementById('goods-file-input').value = '';
  if (idx >= 0) {
    const item = cloudData.goods[currentGroup][idx];
    document.getElementById('goods-modal-title').innerText = '굿즈 정보 수정';
    document.getElementById('goods-name').value = item.name;
    document.getElementById('goods-cat').value = item.cat || '';
    document.getElementById('goods-price').value = item.price || '';
    document.getElementById('goods-owned').value = item.owned ? 'true' : 'false';
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
  const img = document.getElementById('goods-img-base64').value;
  const cat = document.getElementById('goods-cat').value.trim();
  const price = document.getElementById('goods-price').value.trim();
  const owned = document.getElementById('goods-owned').value === 'true';
  const memo = document.getElementById('goods-memo').value.trim();

  if (!name) return alert('굿즈 이름을 입력해주세요.');
  if (!cloudData.goods[currentGroup]) cloudData.goods[currentGroup] = [];

  const payload = { name, img, cat, price, owned, memo };
  if (idx >= 0) cloudData.goods[currentGroup][idx] = payload;
  else cloudData.goods[currentGroup].unshift(payload);

  window.closeModals();
  syncData(onRender);
}

export function toggleGoodsOwned(idx, currentGroup, onRender) {
  cloudData.goods[currentGroup][idx].owned = !cloudData.goods[currentGroup][idx].owned;
  syncData(onRender);
}

export function deleteGoods(idx, currentGroup, onRender) {
  if (!confirm('이 굿즈를 삭제하시겠습니까?')) return;
  cloudData.goods[currentGroup].splice(idx, 1);
  syncData(onRender);
}