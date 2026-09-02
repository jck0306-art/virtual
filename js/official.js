import { initFirebase, cloudData, processImageFile } from './firebase.js';
import { renderProfile, openMemberModal, saveMember } from './profile.js';
import { renderOfficialEvents, openOfficialModal, saveOfficialEvent, deleteOfficialEvent } from './official.js';
import { renderCalendar, openCalendarModal, saveCalendarUrl } from './calendar.js';
import { renderAlbums, openAlbumModal, saveAlbum, deleteAlbum } from './albums.js';
import { renderGoods, openGoodsModal, saveGoods, toggleGoodsOwned, deleteGoods } from './goods.js';
import { renderPhotocards, openPhotocardModal, savePhotocard, togglePcCollected, deletePhotocard } from './photocards.js';
import { 
  renderEvents, openEventModal, saveEvent, 
  openApplicantManageModal, renderApplicantListTable, setAppFilter, 
  addSingleApplicant, addBulkApplicants, toggleWinnerFromModal, 
  deleteApplicantFromModal, drawRandomWinners, deleteEvent 
} from './events.js';
import { renderDeliveries, openDeliveryModal, saveDelivery, toggleShipped, copyDeliveryAddress, deleteDelivery } from './delivery.js';

let currentGroup = 'plave';
let currentMenu = 'profile';

function render() {
  if (!cloudData || !cloudData.groups || !cloudData.groups[currentGroup]) return;

  const g = cloudData.groups[currentGroup];

  const titleEl = document.getElementById('group-title');
  const badgeEl = document.getElementById('group-badge');
  const fandomEl = document.getElementById('group-fandom');
  const linksEl = document.getElementById('quick-links');

  if (titleEl) titleEl.innerText = g.name;
  if (badgeEl) badgeEl.innerText = g.company;
  if (fandomEl) fandomEl.innerHTML = `공식 팬덤명: <span class="text-indigo-300 font-semibold">${g.fandom}</span>`;
  
  if (linksEl && g.links) {
    linksEl.innerHTML = g.links.map(l => `
      <a href="${l.url}" target="_blank" class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 flex items-center gap-1.5 transition">
        <i class="fa-brands ${l.icon} text-slate-400"></i> ${l.name}
      </a>
    `).join('');
  }

  // 각 뷰 렌더링
  try { renderProfile(currentGroup); } catch (e) { console.error("Profile render error:", e); }
  try { renderOfficialEvents(currentGroup); } catch (e) { console.error("Official events error:", e); }
  try { renderCalendar(currentGroup); } catch (e) { console.error("Calendar render error:", e); }
  try { renderAlbums(currentGroup); } catch (e) { console.error("Albums render error:", e); }
  try { renderGoods(currentGroup); } catch (e) { console.error("Goods render error:", e); }
  try { renderPhotocards(currentGroup); } catch (e) { console.error("Photocards render error:", e); }
  try { renderEvents(currentGroup); } catch (e) { console.error("Events render error:", e); }
  try { renderDeliveries(currentGroup); } catch (e) { console.error("Deliveries render error:", e); }
}

function setupFileListeners() {
  const albumIn = document.getElementById('album-file-input');
  if (albumIn) {
    albumIn.addEventListener('change', e => {
      if (e.target.files[0]) {
        processImageFile(e.target.files[0], 600, base64 => {
          document.getElementById('album-img-base64').value = base64;
          document.getElementById('album-img-preview').src = base64;
          document.getElementById('album-preview-wrap').classList.remove('hidden');
        });
      }
    });
  }

  const goodsIn = document.getElementById('goods-file-input');
  if (goodsIn) {
    goodsIn.addEventListener('change', e => {
      if (e.target.files[0]) {
        processImageFile(e.target.files[0], 600, base64 => {
          document.getElementById('goods-img-base64').value = base64;
          document.getElementById('goods-img-preview').src = base64;
          document.getElementById('goods-preview-wrap').classList.remove('hidden');
        });
      }
    });
  }

  const pcIn = document.getElementById('pc-file-input');
  if (pcIn) {
    pcIn.addEventListener('change', e => {
      if (e.target.files[0]) {
        processImageFile(e.target.files[0], 500, base64 => {
          document.getElementById('pc-img-base64').value = base64;
          document.getElementById('pc-img-preview').src = base64;
          document.getElementById('pc-preview-wrap').classList.remove('hidden');
        });
      }
    });
  }

  const eventIn = document.getElementById('event-file-input');
  if (eventIn) {
    eventIn.addEventListener('change', e => {
      if (e.target.files[0]) {
        processImageFile(e.target.files[0], 600, base64 => {
          document.getElementById('event-img-base64').value = base64;
          document.getElementById('event-img-preview').src = base64;
          document.getElementById('event-preview-wrap').classList.remove('hidden');
        });
      }
    });
  }
}

