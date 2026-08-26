import { cloudData, syncData } from './firebase.js';

export function renderCalendar(currentGroup) {
  const g = cloudData.groups[currentGroup];
  const calFrame = document.getElementById('google-calendar-iframe');
  const calEmpty = document.getElementById('calendar-empty');
  const calTitle = document.getElementById('calendar-header-title');

  if (calTitle) calTitle.innerText = `${g.name.split(' ')[0]} 구글 캘린더`;

  if (g.calendarUrl && g.calendarUrl.trim() !== '') {
    calEmpty.classList.add('hidden');
    calFrame.classList.remove('hidden');
    let finalUrl = g.calendarUrl.trim();
    const srcMatch = finalUrl.match(/src="([^"]+)"/);
    if (srcMatch) finalUrl = srcMatch[1];
    if (finalUrl.includes('calendar.google.com') && !finalUrl.includes('ctz=')) {
      finalUrl += (finalUrl.includes('?') ? '&' : '?') + 'ctz=Asia%2FSeoul&showTitle=0&showNav=1&showDate=1&showPrint=0&showTabs=1&showCalendars=0&showTz=0';
    }
    if (calFrame.src !== finalUrl) calFrame.src = finalUrl;
  } else {
    calFrame.classList.add('hidden');
    calEmpty.classList.remove('hidden');
    calFrame.src = '';
  }
}

export function openCalendarModal(currentGroup) {
  document.getElementById('cal-url-input').value = cloudData.groups[currentGroup].calendarUrl || '';
  document.getElementById('calendar-modal').classList.replace('hidden', 'flex');
}

export function saveCalendarUrl(currentGroup, onRender) {
  cloudData.groups[currentGroup].calendarUrl = document.getElementById('cal-url-input').value.trim();
  window.closeModals();
  syncData(onRender);
}