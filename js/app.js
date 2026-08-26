import { initFirebase, cloudData, processImageFile } from './firebase.js';
import { renderProfile, openMemberModal, saveMember } from './profile.js';
import { renderCalendar, openCalendarModal, saveCalendarUrl } from './calendar.js';
import { renderAlbums, openAlbumModal, saveAlbum, deleteAlbum } from './albums.js';
import { renderGoods, openGoodsModal, saveGoods, toggleGoodsOwned, deleteGoods } from './goods.js';
import { renderPhotocards, openPhotocardModal, savePhotocard, togglePcCollected, deletePhotocard } from './photocards.js';
import { renderEvents, openEventModal, saveEvent, openApplicantAddPrompt, toggleWinner, deleteApplicant, deleteEvent } from './events.js';
import { renderDeliveries, openDeliveryModal, saveDelivery, toggleShipped, copyDeliveryAddress, deleteDelivery } from './delivery.js';

let currentGroup = 'plave';
let currentMenu = 'profile';

function render() {
  const g = cloudData.groups[currentGroup];

  document.getElementById('group-title').innerText = g.name;
  document.getElementById('group-badge').innerText = g.company;
  document.getElementById('group-fandom').innerHTML = `공식 팬덤: <span class="font-bold text-white">${g.fandom}</span>`;
  
  document.getElementById('quick-links').innerHTML = g.links.map(l => `
    <a href="${l.url}" target="_blank" class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 flex items-center gap-1.5 transition">
      <i class="fa-brands ${l.icon} text-slate-400"></i> ${l.name}
    </a>
  `).join('');

  renderProfile(currentGroup);
  renderCalendar(currentGroup);
  renderAlbums(currentGroup);
  renderGoods(currentGroup);
  renderPhotocards(currentGroup);
  renderEvents(currentGroup);
  renderDeliveries(currentGroup);
}

function setupFileListeners() {
  document.getElementById('album-file-input').addEventListener('change', e => {
    if (e.target.files[0]) {
      processImageFile(e.target.files[0], 600, base64 => {
        document.getElementById('album-img-base64').value = base64;
        document.getElementById('album-img-preview').src = base64;
        document.getElementById('album-preview-wrap').classList.remove('hidden');
      });
    }
  });

  document.getElementById('goods-file-input').addEventListener('change', e => {
    if (e.target.files[0]) {
      processImageFile(e.target.files[0], 600, base64 => {
        document.getElementById('goods-img-base64').value = base64;
        document.getElementById('goods-img-preview').src = base64;
        document.getElementById('goods-preview-wrap').classList.remove('hidden');
      });
    }
  });

  document.getElementById('pc-file-input').addEventListener('change', e => {
    if (e.target.files[0]) {
      processImageFile(e.target.files[0], 500, base64 => {
        document.getElementById('pc-img-base64').value = base64;
        document.getElementById('pc-img-preview').src = base64;
        document.getElementById('pc-preview-wrap').classList.remove('hidden');
      });
    }
  });

  document.getElementById('event-file-input').addEventListener('change', e => {
    if (e.target.files[0]) {
      processImageFile(e.target.files[0], 600, base64 => {
        document.getElementById('event-img-base64').value = base64;
        document.getElementById('event-img-preview').src = base64;
        document.getElementById('event-preview-wrap').classList.remove('hidden');
      });
    }
  });
}

window.switchGroup = function(groupKey) {
  currentGroup = groupKey;
  const tabP = document.getElementById('tab-plave');
  const tabW = document.getElementById('tab-wego6');
  if (groupKey === 'plave') {
    tabP.className = "px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 tab-active-plave";
    tabW.className = "px-4 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition flex items-center gap-2";
  } else {
    tabW.className = "px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 tab-active-wego6";
    tabP.className = "px-4 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition flex items-center gap-2";
  }
  render();
};

window.switchMenu = function(menuKey) {
  currentMenu = menuKey;
  const menus = ['profile', 'calendar', 'albums', 'goods', 'photocards', 'events', 'deliveries'];
  menus.forEach(m => {
    const btn = document.getElementById(`nav-${m}`);
    const view = document.getElementById(`menu-view-${m}`);
    if (m === menuKey) {
      btn.className = "px-3.5 py-2.5 rounded-t-xl transition menu-active flex items-center gap-1.5 whitespace-nowrap";
      view.classList.remove('hidden');
    } else {
      btn.className = "px-3.5 py-2.5 rounded-t-xl transition text-slate-400 hover:text-white flex items-center gap-1.5 whitespace-nowrap";
      view.classList.add('hidden');
    }
  });
  render();
};

window.closeModals = function() {
  document.querySelectorAll('#member-modal, #calendar-modal, #album-modal, #goods-modal, #photocard-modal, #event-modal, #delivery-modal').forEach(m => {
    m.classList.replace('flex', 'hidden');
  });
};

// 프로필
window.openMemberModal = idx => openMemberModal(idx, currentGroup);
window.saveMember = () => saveMember(currentGroup, render);

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

// 나눔/이벤트
window.openEventModal = idx => openEventModal(idx, currentGroup);
window.saveEvent = () => saveEvent(currentGroup, render);
window.openApplicantAddPrompt = eventIdx => openApplicantAddPrompt(eventIdx, currentGroup, render);
window.toggleWinner = (eventIdx, appIdx) => toggleWinner(eventIdx, appIdx, currentGroup, render);
window.deleteApplicant = (eventIdx, appIdx) => deleteApplicant(eventIdx, appIdx, currentGroup, render);
window.deleteEvent = idx => deleteEvent(idx, currentGroup, render);

// 반택 배송
window.openDeliveryModal = idx => openDeliveryModal(idx, currentGroup);
window.saveDelivery = () => saveDelivery(currentGroup, render);
window.toggleShipped = idx => toggleShipped(idx, currentGroup, render);
window.copyDeliveryAddress = idx => copyDeliveryAddress(idx, currentGroup);
window.deleteDelivery = idx => deleteDelivery(idx, currentGroup, render);

window.addEventListener('DOMContentLoaded', () => {
  setupFileListeners();
  initFirebase(render);
});
