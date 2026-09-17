import { cloudData, syncData } from './firebase.js';
import { escapeHTML } from './security.js';

export function renderAlbumOrders(currentGroup) {
  const container = document.getElementById('album-orders-table-body');
  const statCountEl = document.getElementById('order-stat-count');
  const statTotalEl = document.getElementById('order-stat-total');

  if (!container) return;

  const orders = (cloudData.albumOrders && cloudData.albumOrders[currentGroup]) || [];

  let totalCount = 0;
  let totalSpent = 0;

  orders.forEach(item => {
    totalCount += Number(item.quantity) || 0;
    totalSpent += Number(item.actualPrice) || 0;
  });

  if (statCountEl) statCountEl.innerText = totalCount.toLocaleString();
  if (statTotalEl) statTotalEl.innerText = `₩${totalSpent.toLocaleString()}`;

  if (orders.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="12" class="py-12 text-center text-slate-500 text-xs">
          <i class="fa-solid fa-receipt text-2xl mb-2 block text-slate-600"></i>
          등록된 앨범 구매 내역이 없습니다. 상단의 '구매 등록' 버튼을 눌러 추가하세요.
        </td>
      </tr>
    `;
    return;
  }

  container.innerHTML = orders.map((item, idx) => {
    const unitPrice = Number(item.unitPrice) || 0;
    const quantity = Number(item.quantity) || 0;
    const totalPrice = Number(item.totalPrice) || (unitPrice * quantity);
    const actualPrice = Number(item.actualPrice) || 0;

    // 기간 포맷 생성
    let displayPeriod = '-';
    if (item.startDate && item.endDate) {
      displayPeriod = `${item.startDate} ~ ${item.endDate}`;
    } else if (item.startDate) {
      displayPeriod = item.startDate;
    } else if (item.period) {
      displayPeriod = item.period;
    }

    return `
      <tr class="hover:bg-slate-800/40 text-xs transition border-b border-slate-800/60">
        <td class="py-3 px-3 text-center">
          <span class="px-2 py-0.5 rounded text-[10px] font-bold border ${getCountryBadgeStyle(item.country)}">
            ${escapeHTML(item.country || '국내')}
          </span>
        </td>

        <td class="py-3 px-3 font-mono text-[11px] text-slate-300 whitespace-nowrap">
          ${escapeHTML(displayPeriod)}
        </td>

        <td class="py-3 px-3 font-bold text-white">
          ${escapeHTML(item.version || '-')}
        </td>

        <td class="py-3 px-3 text-center text-slate-300">
          ${item.benefits ? `<span class="text-pink-300 font-medium">${escapeHTML(item.benefits)}</span>` : '<span class="text-slate-600">-</span>'}
        </td>

        <td class="py-3 px-3 font-semibold text-slate-200">
          ${escapeHTML(item.seller || '-')}
        </td>

        <td class="py-3 px-3 text-right font-mono text-slate-300">
          ₩${unitPrice.toLocaleString()}
        </td>

        <td class="py-3 px-3 text-center font-mono font-bold text-cyan-400">
          ${quantity}
        </td>

        <td class="py-3 px-3 text-right font-mono text-slate-400">
          ₩${totalPrice.toLocaleString()}
        </td>

        <td class="py-3 px-3 text-right font-mono font-bold text-amber-300">
          ₩${actualPrice.toLocaleString()}
        </td>

        <td class="py-2 px-3 text-center">
          <select onchange="window.updateOrderStatus(${idx}, this.value)" class="bg-slate-900 border border-slate-700/80 rounded-lg px-2 py-1 text-[11px] focus:outline-none focus:border-blue-500 font-semibold ${getStatusTextColor(item.status)}">
            <option value="주문완료" ${item.status === '주문완료' ? 'selected' : ''}>주문완료</option>
            <option value="배송준비" ${item.status === '배송준비' ? 'selected' : ''}>배송준비</option>
            <option value="배송중" ${item.status === '배송중' ? 'selected' : ''}>배송중</option>
            <option value="배송완료" ${item.status === '배송완료' ? 'selected' : ''}>배송완료</option>
            <option value="취소/환불" ${item.status === '취소/환불' ? 'selected' : ''}>취소/환불</option>
          </select>
        </td>

        <td class="py-3 px-3 text-slate-400 text-[11px] break-words">
          ${escapeHTML(item.memo || '-')}
        </td>

        <td class="py-3 px-3 text-center space-x-1 shrink-0">
          <button onclick="window.openAlbumOrderModal(${idx})" class="p-1 text-slate-400 hover:text-blue-400 transition" title="수정">
            <i class="fa-solid fa-pen text-[11px]"></i>
          </button>
          <button onclick="window.deleteAlbumOrder(${idx})" class="p-1 text-slate-500 hover:text-rose-400 transition" title="삭제">
            <i class="fa-solid fa-trash text-[11px]"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');
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

export function calcOrderTotalModal() {
  const unit = Number(document.getElementById('order-unit-price').value) || 0;
  const qty = Number(document.getElementById('order-quantity').value) || 0;
  const total = unit * qty;
  const totalEl = document.getElementById('order-total-price');
  const actualEl = document.getElementById('order-actual-price');

  if (totalEl) totalEl.value = total;
  if (actualEl && (!actualEl.value || actualEl.dataset.autoSync === 'true')) {
    actualEl.value = total;
    actualEl.dataset.autoSync = 'true';
  }
}

export function openAlbumOrderModal(idx = -1, currentGroup) {
  document.getElementById('edit-album-order-idx').value = idx;
  const modalTitle = document.getElementById('album-order-modal-title');
  const actualEl = document.getElementById('order-actual-price');

  if (idx >= 0) {
    const item = cloudData.albumOrders[currentGroup][idx];
    modalTitle.innerHTML = `<i class="fa-solid fa-pen text-blue-400"></i> 앨범 구매 내역 수정`;
    document.getElementById('order-country').value = item.country || '국내';
    document.getElementById('order-start-date').value = item.startDate || '';
    document.getElementById('order-end-date').value = item.endDate || '';
    document.getElementById('order-version').value = item.version || '';
    document.getElementById('order-seller').value = item.seller || '';
    document.getElementById('order-benefits').value = item.benefits || '';
    document.getElementById('order-unit-price').value = item.unitPrice !== undefined ? item.unitPrice : '';
    document.getElementById('order-quantity').value = item.quantity !== undefined ? item.quantity : 1;
    document.getElementById('order-total-price').value = item.totalPrice !== undefined ? item.totalPrice : '';
    document.getElementById('order-actual-price').value = item.actualPrice !== undefined ? item.actualPrice : '';
    document.getElementById('order-status').value = item.status || '주문완료';
    document.getElementById('order-date').value = item.orderDate || '';
    document.getElementById('order-memo').value = item.memo || '';
    if (actualEl) actualEl.dataset.autoSync = 'false';
  } else {
    modalTitle.innerHTML = `<i class="fa-solid fa-receipt text-blue-400"></i> 앨범 구매 내역 등록`;
    document.getElementById('order-country').value = '국내';
    document.getElementById('order-start-date').value = '';
    document.getElementById('order-end-date').value = '';
    document.getElementById('order-version').value = '';
    document.getElementById('order-seller').value = '';
    document.getElementById('order-benefits').value = '';
    document.getElementById('order-unit-price').value = '';
    document.getElementById('order-quantity').value = 1;
    document.getElementById('order-total-price').value = '';
    document.getElementById('order-actual-price').value = '';
    document.getElementById('order-status').value = '주문완료';
    document.getElementById('order-date').value = new Date().toISOString().slice(0, 10);
    document.getElementById('order-memo').value = '';
    if (actualEl) actualEl.dataset.autoSync = 'true';
  }

  document.getElementById('album-order-modal').classList.replace('hidden', 'flex');
}

export function saveAlbumOrder(currentGroup, onRender) {
  const idx = parseInt(document.getElementById('edit-album-order-idx').value);
  const country = document.getElementById('order-country').value;
  const startDate = document.getElementById('order-start-date').value;
  const endDate = document.getElementById('order-end-date').value;
  const version = document.getElementById('order-version').value.trim();
  const seller = document.getElementById('order-seller').value.trim();
  const benefits = document.getElementById('order-benefits').value.trim();
  const unitPrice = Number(document.getElementById('order-unit-price').value) || 0;
  const quantity = Number(document.getElementById('order-quantity').value) || 1;
  const totalPrice = Number(document.getElementById('order-total-price').value) || (unitPrice * quantity);
  const actualPrice = Number(document.getElementById('order-actual-price').value) || totalPrice;
  const status = document.getElementById('order-status').value;
  const orderDate = document.getElementById('order-date').value;
  const memo = document.getElementById('order-memo').value.trim();

  if (!version || !seller) return alert('버전(앨범명)과 판매처는 필수 입력값입니다.');

  if (!cloudData.albumOrders) cloudData.albumOrders = { plave: [], wego6: [] };
  if (!cloudData.albumOrders[currentGroup]) cloudData.albumOrders[currentGroup] = [];

  const payload = {
    id: idx >= 0 ? cloudData.albumOrders[currentGroup][idx].id : 'ao_' + Date.now(),
    country, startDate, endDate, version, seller, benefits,
    unitPrice, quantity, totalPrice, actualPrice,
    status, orderDate, memo
  };

  if (idx >= 0) {
    cloudData.albumOrders[currentGroup][idx] = payload;
  } else {
    cloudData.albumOrders[currentGroup].unshift(payload);
  }

  window.closeModals();
  syncData(onRender);
}

export function updateOrderStatus(idx, newStatus, currentGroup, onRender) {
  if (cloudData.albumOrders && cloudData.albumOrders[currentGroup] && cloudData.albumOrders[currentGroup][idx]) {
    cloudData.albumOrders[currentGroup][idx].status = newStatus;
    syncData(onRender);
  }
}

export function deleteAlbumOrder(idx, currentGroup, onRender) {
  if (!confirm('이 구매 내역을 삭제하시겠습니까?')) return;
  cloudData.albumOrders[currentGroup].splice(idx, 1);
  syncData(onRender);
}
