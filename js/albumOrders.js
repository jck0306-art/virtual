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
        <td colspan="10" class="py-10 text-center text-slate-500 text-xs">
          <i class="fa-solid fa-store text-2xl mb-2 block text-slate-600"></i>
          등록된 앨범 판매처가 없습니다. 우측 상단의 '판매처 등록' 버튼을 눌러 추가하세요.
        </td>
      </tr>
    `;
    return;
  }

  container.innerHTML = sellers.map((s, idx) => {
    const isChecked = Boolean(s.isPurchased);
    const unitPrice = Number(s.unitPrice) || 0;
    const shippingFee = Number(s.shippingFee) || 0;

    let periodStr = '-';
    if (s.startDate && s.endDate) periodStr = `${s.startDate} ~ ${s.endDate}`;
    else if (s.startDate) periodStr = s.startDate;

    return `
      <tr class="hover:bg-slate-800/40 text-xs transition border-b border-slate-800/60 ${isChecked ? 'bg-indigo-950/20' : ''}">
        <!-- 구매 여부 체크박스 -->
        <td class="py-3 px-3 text-center">
          <input type="checkbox" ${isChecked ? 'checked' : ''} onchange="window.toggleOrderPurchased('${s.id}')" class="w-4 h-4 accent-indigo-500 rounded cursor-pointer" title="구매 내역에 추가" />
        </td>

        <!-- 판매국가 -->
        <td class="py-3 px-3 text-center">
          <span class="px-2 py-0.5 rounded text-[10px] font-bold border ${getCountryBadgeStyle(s.country)}">
            ${escapeHTML(s.country || '국내')}
          </span>
        </td>

        <!-- 판매기간 -->
        <td class="py-3 px-3 font-mono text-[11px] text-slate-300 whitespace-nowrap">
          ${escapeHTML(periodStr)}
        </td>

        <!-- 버전 -->
        <td class="py-3 px-3 font-bold text-white">
          ${escapeHTML(s.version || '-')}
        </td>

        <!-- 특전 여부 -->
        <td class="py-3 px-3 text-slate-300">
          ${s.benefits ? `<span class="text-pink-300 font-medium">${escapeHTML(s.benefits)}</span>` : '<span class="text-slate-600">-</span>'}
        </td>

        <!-- 판매처 -->
        <td class="py-3 px-3 font-semibold text-slate-200">
          ${escapeHTML(s.seller || '-')}
        </td>

        <!-- 단가 -->
        <td class="py-3 px-3 text-right font-mono text-slate-300">
          ₩${unitPrice.toLocaleString()}
        </td>

        <!-- 배송비 -->
        <td class="py-3 px-3 text-right font-mono text-slate-400">
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
        <td colspan="10" class="py-10 text-center text-slate-500 text-xs">
          <i class="fa-solid fa-cart-shopping text-2xl mb-2 block text-slate-600"></i>
          위 판매처 목록에서 구매한 항목의 체크박스를 선택하면 이곳에 나타납니다.
        </td>
      </tr>
    `;
    return;
  }

  container.innerHTML = purchasedList.map(item => {
    const unitPrice = Number(item.unitPrice) || 0;
    const qty = Number(item.quantity) || 1;
    const totalPrice = unitPrice * qty;
    const actualPrice = item.actualPrice !== undefined ? Number(item.actualPrice) : (totalPrice + (Number(item.shippingFee) || 0));

    return `
      <tr class="hover:bg-slate-800/40 text-xs transition border-b border-slate-800/60">
        <!-- 판매처 -->
        <td class="py-3 px-3 font-semibold text-slate-200">
          ${escapeHTML(item.seller || '-')}
        </td>

        <!-- 버전 -->
        <td class="py-3 px-3 font-bold text-white">
          ${escapeHTML(item.version || '-')}
        </td>

        <!-- 단가 -->
        <td class="py-3 px-3 text-right font-mono text-slate-300">
          ₩${unitPrice.toLocaleString()}
        </td>

        <!-- 수량 증감 버튼 -->
        <td class="py-2 px-3 text-center font-mono">
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

        <!-- 총액 (단가 * 수량) -->
        <td class="py-3 px-3 text-right font-mono text-slate-400">
          ₩${totalPrice.toLocaleString()}
        </td>

        <!-- 실결제액 -->
        <td class="py-3 px-3 text-right font-mono font-bold text-amber-300">
          ₩${actualPrice.toLocaleString()}
        </td>

        <!-- 배송 상태 드롭다운 -->
        <td class="py-2 px-3 text-center">
          <select onchange="window.updatePurchaseStatus('${item.id}', this.value)" class="bg-slate-900 border border-slate-700/80 rounded-lg px-2 py-1 text-[11px] focus:outline-none focus:border-cyan-500 font-semibold ${getStatusTextColor(item.status)}">
            <option value="주문완료" ${item.status === '주문완료' ? 'selected' : ''}>주문완료</option>
            <option value="배송준비" ${item.status === '배송준비' ? 'selected' : ''}>배송준비</option>
            <option value="배송중" ${item.status === '배송중' ? 'selected' : ''}>배송중</option>
            <option value="배송완료" ${item.status === '배송완료' ? 'selected' : ''}>배송완료</option>
            <option value="취소/환불" ${item.status === '취소/환불' ? 'selected' : ''}>취소/환불</option>
          </select>
        </td>

        <!-- 결제일 -->
        <td class="py-3 px-3 font-mono text-[11px] text-slate-300">
          ${escapeHTML(item.orderDate || '-')}
        </td>

        <!-- 구매 메모 -->
        <td class="py-3 px-3 text-slate-400 text-[11px] break-words">
          ${escapeHTML(item.purchaseMemo || '-')}
        </td>

        <!-- 상세 수정 버튼 -->
        <td class="py-3 px-3 text-center">
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
    const shipping = Number(item.shippingFee) || 0;
    const actual = item.actualPrice !== undefined ? Number(item.actualPrice) : (unitPrice * qty + shipping);

    totalCount += qty;
    totalSpent += actual;
  });

  if (statCountEl) statCountEl.innerText = totalCount.toLocaleString();
  if (statTotalEl) statTotalEl.innerText = `₩${totalSpent.toLocaleString()}`;
}

