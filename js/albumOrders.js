import { cloudData, syncData } from './firebase.js';
import { escapeHTML } from './security.js';

let activeGroup = 'plave';

export function renderAlbumOrders(currentGroup) {
  if (currentGroup) activeGroup = currentGroup;

  if (!cloudData.albumOrders) cloudData.albumOrders = { plave: [], wego6: [] };
  if (!cloudData.albumOrders[activeGroup]) cloudData.albumOrders[activeGroup] = [];

  const sellers = cloudData.albumOrders[activeGroup];

  renderSellerTable(sellers);
  renderPurchasedTable(sellers);
  updateStats(sellers);
}

// 📌 1. 상단 판매처 목록 테이블 렌더링
function renderSellerTable(sellers) {
  const container = document.getElementById('seller-table-body');
  if (!container) return;

  if (sellers.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="12" class="py-10 text-center text-slate-500 text-xs">
          <i class="fa-solid fa-store text-2xl mb-2 block text-slate-600"></i>
          등록된 앨범 판매처가 없습니다. 우측 상단의 '판매처 등록' 버튼을 눌러 추가하세요.
        </td>
      </tr>
    `;
    return;
  }

  const todayStr = new Date().toISOString().slice(0, 10);

  container.innerHTML = sellers.map((s) => {
    const isChecked = Boolean(s.isPurchased);
    const unitPrice = Number(s.unitPrice) || 0;
    const shippingFee = Number(s.shippingFee) || 0;

    // 🌟 판매기간 2줄 레이아웃 및 폰트 선명화
    let periodHtml = '<span class="text-slate-500">-</span>';
    if (s.startDate && s.endDate) {
      periodHtml = `
        <div class="flex flex-col text-[11px] leading-snug font-mono text-slate-200">
          <span>${escapeHTML(s.startDate)}</span>
          <span class="text-[10px] text-slate-400 font-medium">~ ${escapeHTML(s.endDate)}</span>
        </div>
      `;
    } else if (s.startDate) {
      periodHtml = `<span class="font-mono text-[11px] text-slate-200">${escapeHTML(s.startDate)}</span>`;
    }

    let saleStatus = s.saleStatus || '판매중';
    if (s.endDate && s.endDate < todayStr && saleStatus === '판매중') {
      saleStatus = '마감';
    }

    return `
      <tr class="hover:bg-slate-800/40 text-xs transition border-b border-slate-800/60 ${isChecked ? 'bg-indigo-950/20' : ''}">
        <!-- 구매 여부 체크박스 -->
        <td class="py-3 px-3 text-center">
          <input type="checkbox" ${isChecked ? 'checked' : ''} onchange="window.toggleOrderPurchased('${s.id}')" class="w-4 h-4 accent-indigo-500 rounded cursor-pointer" title="구매 내역에 추가" />
        </td>

        <!-- 🌟 발매 앨범 (자연스러운 2줄 허용) -->
        <td class="py-3 px-3 font-bold text-white">
          <span class="text-indigo-300 font-semibold block leading-snug break-words">${escapeHTML(s.albumTitle || '공통')}</span>
        </td>

        <!-- 버전 -->
        <td class="py-3 px-3 font-medium text-slate-200 break-words">
          ${escapeHTML(s.version || '-')}
        </td>

        <!-- 🌟 판매국가 (줄바꿈 방지) -->
        <td class="py-3 px-3 text-center whitespace-nowrap">
          <span class="px-2 py-0.5 rounded text-[10px] font-bold border inline-block ${getCountryBadgeStyle(s.country)}">
            ${escapeHTML(s.country || '국내')}
          </span>
        </td>

        <!-- 🌟 판매기간 (2줄 & 선명한 색상) -->
        <td class="py-3 px-3 whitespace-nowrap">
          ${periodHtml}
        </td>

        <!-- 판매 상태 -->
        <td class="py-3 px-3 text-center whitespace-nowrap">
          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold border ${getSaleStatusStyle(saleStatus)}">
            ${escapeHTML(saleStatus)}
          </span>
        </td>

        <!-- 특전 여부 -->
        <td class="py-3 px-3 text-slate-200 whitespace-nowrap">
          ${s.benefits ? `<span class="text-pink-300 font-medium bg-pink-500/10 px-2 py-0.5 rounded-lg border border-pink-500/20 inline-block">${escapeHTML(s.benefits)}</span>` : '<span class="text-slate-600">-</span>'}
        </td>

        <!-- 판매처 -->
        <td class="py-3 px-3 font-semibold text-slate-200 whitespace-nowrap">
          ${escapeHTML(s.seller || '-')}
        </td>

        <!-- 단가 -->
        <td class="py-3 px-3 text-right font-mono text-slate-300 whitespace-nowrap">
          ₩${unitPrice.toLocaleString()}
        </td>

        <!-- 배송비 -->
        <td class="py-3 px-3 text-right font-mono text-slate-400 whitespace-nowrap">
          ${shippingFee > 0 ? `₩${shippingFee.toLocaleString()}` : '무료'}
        </td>

        <!-- 비고 -->
        <td class="py-3 px-3 text-slate-400 text-[11px] break-words">
          ${escapeHTML(s.memo || '-')}
        </td>

        <!-- 관리 -->
        <td class="py-3 px-3 text-center space-x-1 shrink-0">
          <button onclick="window.openSellerModal('${s.id}')" class="p-1 text-slate-400 hover:text-blue-400 transition" title="수정">
            <i class="fa-solid fa-pen text-[11px]"></i>
          </button>
          <button onclick="window.deleteSellerItem('${s.id}')" class="p-1 text-slate-500 hover:text-rose-400 transition" title="삭제">
            <i class="fa-solid fa-trash text-[11px]"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// 📌 2. 하단 [내 앨범 실구매 & 정산] 테이블 렌더링
function renderPurchasedTable(sellers) {
  const container = document.getElementById('purchased-table-body');
  if (!container) return;

  const purchasedList = sellers.filter(s => s.isPurchased);

  if (purchasedList.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="11" class="py-10 text-center text-slate-500 text-xs">
          <i class="fa-solid fa-cart-shopping text-2xl mb-2 block text-slate-600"></i>
          위 판매처 목록에서 구매한 항목의 체크박스를 선택하면 이곳에 나타납니다.
        </td>
      </tr>
    `;
    return;
  }

  container.innerHTML = purchasedList.map(item => {
    const unitPrice = Number(item.unitPrice) || 0;
    const shippingFee = Number(item.shippingFee) || 0;
    const qty = Number(item.quantity) || 1;
    const totalPrice = unitPrice * qty;

    const includeShipping = item.includeShipping !== undefined ? Boolean(item.includeShipping) : (shippingFee > 0);
    const addedShipping = includeShipping ? shippingFee : 0;
    const actualPrice = item.actualPrice !== undefined ? Number(item.actualPrice) : (totalPrice + addedShipping);

    return `
      <tr class="hover:bg-slate-800/40 text-xs transition border-b border-slate-800/60">
        <td class="py-3 px-3 font-bold text-slate-100 whitespace-nowrap">
          ${escapeHTML(item.seller || '-')}
        </td>

        <td class="py-3 px-3 font-bold text-white whitespace-nowrap">
          ${escapeHTML(item.version || '-')}
        </td>

        <td class="py-3 px-3 text-right font-mono text-slate-300 whitespace-nowrap">
          ₩${unitPrice.toLocaleString()}
        </td>

        <td class="py-2 px-3 text-center font-mono whitespace-nowrap">
          <div class="inline-flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5">
            <button onclick="window.changePurchaseQty('${item.id}', -1)" class="w-5 h-5 flex items-center justify-center rounded text-slate-400 hover:text-white hover:bg-slate-800">
              <i class="fa-solid fa-minus text-[9px]"></i>
            </button>
            <span class="px-2 font-bold text-cyan-400">${qty}</span>
            <button onclick="window.changePurchaseQty('${item.id}', 1)" class="w-5 h-5 flex items-center justify-center rounded text-slate-400 hover:text-white hover:bg-slate-800">
              <i class="fa-solid fa-plus text-[9px]"></i>
            </button>
          </div>
        </td>

        <td class="py-3 px-3 text-right font-mono text-slate-400 whitespace-nowrap">
          ₩${totalPrice.toLocaleString()}
        </td>

        <td class="py-3 px-3 text-center font-mono whitespace-nowrap">
          <label class="inline-flex items-center gap-1.5 cursor-pointer select-none">
            <input type="checkbox" ${includeShipping ? 'checked' : ''} onchange="window.toggleShippingIncluded('${item.id}')" class="w-3.5 h-3.5 accent-cyan-500 rounded cursor-pointer" />
            <span class="text-[11px] ${includeShipping ? 'text-cyan-300 font-bold' : 'text-slate-500 line-through'}">
              ${shippingFee > 0 ? `+₩${shippingFee.toLocaleString()}` : '무료'}
            </span>
          </label>
        </td>

        <td class="py-3 px-3 text-right font-mono font-bold text-amber-300 whitespace-nowrap">
          ₩${actualPrice.toLocaleString()}
        </td>

        <td class="py-2 px-3 text-center whitespace-nowrap">
          <select onchange="window.updatePurchaseStatus('${item.id}', this.value)" class="bg-slate-900 border border-slate-700/80 rounded-lg px-2 py-1 text-[11px] focus:outline-none focus:border-cyan-500 font-semibold ${getStatusTextColor(item.status)}">
            <option value="주문완료" ${item.status === '주문완료' ? 'selected' : ''}>주문완료</option>
            <option value="배송준비" ${item.status === '배송준비' ? 'selected' : ''}>배송준비</option>
            <option value="배송중" ${item.status === '배송중' ? 'selected' : ''}>배송중</option>
            <option value="배송완료" ${item.status === '배송완료' ? 'selected' : ''}>배송완료</option>
            <option value="취소/환불" ${item.status === '취소/환불' ? 'selected' : ''}>취소/환불</option>
          </select>
        </td>

        <td class="py-3 px-3 font-mono text-[11px] text-slate-300 whitespace-nowrap">
          ${escapeHTML(item.orderDate || '-')}
        </td>

        <td class="py-3 px-3 text-slate-400 text-[11px] break-words">
          ${escapeHTML(item.purchaseMemo || '-')}
        </td>

        <td class="py-3 px-3 text-center whitespace-nowrap">
          <button onclick="window.openPurchaseEditModal('${item.id}')" class="p-1 text-slate-400 hover:text-cyan-400 transition" title="실결제액/상세 수정">
            <i class="fa-solid fa-sliders text-xs"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// 📌 3. 실구매 총 수량 & 총 지출액 자동 계산
function updateStats(sellers) {
  const statCountEl = document.getElementById('order-stat-count');
  const statTotalEl = document.getElementById('order-stat-total');

  const purchasedList = sellers.filter(s => s.isPurchased);

  let totalCount = 0;
  let totalSpent = 0;

  purchasedList.forEach(item => {
    const qty = Number(item.quantity) || 1;
    const unitPrice = Number(item.unitPrice) || 0;
    const shippingFee = Number(item.shippingFee) || 0;
    const includeShipping = item.includeShipping !== undefined ? Boolean(item.includeShipping) : (shippingFee > 0);
    const addedShipping = includeShipping ? shippingFee : 0;

    const actual = item.actualPrice !== undefined ? Number(item.actualPrice) : (unitPrice * qty + addedShipping);

    totalCount += qty;
    totalSpent += actual;
  });

  if (statCountEl) statCountEl.innerText = totalCount.toLocaleString();
  if (statTotalEl) statTotalEl.innerText = `₩${totalSpent.toLocaleString()}`;
}

export function toggleShippingIncluded(sellerId, currentGroup, onRender) {
  const grp = currentGroup || activeGroup;
  const item = cloudData.albumOrders[grp].find(s => s.id === sellerId);
  if (item) {
    const shippingFee = Number(item.shippingFee) || 0;
    const currentInclude = item.includeShipping !== undefined ? Boolean(item.includeShipping) : (shippingFee > 0);
    const newInclude = !currentInclude;
    item.includeShipping = newInclude;

    const unit = Number(item.unitPrice) || 0;
    const qty = Number(item.quantity) || 1;
    item.actualPrice = (unit * qty) + (newInclude ? shippingFee : 0);

    syncData(onRender);
  }
}

export function changePurchaseQty(sellerId, delta, currentGroup, onRender) {
  const grp = currentGroup || activeGroup;
  const item = cloudData.albumOrders[grp].find(s => s.id === sellerId);
  if (item) {
    const curQty = Number(item.quantity) || 1;
    const newQty = Math.max(1, curQty + delta);
    const unit = Number(item.unitPrice) || 0;
    const shippingFee = Number(item.shippingFee) || 0;
    const includeShipping = item.includeShipping !== undefined ? Boolean(item.includeShipping) : (shippingFee > 0);

    item.quantity = newQty;
    item.actualPrice = (unit * newQty) + (includeShipping ? shippingFee : 0);
    syncData(onRender);
  }
}

export function toggleOrderPurchased(sellerId, currentGroup, onRender) {
  const grp = currentGroup || activeGroup;
  const item = cloudData.albumOrders[grp].find(s => s.id === sellerId);
  if (item) {
    item.isPurchased = !item.isPurchased;
    if (item.isPurchased) {
      if (!item.quantity) item.quantity = 1;
      if (!item.status) item.status = '주문완료';
      if (!item.orderDate) item.orderDate = new Date().toISOString().slice(0, 10);
      const shippingFee = Number(item.shippingFee) || 0;
      if (item.includeShipping === undefined) item.includeShipping = shippingFee > 0;
      if (item.actualPrice === undefined) {
        item.actualPrice = (Number(item.unitPrice) || 0) * item.quantity + (item.includeShipping ? shippingFee : 0);
      }
    }
    syncData(onRender);
  }
}

function populateAlbumSelect(currentVal = '') {
  const selectEl = document.getElementById('seller-album-select');
  const customInput = document.getElementById('seller-album-custom');
  if (!selectEl) return;

  const albums = (cloudData.albums && cloudData.albums[activeGroup]) || [];
  const albumTitles = albums.map(a => a.title).filter(Boolean);
  const isCustom = currentVal && !albumTitles.includes(currentVal);

  selectEl.innerHTML = `
    <option value="" disabled ${!currentVal ? 'selected' : ''}>발매 앨범을 선택하세요</option>
    ${albumTitles.map(t => `<option value="${escapeHTML(t)}" ${t === currentVal ? 'selected' : ''}>${escapeHTML(t)}</option>`).join('')}
    <option value="__custom__" ${isCustom ? 'selected' : ''}>✏️ 직접 입력하기</option>
  `;

  if (customInput) {
    if (isCustom) {
      customInput.classList.remove('hidden');
      customInput.value = currentVal;
    } else {
      customInput.classList.add('hidden');
      customInput.value = '';
    }
  }
}

window.handleSellerAlbumChange = function(val) {
  const customInput = document.getElementById('seller-album-custom');
  if (!customInput) return;
  if (val === '__custom__') {
    customInput.classList.remove('hidden');
    customInput.focus();
  } else {
    customInput.classList.add('hidden');
    customInput.value = '';
  }
};

export function openSellerModal(sellerId = null, currentGroup) {
  if (currentGroup) activeGroup = currentGroup;

  const modal = document.getElementById('seller-modal');
  if (!modal) return alert('seller-modal 창을 찾을 수 없습니다.');

  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = (val !== undefined && val !== null) ? val : '';
  };

  setVal('edit-seller-id', sellerId || '');
  const modalTitle = document.getElementById('seller-modal-title');

  if (sellerId) {
    const item = (cloudData.albumOrders[activeGroup] || []).find(s => s.id === sellerId);
    if (!item) return;
    if (modalTitle) modalTitle.innerHTML = `<i class="fa-solid fa-pen text-blue-400"></i> 판매처 정보 수정`;
    populateAlbumSelect(item.albumTitle || '');
    setVal('seller-version', item.version);
    setVal('seller-name', item.seller);
    setVal('seller-country', item.country || '국내');
    setVal('seller-start-date', item.startDate);
    setVal('seller-end-date', item.endDate);
    setVal('seller-sale-status', item.saleStatus || '판매중');
    setVal('seller-benefits', item.benefits);
    setVal('seller-unit-price', item.unitPrice);
    setVal('seller-shipping-fee', item.shippingFee);
    setVal('seller-memo', item.memo);
  } else {
    if (modalTitle) modalTitle.innerHTML = `<i class="fa-solid fa-store text-blue-400"></i> 새 판매처 등록`;
    populateAlbumSelect('');
    setVal('seller-version', '');
    setVal('seller-name', '');
    setVal('seller-country', '국내');
    setVal('seller-start-date', '');
    setVal('seller-end-date', '');
    setVal('seller-sale-status', '판매중');
    setVal('seller-benefits', '');
    setVal('seller-unit-price', '');
    setVal('seller-shipping-fee', '');
    setVal('seller-memo', '');
  }

  modal.classList.replace('hidden', 'flex');
}

export function saveSellerItem(currentGroup, onRender) {
  const grp = currentGroup || activeGroup;
  const getVal = id => (document.getElementById(id)?.value || '').trim();

  const editId = getVal('edit-seller-id');
  const albumSelectVal = getVal('seller-album-select');
  const albumCustomVal = getVal('seller-album-custom');
  const albumTitle = (albumSelectVal === '__custom__' || !albumSelectVal) ? albumCustomVal : albumSelectVal;

  const version = getVal('seller-version');
  const seller = getVal('seller-name');
  const country = getVal('seller-country') || '국내';
  const startDate = getVal('seller-start-date');
  const endDate = getVal('seller-end-date');
  const saleStatus = getVal('seller-sale-status') || '판매중';
  const benefits = getVal('seller-benefits');
  const unitPrice = Number(getVal('seller-unit-price')) || 0;
  const shippingFee = Number(getVal('seller-shipping-fee')) || 0;
  const memo = getVal('seller-memo');

  if (!albumTitle || !version || !seller) {
    return alert('발매 앨범, 버전, 판매처는 필수 입력 항목입니다.');
  }

  if (!cloudData.albumOrders[grp]) cloudData.albumOrders[grp] = [];

  const payload = {
    albumTitle, version, seller, country, startDate, endDate, saleStatus,
    benefits, unitPrice, shippingFee, memo
  };

  if (editId) {
    const idx = cloudData.albumOrders[grp].findIndex(s => s.id === editId);
    if (idx !== -1) {
      cloudData.albumOrders[grp][idx] = { ...cloudData.albumOrders[grp][idx], ...payload };
    }
  } else {
    cloudData.albumOrders[grp].unshift({
      id: 'sel_' + Date.now(),
      isPurchased: false,
      ...payload,
      quantity: 1,
      includeShipping: shippingFee > 0,
      actualPrice: unitPrice + shippingFee,
      status: '주문완료',
      orderDate: new Date().toISOString().slice(0, 10),
      purchaseMemo: ''
    });
  }

  window.closeModals();
  syncData(onRender);
}

export function updatePurchaseStatus(sellerId, newStatus, currentGroup, onRender) {
  const grp = currentGroup || activeGroup;
  const item = cloudData.albumOrders[grp].find(s => s.id === sellerId);
  if (item) {
    item.status = newStatus;
    syncData(onRender);
  }
}

export function deleteSellerItem(sellerId, currentGroup, onRender) {
  const grp = currentGroup || activeGroup;
  if (!confirm('이 판매처 항목을 삭제하시겠습니까? (구매 내역에서도 함께 삭제됩니다)')) return;
  cloudData.albumOrders[grp] = cloudData.albumOrders[grp].filter(s => s.id !== sellerId);
  syncData(onRender);
}

export function openPurchaseEditModal(sellerId, currentGroup) {
  if (currentGroup) activeGroup = currentGroup;
  const item = cloudData.albumOrders[activeGroup].find(s => s.id === sellerId);
  if (!item) return;

  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = (val !== undefined && val !== null) ? val : '';
  };

  setVal('edit-purchase-seller-id', sellerId);
  const infoEl = document.getElementById('purchase-modal-seller-info');
  if (infoEl) infoEl.innerText = `${item.seller} (${item.version})`;

  const shippingFee = Number(item.shippingFee) || 0;
  const includeShipping = item.includeShipping !== undefined ? Boolean(item.includeShipping) : (shippingFee > 0);

  const chkEl = document.getElementById('edit-purchase-include-shipping');
  if (chkEl) chkEl.checked = includeShipping;

  const shipDisp = document.getElementById('edit-purchase-shipping-display');
  if (shipDisp) shipDisp.innerText = `+₩${shippingFee.toLocaleString()}`;

  setVal('edit-purchase-qty', item.quantity || 1);
  setVal('edit-purchase-actual', item.actualPrice !== undefined ? item.actualPrice : (Number(item.unitPrice) || 0) * (item.quantity || 1) + (includeShipping ? shippingFee : 0));
  setVal('edit-purchase-status', item.status || '주문완료');
  setVal('edit-purchase-date', item.orderDate || '');
  setVal('edit-purchase-memo', item.purchaseMemo || '');

  document.getElementById('purchase-edit-modal')?.classList.replace('hidden', 'flex');
}

export function calcPurchaseModalTotal() {
  const sellerId = document.getElementById('edit-purchase-seller-id')?.value;
  const item = cloudData.albumOrders[activeGroup]?.find(s => s.id === sellerId);
  if (!item) return;

  const qty = Number(document.getElementById('edit-purchase-qty')?.value) || 1;
  const unit = Number(item.unitPrice) || 0;
  const shippingFee = Number(item.shippingFee) || 0;
  const includeShipping = Boolean(document.getElementById('edit-purchase-include-shipping')?.checked);

  const actualEl = document.getElementById('edit-purchase-actual');
  if (actualEl) actualEl.value = (unit * qty) + (includeShipping ? shippingFee : 0);
}

export function savePurchaseDetail(currentGroup, onRender) {
  const grp = currentGroup || activeGroup;
  const sellerId = document.getElementById('edit-purchase-seller-id')?.value;
  const item = cloudData.albumOrders[grp]?.find(s => s.id === sellerId);
  if (!item) return;

  item.quantity = Math.max(1, parseInt(document.getElementById('edit-purchase-qty')?.value) || 1);
  item.includeShipping = Boolean(document.getElementById('edit-purchase-include-shipping')?.checked);
  item.actualPrice = Number(document.getElementById('edit-purchase-actual')?.value) || 0;
  item.status = document.getElementById('edit-purchase-status')?.value || '주문완료';
  item.orderDate = document.getElementById('edit-purchase-date')?.value || '';
  item.purchaseMemo = (document.getElementById('edit-purchase-memo')?.value || '').trim();

  window.closeModals();
  syncData(onRender);
}

function getCountryBadgeStyle(country) {
  switch (country) {
    case '국내': return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40';
    case '일본': return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
    case '글로벌': return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
    case '중국': return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    default: return 'bg-slate-800 text-slate-300 border-slate-700';
  }
}

function getSaleStatusStyle(status) {
  switch (status) {
    case '판매중': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
    case '마감': return 'bg-slate-800 text-slate-400 border-slate-700 line-through';
    case '품절': return 'bg-rose-500/20 text-rose-400 border-rose-500/40';
    case '예약중': return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
    default: return 'bg-slate-800 text-slate-300 border-slate-700';
  }
}

function getStatusTextColor(status) {
  switch (status) {
    case '배송완료': return 'text-emerald-400';
    case '배송중': return 'text-cyan-400';
    case '배송준비': return 'text-amber-400';
    case '취소/환불': return 'text-rose-400';
    default: return 'text-slate-300';
  }
}
