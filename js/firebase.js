export const firebaseConfig = {
  apiKey: "AIzaSyBQ0zSJleSHBjmecj1Qe-kmhLu-GDYXWE8",
  authDomain: "license-mgmt-157ed.firebaseapp.com",
  projectId: "license-mgmt-157ed", 
  storageBucket: "license-mgmt-157ed.firebasestorage.app",
  messagingSenderId: "20449962943",
  appId: "1:20449962943:web:35d36af2eb555d23760f0a"
};

export const DEFAULT_PERFUMES = [
  {
    id: 'p_1',
    brand: '조 말론 런던 (JO MALONE LONDON)',
    name: 'Sea Salt & Bergamot',
    category: '우디',
    concentration: 'EDC',
    seasons: ['봄', '여름', '가을'],
    capacity: '100ml',
    remain: 100,
    rating: 3,
    buyDate: '2026-08-08',
    store: '신세계 강남',
    accords: ['광물', '짠', '감귤류', '나무', '선박', '신선하고 매콤한', '허브', '이끼 낀', '달콤한', '향긋한'],
    notes: '베르가못 / 씨 솔트 / 드리프트우드',
    memo: '첫 느낌 : 음.... 이게 무슨 느낌이지...? 바닷가 수풀 속에 서있는 느낌'
  }
];

export const DEFAULT_WISH_ITEMS = [
  {
    id: 'wish_1',
    brand: '르 라보 (LE LABO)',
    name: '상탈 33 (Santal 33)',
    category: '우디/스파이시',
    price: '280,000원 / 50ml',
    tested: true,
    priority: 3,
    store: '신세계 강남점 또는 면세점',
    memo: '가을/겨울 착향 시 잔향이 예술. 다음 면세 찬스 때 구매 고려!'
  }
];

export const DEFAULT_VIP_ITEMS = [
  {
    id: 'vip_1',
    brand: '조 말론 런던 (Jo Malone)',
    tier: '블랙 (Black VIP)',
    store: '신세계백화점 강남점',
    validDate: '2026-12-31까지',
    points: '32,000P',
    benefits: '상시 5% 마일리지 적립, 스페셜 각인 무료 서비스, 시크릿 살롱 초대권',
    giftDesc: '미니어처 캔들 & 바디크림 2종',
    giftReceived: false,
    voucherDesc: '생일 축하 2만원 할인 바우처',
    voucherReceived: true,
    memo: '매니저님 연락처 등록됨 / 10월 신규 라인업 런칭 행사 예정'
  }
];

let db = null;
let isFirebaseReady = false;

const cachedPerfumes = localStorage.getItem('scent_cloud_data_v1') || localStorage.getItem('scent_archive_v1');
export let cloudPerfumes = cachedPerfumes ? JSON.parse(cachedPerfumes) : DEFAULT_PERFUMES;

const cachedWish = localStorage.getItem('scent_wish_data_v1');
export let cloudWishItems = cachedWish ? JSON.parse(cachedWish) : DEFAULT_WISH_ITEMS;

const cachedVip = localStorage.getItem('scent_vip_data_v1');
export let cloudVipItems = cachedVip ? JSON.parse(cachedVip) : DEFAULT_VIP_ITEMS;