// 🌟 체크박스 토글 함수 (구매여부 전환)
export function toggleOrderPurchased(sellerId, currentGroup, onRender) {
  const grp = currentGroup || activeGroup;
  const item = cloudData.albumOrders[grp].find(s => s.id === sellerId);
  if (item) {
    item.isPurchased = !item.isPurchased;
    if (item.isPurchased) {
      if (!item.quantity) item.quantity = 1;
      if (!item.status) item.status = '주문완료';
      if (!item.orderDate) item.orderDate = new Date().toISOString().slice(0, 10);
      if (item.actualPrice === undefined) {
        item.actualPrice = (Number(item.unitPrice) || 0) * item.quantity + (Number(item.shippingFee) || 0);
      }
    }
    syncData(onRender);
  }
}

// 🌟 수량 증감
export function changePurchaseQty(sellerId, delta, currentGroup, onRender) {
  const grp = currentGroup || activeGroup;
  const item = cloudData.albumOrders[grp].find(s => s.id === sellerId);
  if (item) {
    const curQty = Number(item.quantity) || 1;
    const newQty = Math.max(1, curQty + delta);
    const unit = Number(item.unitPrice) || 0;
    const shipping = Number(item.shippingFee) || 0;

    // 수량 변경 시 실결제액도 단가 비율에 맞게 비례 조정
    item.quantity = newQty;
    item.actualPrice = (unit * newQty) + shipping;
    syncData(onRender);
  }
}

// 🌟 배송 상태 변경
export function updatePurchaseStatus(sellerId, newStatus, currentGroup, onRender) {
  const grp = currentGroup || activeGroup;
  const item = cloudData.albumOrders[grp].find(s => s.id === sellerId);
  if (item) {
    item.status = newStatus;
    syncData(onRender);
  }
}

// 🌟 판매처 모달 제어
export function openSellerModal(sellerId = null, currentGroup) {
  if (currentGroup) activeGroup = currentGroup;
  document.getElementById('edit-seller-id').value = sellerId || '';
  const modalTitle = document.getElementById('seller-modal-title');

  if (sellerId) {
    const item = cloudData.albumOrders[activeGroup].find(s => s.id === sellerId);
    if (!item) return;
    modalTitle.innerHTML = `<i class="fa-solid fa-pen text-blue-400"></i> 판매처 정보 수정`;
    document.getElementById('seller-country').value = item.country || '국내';
    document.getElementById('seller-start-date').value = item.startDate || '';
    document.getElementById('seller-end-date').value = item.endDate || '';
    document.getElementById('seller-version').value = item.version || '';
    document.getElementById('seller-name').value = item.seller || '';
    document.getElementById('seller-benefits').value = item.benefits || '';
    document.getElementById('seller-unit-price').value = item.unitPrice !== undefined ? item.unitPrice : '';
    document.getElementById('seller-shipping-fee').value = item.shippingFee !== undefined ? item.shippingFee : '';
    document.getElementById('seller-memo').value = item.memo || '';
  } else {
    modalTitle.innerHTML = `<i class="fa-solid fa-store text-blue-400"></i> 새 판매처 등록`;
    document.getElementById('seller-country').value = '국내';
    document.getElementById('seller-start-date').value = '';
    document.getElementById('seller-end-date').value = '';
    document.getElementById('seller-version').value = '';
    document.getElementById('seller-name').value = '';
    document.getElementById('seller-benefits').value = '';
    document.getElementById('seller-unit-price').value = '';
    document.getElementById('seller-shipping-fee').value = '';
    document.getElementById('seller-memo').value = '';
  }

  document.getElementById('seller-modal').classList.replace('hidden', 'flex');
}

