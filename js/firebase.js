export const firebaseConfig = {
  apiKey: "AIzaSyBQ0zSJleSHBjmecj1Qe-kmhLu-GDYXWE8",
  authDomain: "license-mgmt-157ed.firebaseapp.com",
  projectId: "license-mgmt-157ed",
  storageBucket: "license-mgmt-157ed.firebasestorage.app",
  messagingSenderId: "20449962943",
  appId: "1:20449962943:web:35d36af2eb555d23760f0a"
};

export const DEFAULT_DATA = {
  groups: {
    plave: {
      name: 'PLAVE (플레이브)',
      company: 'VLAST Virtual Boy Group',
      fandom: 'PLLI (플리)',
      calendarUrl: '',
      links: [
        { name: '공식 유튜브', url: 'https://www.youtube.com/@plave_official', icon: 'fa-youtube' },
        { name: '공식 팬카페', url: 'https://cafe.daum.net/plave', icon: 'fa-coffee' },
        { name: '공식 X', url: 'https://twitter.com/plave_official', icon: 'fa-x-twitter' }
      ],
      members: [
        { name: '남예준', role: '리더 / 보컬', bday: '09-12', color: '#4B6BFB', emoji: '🐬' },
        { name: '한노아', role: '보컬 / 댄스', bday: '02-10', color: '#8A2BE2', emoji: '🦙' },
        { name: '채밤비', role: '댄스 / 보컬', bday: '07-15', color: '#FF69B4', emoji: '🦌' },
        { name: '도은호', role: '랩 / 보컬', bday: '05-24', color: '#DC2626', emoji: '🐺' },
        { name: '유하민', role: '랩 / 댄스', bday: '11-01', color: '#10B981', emoji: '🐈‍⬛' }
      ]
    },
    wego6: {
      name: 'WE-GO-6 (위고식스)',
      company: 'Virtual Idol Project',
      fandom: 'Official Fandom',
      calendarUrl: '',
      links: [
        { name: '공식 채널', url: '#', icon: 'fa-globe' },
        { name: '공식 X', url: '#', icon: 'fa-x-twitter' }
      ],
      members: [
        { name: '시우', role: '포지션 미정 (수정 가능)', bday: '--', color: '#06B6D4', emoji: '⚡' },
        { name: '우연', role: '포지션 미정 (수정 가능)', bday: '--', color: '#3B82F6', emoji: '🔥' },
        { name: '태강', role: '포지션 미정 (수정 가능)', bday: '--', color: '#F43F5E', emoji: '🎧' },
        { name: '제로', role: '포지션 미정 (수정 가능)', bday: '--', color: '#A855F7', emoji: '✨' },
        { name: '쿠우타', role: '포지션 미정 (수정 가능)', bday: '--', color: '#10B981', emoji: '🌟' }
      ]
    }
  },
  albums: { plave: [], wego6: [] },
  goods: { plave: [], wego6: [] },
  photocards: { plave: [], wego6: [] },
  events: { plave: [], wego6: [] },
  deliveries: { plave: [], wego6: [] }
};

let db = null;
let isFirebaseReady = false;

if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "내_API_KEY") {
  try {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    isFirebaseReady = true;
  } catch (e) {
    console.error("Firebase Init Error:", e);
  }
}

export let cloudData = JSON.parse(localStorage.getItem('v_archive_cloud_data_v7')) || DEFAULT_DATA;

export function ensureDataStructure() {
  if (!cloudData.groups) cloudData.groups = DEFAULT_DATA.groups;
  if (!cloudData.albums) cloudData.albums = { plave: [], wego6: [] };
  if (!cloudData.goods) cloudData.goods = { plave: [], wego6: [] };
  if (!cloudData.photocards) cloudData.photocards = { plave: [], wego6: [] };
  if (!cloudData.events) cloudData.events = { plave: [], wego6: [] };
  if (!cloudData.deliveries) cloudData.deliveries = { plave: [], wego6: [] };

  ['plave', 'wego6'].forEach(k => {
    if (!cloudData.albums[k]) cloudData.albums[k] = [];
    if (!cloudData.goods[k]) cloudData.goods[k] = [];
    if (!cloudData.photocards[k]) cloudData.photocards[k] = [];
    if (!cloudData.events[k]) cloudData.events[k] = [];
    if (!cloudData.deliveries[k]) cloudData.deliveries[k] = [];
  });
}

export function initFirebase(onDataUpdate) {
  ensureDataStructure();
  if (isFirebaseReady) {
    db.collection('fandom_archive').doc('main_data_v7').onSnapshot(doc => {
      if (doc.exists) {
        cloudData = doc.data();
        ensureDataStructure();
      } else {
        db.collection('fandom_archive').doc('main_data_v7').set(DEFAULT_DATA);
      }
      onDataUpdate();
    });
  } else {
    const statusEl = document.getElementById('cloud-status');
    if (statusEl) {
      statusEl.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> 로컬 모드`;
      statusEl.className = "text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1";
    }
    onDataUpdate();
  }
}

export function syncData(onRender) {
  ensureDataStructure();
  localStorage.setItem('v_archive_cloud_data_v7', JSON.stringify(cloudData));
  if (isFirebaseReady) {
    db.collection('fandom_archive').doc('main_data_v7').set(cloudData);
  }
  if (onRender) onRender();
}

export function processImageFile(file, maxWidth, callback) {
  if (!file) return callback('');
  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      callback(dataUrl);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}