if (window.firebase) {
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

function normalizePerfume(item, idx) {
  return {
    ...item,
    id: item.id ? String(item.id) : `p_${Date.now()}_${idx}`,
    accords: Array.isArray(item.accords) ? item.accords : (item.accords ? String(item.accords).split(',').map(s=>s.trim()).filter(Boolean) : []),
    seasons: Array.isArray(item.seasons) ? item.seasons : ['사계절'],
    buyDate: item.buyDate || '',
    store: item.store || ''
  };
}

function normalizeWish(item, idx) {
  return {
    ...item,
    id: item.id ? String(item.id) : `wish_${Date.now()}_${idx}`,
    tested: Boolean(item.tested),
    priority: Number(item.priority) || 1
  };
}

function normalizeVip(item, idx) {
  return {
    ...item,
    id: item.id ? String(item.id) : `vip_${Date.now()}_${idx}`,
    giftReceived: Boolean(item.giftReceived),
    voucherReceived: Boolean(item.voucherReceived)
  };
}

export function initFirebase(onDataUpdate) {
  cloudPerfumes = cloudPerfumes.map(normalizePerfume);
  cloudWishItems = cloudWishItems.map(normalizeWish);
  cloudVipItems = cloudVipItems.map(normalizeVip);

  onDataUpdate();

  if (isFirebaseReady) {
    let hasResponded = false;
    const timer = setTimeout(() => {
      if (!hasResponded) {
        const statusEl = document.getElementById('cloud-status');
        if (statusEl) {
          statusEl.innerHTML = '<i class="fa-solid fa-floppy-disk text-amber-400"></i> 로컬 모드';
          statusEl.className = "text-[10px] px-2.5 py-1 rounded-full bg-slate-800 text-amber-300 border border-slate-700 flex items-center gap-1.5 font-mono";
        }
      }
    }, 4000);

    db.collection("perfume_archive").doc("user_collection").onSnapshot((docSnap) => {
      hasResponded = true;
      clearTimeout(timer);

      if (docSnap.exists) {
        const data = docSnap.data();
        if (Array.isArray(data.items)) {
          cloudPerfumes = data.items.map(normalizePerfume);
          localStorage.setItem('scent_cloud_data_v1', JSON.stringify(cloudPerfumes));
        }
        if (Array.isArray(data.wishItems)) {
          cloudWishItems = data.wishItems.map(normalizeWish);
          localStorage.setItem('scent_wish_data_v1', JSON.stringify(cloudWishItems));
        }
        if (Array.isArray(data.vipItems)) {
          cloudVipItems = data.vipItems.map(normalizeVip);
          localStorage.setItem('scent_vip_data_v1', JSON.stringify(cloudVipItems));
        }
      } else {
        db.collection("perfume_archive").doc("user_collection").set({ 
          items: cloudPerfumes, 
          wishItems: cloudWishItems,
          vipItems: cloudVipItems 
        });
      }

      const statusEl = document.getElementById('cloud-status');
      if (statusEl) {
        statusEl.innerHTML = '<i class="fa-solid fa-cloud text-emerald-400"></i> 실시간 클라우드 DB';
        statusEl.className = "text-[10px] px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 font-mono";
      }
      onDataUpdate();
    }, (error) => {
      hasResponded = true;
      clearTimeout(timer);
      console.error("Firestore Snapshot Error:", error);
      const statusEl = document.getElementById('cloud-status');
      if (statusEl) {
        statusEl.innerHTML = '<i class="fa-solid fa-triangle-exclamation text-rose-400"></i> DB 권한 오류 (로컬 동작)';
        statusEl.className = "text-[10px] px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/30 flex items-center gap-1.5 font-mono";
      }
      onDataUpdate();
    });
  }
}

export async function syncPerfumes(onRender) {
  cloudPerfumes = cloudPerfumes.map(normalizePerfume);
  cloudWishItems = cloudWishItems.map(normalizeWish);
  cloudVipItems = cloudVipItems.map(normalizeVip);
  localStorage.setItem('scent_cloud_data_v1', JSON.stringify(cloudPerfumes));
  localStorage.setItem('scent_wish_data_v1', JSON.stringify(cloudWishItems));
  localStorage.setItem('scent_vip_data_v1', JSON.stringify(cloudVipItems));

  const statusEl = document.getElementById('cloud-status');
  if (statusEl) statusEl.innerHTML = '<i class="fa-solid fa-arrows-rotate animate-spin text-amber-400"></i> 동기화 중...';

  if (isFirebaseReady) {
    try {
      await db.collection("perfume_archive").doc("user_collection").set({ 
        items: cloudPerfumes, 
        wishItems: cloudWishItems,
        vipItems: cloudVipItems 
      });
      if (statusEl) {
        statusEl.innerHTML = '<i class="fa-solid fa-cloud text-emerald-400"></i> 클라우드 저장 완료';
      }
    } catch (e) {
      console.error("DB Save Error:", e);
      if (statusEl) statusEl.innerHTML = '<i class="fa-solid fa-triangle-exclamation text-rose-400"></i> 저장 권한 오류';
    }
  } else {
    if (statusEl) statusEl.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> 로컬 저장 완료';
  }

  if (onRender) onRender();
}