export function saveSellerItem(currentGroup, onRender) {
  const grp = currentGroup || activeGroup;
  const editId = document.getElementById('edit-seller-id').value;
  const country = document.getElementById('seller-country').value;
  const startDate = document.getElementById('seller-start-date').value;
  const endDate = document.getElementById('seller-end-date').value;
  const version = document.getElementById('seller-version').value.trim();
  const seller = document.getElementById('seller-name').value.trim();
  const benefits = document.getElementById('seller-benefits').value.trim();
  const unitPrice = Number(document.getElementById('seller-unit-price').value) || 0;
  const shippingFee = Number(document.getElementById('seller-shipping-fee').value) || 0;
  const memo = document.getElementById('seller-memo').value.trim();

  if (!version || !seller) return alert('버전과 판매처는 필수 입력 항목입니다.');

  if (!cloudData.albumOrders[grp]) cloudData.albumOrders[grp] = [];

  if (editId) {
    const idx = cloudData.albumOrders[grp].findIndex(s => s.id === editId);
    if (idx !== -1) {
      cloudData.albumOrders[grp][idx] = {
        ...cloudData.albumOrders[grp][idx],
        country, startDate, endDate, version, seller, benefits, unitPrice, shippingFee, memo
      };
    }
  } else {
    cloudData.albumOrders[grp].unshift({
      id: 'sel_' + Date.now(),
      isPurchased: false,
      country, startDate, endDate, version, seller, benefits, unitPrice, shippingFee, memo,
      quantity: 1,
      actualPrice: unitPrice + shippingFee,
      status: '주문완료',
      orderDate: new Date().toISOString().slice(0, 10),
      purchaseMemo: ''
    });
  }

  window.closeModals();
  syncData(onRender);
}

export function deleteSellerItem(sellerId, currentGroup, onRender) {
  const grp = currentGroup || activeGroup;
  if (!confirm('이 판매처 항목을 삭제하시겠습니까? (구매 내역에서도 함께 삭제됩니다)')) return;
  cloudData.albumOrders[grp] = cloudData.albumOrders[grp].filter(s => s.id !== sellerId);
  syncData(onRender);
}

// 🌟 구매 상세 정보 모달
export function openPurchaseEditModal(sellerId, currentGroup) {
  if (currentGroup) activeGroup = currentGroup;
  const item = cloudData.albumOrders[activeGroup].find(s => s.id === sellerId);
  if (!item) return;

  document.getElementById('edit-purchase-seller-id').value = sellerId;
  document.getElementById('purchase-modal-seller-info').innerText = `[${item.seller}] ${item.version}`;
  document.getElementById('edit-purchase-qty').value = item.quantity || 1;
  document.getElementById('edit-purchase-actual').value = item.actualPrice !== undefined ? item.actualPrice : (Number(item.unitPrice) || 0) * (item.quantity || 1);
  document.getElementById('edit-purchase-status').value = item.status || '주문완료';
  document.getElementById('edit-purchase-date').value = item.orderDate || '';
  document.getElementById('edit-purchase-memo').value = item.purchaseMemo || '';

  document.getElementById('purchase-edit-modal').classList.replace('hidden', 'flex');
}

export function calcPurchaseModalTotal() {
  const sellerId = document.getElementById('edit-purchase-seller-id').value;
  const item = cloudData.albumOrders[activeGroup].find(s => s.id === sellerId);
  if (!item) return;

  const qty = Number(document.getElementById('edit-purchase-qty').value) || 1;
  const unit = Number(item.unitPrice) || 0;
  const shipping = Number(item.shippingFee) || 0;
  document.getElementById('edit-purchase-actual').value = (unit * qty) + shipping;
}

export function savePurchaseDetail(currentGroup, onRender) {
  const grp = currentGroup || activeGroup;
  const sellerId = document.getElementById('edit-purchase-seller-id').value;
  const item = cloudData.albumOrders[grp].find(s => s.id === sellerId);
  if (!item) return;

  item.quantity = Math.max(1, parseInt(document.getElementById('edit-purchase-qty').value) || 1);
  item.actualPrice = Number(document.getElementById('edit-purchase-actual').value) || 0;
  item.status = document.getElementById('edit-purchase-status').value;
  item.orderDate = document.getElementById('edit-purchase-date').value;
  item.purchaseMemo = document.getElementById('edit-purchase-memo').value.trim();

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

function getStatusTextColor(status) {
  switch (status) {
    case '배송완료': return 'text-emerald-400';
    case '배송중': return 'text-cyan-400';
    case '배송준비': return 'text-amber-400';
    case '취소/환불': return 'text-rose-400';
    default: return 'text-slate-300';
  }
}