// 상단 그룹 & 메뉴 전환
window.switchGroup = function(groupKey) {
  currentGroup = groupKey;
  const tabP = document.getElementById('tab-plave');
  const tabW = document.getElementById('tab-wego6');
  if (tabP && tabW) {
    if (groupKey === 'plave') {
      tabP.className = "px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 tab-active-plave";
      tabW.className = "px-4 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition flex items-center gap-2";
    } else {
      tabW.className = "px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 tab-active-wego6";
      tabP.className = "px-4 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition flex items-center gap-2";
    }
  }
  render();
};

window.switchMenu = function(menuKey) {
  currentMenu = menuKey;
  const menus = ['profile', 'official', 'calendar', 'albums', 'goods', 'photocards', 'events', 'deliveries'];
  menus.forEach(m => {
    const btn = document.getElementById(`nav-${m}`);
    const view = document.getElementById(`menu-view-${m}`);
    if (btn && view) {
      if (m === menuKey) {
        btn.className = "px-3.5 py-2.5 rounded-t-xl transition menu-active flex items-center gap-1.5 whitespace-nowrap";
        view.classList.remove('hidden');
      } else {
        btn.className = "px-3.5 py-2.5 rounded-t-xl transition text-slate-400 hover:text-white flex items-center gap-1.5 whitespace-nowrap";
        view.classList.add('hidden');
      }
    }
  });
  render();
};

window.closeModals = function() {
  document.querySelectorAll('#member-modal, #calendar-modal, #album-modal, #goods-modal, #photocard-modal, #event-modal, #delivery-modal, #applicant-manage-modal, #official-modal').forEach(m => {
    m.classList.replace('flex', 'hidden');
  });
};

// 프로필
window.openMemberModal = idx => openMemberModal(idx, currentGroup);
window.saveMember = () => saveMember(currentGroup, render);

// 공식 스케줄 (신설)
window.renderOfficialEvents = () => renderOfficialEvents(currentGroup);
window.openOfficialModal = (idx = -1) => openOfficialModal(idx, currentGroup);
window.saveOfficialEvent = () => saveOfficialEvent(currentGroup, render);
window.deleteOfficialEvent = idx => deleteOfficialEvent(idx, currentGroup, render);

// 캘린더
window.openCalendarModal = () => openCalendarModal(currentGroup);
window.saveCalendarUrl = () => saveCalendarUrl(currentGroup, render);

// 앨범
window.openAlbumModal = idx => openAlbumModal(idx, currentGroup);
window.saveAlbum = () => saveAlbum(currentGroup, render);
window.deleteAlbum = idx => deleteAlbum(idx, currentGroup, render);

// 굿즈
window.openGoodsModal = idx => openGoodsModal(idx, currentGroup);
window.saveGoods = () => saveGoods(currentGroup, render);
window.toggleGoodsOwned = idx => toggleGoodsOwned(idx, currentGroup, render);
window.deleteGoods = idx => deleteGoods(idx, currentGroup, render);

// 포카
window.openPhotocardModal = idx => openPhotocardModal(idx, currentGroup);
window.savePhotocard = () => savePhotocard(currentGroup, render);
window.togglePcCollected = idx => togglePcCollected(idx, currentGroup, render);
window.deletePhotocard = idx => deletePhotocard(idx, currentGroup, render);

// 나눔 & 이벤트
window.openEventModal = idx => openEventModal(idx, currentGroup);
window.saveEvent = () => saveEvent(currentGroup, render);
window.deleteEvent = idx => deleteEvent(idx, currentGroup, render);
window.openApplicantManageModal = idx => openApplicantManageModal(idx, currentGroup);
window.renderApplicantListTable = () => renderApplicantListTable();
window.setAppFilter = filterType => setAppFilter(filterType);
window.addSingleApplicant = () => addSingleApplicant(render);
window.addBulkApplicants = () => addBulkApplicants(render);
window.toggleWinnerFromModal = originalIdx => toggleWinnerFromModal(originalIdx, render);
window.deleteApplicantFromModal = originalIdx => deleteApplicantFromModal(originalIdx, render);
window.drawRandomWinners = () => drawRandomWinners(render);

// 반택 주소록
window.openDeliveryModal = idx => openDeliveryModal(idx, currentGroup);
window.saveDelivery = () => saveDelivery(currentGroup, render);
window.toggleShipped = idx => toggleShipped(idx, currentGroup, render);
window.copyDeliveryAddress = idx => copyDeliveryAddress(idx, currentGroup);
window.deleteDelivery = idx => deleteDelivery(idx, currentGroup, render);

window.addEventListener('DOMContentLoaded', () => {
  setupFileListeners();
  initFirebase(render);
});
