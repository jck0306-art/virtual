import { cloudData, syncData, ensureDataStructure } from './firebase.js';

let activeGroup = 'plave';

function setVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val;
}
function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.innerText = text;
}

// 1. 주소 모달 HTML 템플릿 DOM 주입
export function injectDeliveryModal() {
  const oldModal = document.getElementById('delivery-modal');
  if (oldModal) oldModal.remove();

  const oldInput = document.getElementById('excel-file-input');
  if (oldInput) oldInput.remove();

  const modalHtml = `
    <!-- 엑셀 파일 선택 인풋 (숨김) -->
    <input id="excel-file-input" type="file" accept=".xlsx, .xls" class="hidden" />

    <!-- 반택 주소록 등록/수정 모달 컴포넌트 -->
    <div id="delivery-modal" class="fixed inset-0 bg-black/70 hidden items-center justify-center p-4 z-50 overflow-y-auto">
      <div class="bg-slate-900 rounded-2xl max-w-sm w-full p-6 border border-slate-700 space-y-4 my-8 shadow-2xl">
        <div class="flex justify-between items-center border-b border-slate-800 pb-2.5">
          <h3 id="delivery-modal-title" class="text-base font-bold text-white flex items-center gap-2">
            <i class="fa-solid fa-truck text-cyan-400"></i> 반택 배송지 등록
          </h3>
          <button onclick="window.closeDeliveryModal()" class="text-slate-400 hover:text-white text-lg">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <input type="hidden" id="edit-delivery-idx" value="-1" />
        
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="text-xs text-slate-400 block mb-1">택배 종류</label>
            <select id="del-type" class="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-cyan-500">
              <option value="GS반택">GS25 반택</option>
              <option value="CU알뜰">CU 알뜰택배</option>
              <option value="일반택배">일반택배/준등기</option>
            </select>
          </div>
          <div>
            <label class="text-xs text-slate-400 block mb-1">발송 상태</label>
            <select id="del-shipped" class="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-cyan-500">
              <option value="false">발송대기</option>
              <option value="true">발송완료</option>
            </select>
          </div>
        </div>

        <!-- 스레드 아이디 입력란 -->
        <div>
          <label class="text-xs text-slate-400 block mb-1">스레드 계정 (선택)</label>
          <div class="relative">
            <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-purple-400 font-bold text-xs">@</span>
            <input id="del-threads" type="text" class="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 pl-7 pr-3 text-sm text-white focus:outline-none focus:border-purple-500 font-mono" placeholder="username" />
          </div>
        </div>

        <div>
          <label class="text-xs text-slate-400 block mb-1">받는분 이름/닉네임 *</label>
          <input id="del-recipient" type="text" class="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-cyan-500" placeholder="홍길동" />
        </div>

        <div>
          <label class="text-xs text-slate-400 block mb-1">전화번호</label>
          <input id="del-phone" type="text" class="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono" placeholder="010-0000-0000" />
        </div>

        <div>
          <label class="text-xs text-slate-400 block mb-1">편의점 점포명 (도착지) *</label>
          <input id="del-store" type="text" class="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-cyan-500" placeholder="예: GS25 강남역점" />
        </div>

        <div>
          <label class="text-xs text-slate-400 block mb-1">보낼 품목 / 메모</label>
          <input id="del-memo" type="text" class="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-cyan-500" placeholder="예: 밤비 포카 1장, 스티커" />
        </div>

        <div class="flex justify-end gap-2 pt-2 border-t border-slate-800">
          <button onclick="window.closeDeliveryModal()" class="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300">취소</button>
          <button onclick="window.saveDelivery()" class="px-4 py-1.5 text-xs bg-cyan-600 hover:bg-cyan-500 rounded-lg text-white font-bold">저장하기</button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);

  const fileInput = document.getElementById('excel-file-input');
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      handleExcelUpload(e, window.getCurrentGroup ? window.getCurrentGroup() : activeGroup, window.renderAllApp);
    });
  }
}

// 2. 모달 열기/닫기
export function openDeliveryModal(idx = -1, currentGroup) {
  if (currentGroup) activeGroup = currentGroup;
  
  if (!document.getElementById('delivery-modal')) {
    injectDeliveryModal();
  }

  const modal = document.getElementById('delivery-modal');
  setVal('edit-delivery-idx', idx);

  if (idx >= 0) {
    ensureDataStructure();
    const list = (cloudData.deliveries && cloudData.deliveries[activeGroup]) || [];
    const d = list[idx] || {};
    setText('delivery-modal-title', '반택 배송지 수정');
    setVal('del-type', d.type || 'GS반택');
    setVal('del-shipped', String(Boolean(d.shipped)));
    setVal('del-threads', (d.threads || '').replace(/^@/, ''));
    setVal('del-recipient', d.recipient || '');
    setVal('del-phone', d.phone || '');
    setVal('del-store', d.store || '');
    setVal('del-memo', d.memo || '');
  } else {
    setText('delivery-modal-title', '반택 배송지 등록');
    setVal('del-type', 'GS반택');
    setVal('del-shipped', 'false');
    setVal('del-threads', '');
    setVal('del-recipient', '');
    setVal('del-phone', '');
    setVal('del-store', '');
    setVal('del-memo', '');
  }

  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }
}

export function closeDeliveryModal() {
  const modal = document.getElementById('delivery-modal');
  if (modal) {
    modal.classList.remove('flex');
    modal.classList.add('hidden');
  }
}

// 3. 단일 배송지 저장
export function saveDelivery(currentGroup, onRender) {
  const grp = currentGroup || activeGroup;
  const idx = parseInt(document.getElementById('edit-delivery-idx')?.value ?? '-1');
  const type = document.getElementById('del-type')?.value || 'GS반택';
  const shipped = document.getElementById('del-shipped')?.value === 'true';
  const threadsRaw = (document.getElementById('del-threads')?.value || '').trim();
  const threads = threadsRaw ? threadsRaw.replace(/^@/, '') : '';
  const recipient = (document.getElementById('del-recipient')?.value || '').trim();
  const phone = (document.getElementById('del-phone')?.value || '').trim();
  const store = (document.getElementById('del-store')?.value || '').trim();
  const memo = (document.getElementById('del-memo')?.value || '').trim();

  if (!recipient || !store) return alert('받는분과 편의점 점포명은 필수 항목입니다.');

  ensureDataStructure();
  if (!cloudData.deliveries) cloudData.deliveries = { plave: [], wego6: [] };
  if (!cloudData.deliveries[grp]) cloudData.deliveries[grp] = [];

  const payload = { type, shipped, threads, recipient, phone, store, memo, createdAt: new Date().toISOString() };
  if (idx >= 0) cloudData.deliveries[grp][idx] = payload;
  else cloudData.deliveries[grp].unshift(payload);

  closeDeliveryModal();
  syncData(onRender);
}

// 4. 엑셀 양식 다운로드 (스레드아이디 컬럼 포함)
export function downloadDeliveryTemplate() {
  if (typeof XLSX === 'undefined') {
    return alert('엑셀 라이브러리가 로드되지 않았습니다.');
  }

  const templateData = [
    {
      "택배종류": "GS반택",
      "스레드아이디": "plli_love",
      "받는분이름": "홍길동",
      "전화번호": "010-1234-5678",
      "도착점포명": "GS25 강남역점",
      "보낼품목_메모": "예준 포카 1장"
    },
    {
      "택배종류": "CU알뜰",
      "스레드아이디": "noah_fan",
      "받는분이름": "김플리",
      "전화번호": "010-9876-5432",
      "도착점포명": "CU 신촌메인점",
      "보낼품목_메모": "은호 스티커 세트"
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateData);
  worksheet['!cols'] = [
    { wch: 12 }, // 택배종류
    { wch: 18 }, // 스레드아이디
    { wch: 15 }, // 받는분이름
    { wch: 16 }, // 전화번호
    { wch: 22 }, // 도착점포명
    { wch: 30 }  // 보낼품목_메모
  ];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "반택주소록양식");
  XLSX.writeFile(workbook, "반택_배송지_등록양식.xlsx");
}

// 5. 엑셀 업로드 파싱 (스레드아이디 자동 인식)
export function handleExcelUpload(event, currentGroup, onRender) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  if (typeof XLSX === 'undefined') {
    return alert('엑셀 라이브러리가 아직 로드되지 않았습니다.');
  }

  const grp = currentGroup || activeGroup;
  const reader = new FileReader();

  reader.onload = function(e) {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheet];
      const rows = XLSX.utils.sheet_to_json(worksheet);

      if (!rows || rows.length === 0) {
        alert('엑셀 파일에 데이터가 없습니다.');
        event.target.value = '';
        return;
      }

      ensureDataStructure();
      if (!cloudData.deliveries) cloudData.deliveries = { plave: [], wego6: [] };
      if (!cloudData.deliveries[grp]) cloudData.deliveries[grp] = [];

      let addedCount = 0;
      rows.forEach(row => {
        const recipient = String(row['받는분이름'] || row['받는분'] || row['이름'] || '').trim();
        const store = String(row['도착점포명'] || row['점포명'] || row['편의점점포명'] || '').trim();

        if (recipient && store) {
          let type = String(row['택배종류'] || row['종류'] || 'GS반택').trim();
          if (!['GS반택', 'CU알뜰', '일반택배'].includes(type)) {
            type = type.includes('CU') ? 'CU알뜰' : (type.includes('일반') ? '일반택배' : 'GS반택');
          }
          const threadsRaw = String(row['스레드아이디'] || row['스레드계정'] || row['스레드'] || '').trim();
          const threads = threadsRaw ? threadsRaw.replace(/^@/, '') : '';
          const phone = String(row['전화번호'] || row['연락처'] || '').trim();
          const memo = String(row['보낼품목_메모'] || row['품목'] || row['메모'] || '').trim();

          cloudData.deliveries[grp].unshift({
            type,
            threads,
            recipient,
            phone,
            store,
            memo,
            shipped: false,
            createdAt: new Date().toISOString()
          });
          addedCount++;
        }
      });

      event.target.value = '';
      if (addedCount > 0) {
        syncData(() => {
          alert(`총 ${addedCount}건의 배송지가 등록되었습니다!`);
          if (onRender) onRender();
        });
      } else {
        alert('유효한 데이터가 없습니다. [받는분이름]과 [도착점포명]을 확인해 주세요.');
      }
    } catch (err) {
      console.error(err);
      alert('엑셀 파싱 중 오류가 발생했습니다.');
      event.target.value = '';
    }
  };
  reader.readAsArrayBuffer(file);
}
