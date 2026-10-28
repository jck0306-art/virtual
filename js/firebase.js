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
  officialEvents: { plave: [], wego6: [] },
  albums: { plave: [], wego6: [] },
  albumOrders: { plave: [], wego6: [] },
  goods: { plave: [], wego6: [] },
  photocards: { plave: [], wego6: [] },
  events: { plave: [], wego6: [] },
  deliveries: { plave: [], wego6: [] }
};

let db = null;
let isFirebaseReady = false;

if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "내_API_KEY") {
  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    db = firebase.firestore();
    isFirebaseReady = true;
  } catch (e) {
    console.error("Firebase Init Error:", e);
  }
}

// 🌟 로컬 스토리지에 남아있을 수 있는 이전 버전 캐시들(v7, v6, v5 등) 탐색 및 복원
function loadCachedData() {
  const keys = ['v_archive_cloud_data_v7', 'v_archive_cloud_data_v6', 'v_archive_cloud_data_v5', 'virtual_cloud_data'];
  for (const k of keys) {
    const raw = localStorage.getItem(k);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && (parsed.albums?.plave?.length || parsed.albumOrders?.plave?.length || parsed.goods?.plave?.length)) {
          return parsed;
        }
      } catch(e) {}
    }
  }
  return DEFAULT_DATA;
}

export let cloudData = loadCachedData();

export function ensureDataStructure() {
  if (!cloudData.groups) cloudData.groups = DEFAULT_DATA.groups;
  if (!cloudData.officialEvents) cloudData.officialEvents = { plave: [], wego6: [] };
  if (!cloudData.albums) cloudData.albums = { plave: [], wego6: [] };
  if (!cloudData.albumOrders) cloudData.albumOrders = { plave: [], wego6: [] };
  if (!cloudData.goods) cloudData.goods = { plave: [], wego6: [] };
  if (!cloudData.photocards) cloudData.photocards = { plave: [], wego6: [] };
  if (!cloudData.events) cloudData.events = { plave: [], wego6: [] };
  if (!cloudData.deliveries) cloudData.deliveries = { plave: [], wego6: [] };

  ['plave', 'wego6'].forEach(k => {
    if (!cloudData.officialEvents[k]) cloudData.officialEvents[k] = [];
    if (!cloudData.albums[k]) cloudData.albums[k] = [];
    if (!cloudData.albumOrders[k]) cloudData.albumOrders[k] = [];
    if (!cloudData.goods[k]) cloudData.goods[k] = [];
    if (!cloudData.photocards[k]) cloudData.photocards[k] = [];
    if (!cloudData.events[k]) cloudData.events[k] = [];
    if (!cloudData.deliveries[k]) cloudData.deliveries[k] = [];
  });
}

export function initFirebase(onDataUpdate) {
  ensureDataStructure();
  onDataUpdate(); // 캐시 데이터로 먼저 즉시 화면 표시

  if (isFirebaseReady) {
    // 🌟 v7 문서 구독
    db.collection('fandom_archive').doc('main_data_v7').onSnapshot(async (doc) => {
      if (doc.exists) {
        cloudData = doc.data();
        ensureDataStructure();
        updateCloudStatus('클라우드 연결됨', 'emerald');
        onDataUpdate();
      } else {
        // 🌟 혹시 main_data_v6 문서에 이전 데이터가 있는지 자동 탐색하여 복구
        try {
          const prevDoc = await db.collection('fandom_archive').doc('main_data_v6').get();
          if (prevDoc.exists) {
            cloudData = prevDoc.data();
            ensureDataStructure();
            // 복구된 데이터를 새 v7 문서에 저장
            await db.collection('fandom_archive').doc('main_data_v7').set(cloudData);
            updateCloudStatus('이전 데이터 복구 완료', 'emerald');
            onDataUpdate();
            return;
          }
        } catch(err) {
          console.warn("이전 문서 복구 확인 실패:", err);
        }

        // 이전 문서도 없으면 현재 cloudData(로컬 캐시)를 기준으로 v7 생성
        db.collection('fandom_archive').doc('main_data_v7').set(cloudData);
        updateCloudStatus('클라우드 동기화', 'emerald');
        onDataUpdate();
      }
    }, (error) => {
      console.error("Firestore Listen Error:", error);
      updateCloudStatus('DB 권한/연결 오류 (로컬 모드)', 'amber');
      onDataUpdate();
    });
  } else {
    updateCloudStatus('로컬 모드', 'slate');
    onDataUpdate();
  }
}

function updateCloudStatus(text, color) {
  const statusEl = document.getElementById('cloud-status');
  if (!statusEl) return;
  const colorMap = {
    emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    amber: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    slate: 'bg-slate-800 text-slate-400 border-slate-700'
  };
  statusEl.className = `text-[10px] px-2.5 py-1 rounded-full border flex items-center gap-1.5 font-mono ${colorMap[color] || colorMap.slate}`;
  statusEl.innerHTML = `<i class="fa-solid fa-cloud"></i> ${text}`;
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
