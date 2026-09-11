export const ADMIN_EMAIL = "jck0306@gmail.com";

export function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/`/g, '&#96;');
}

export function sanitizeURL(url) {
  if (!url) return '';
  const clean = String(url).trim();
  if (/^(https?:\/\/|mailto:)/i.test(clean)) return clean;
  return '#';
}

// 🌟 Google 팝업 로그인 (절대 다른 페이지로 이동 안 함)
export async function loginWithGoogle() {
  if (!window.firebase || !window.firebase.auth) {
    alert("Firebase Auth 라이브러리를 불러오는 중입니다. 잠시 후 다시 눌러주세요.");
    return;
  }
  const provider = new window.firebase.auth.GoogleAuthProvider();
  try {
    const result = await window.firebase.auth().signInWithPopup(provider);
    const user = result.user;
    if (user.email !== ADMIN_EMAIL) {
      alert(`접근 권한이 없는 계정입니다 (${user.email}). ${ADMIN_EMAIL} 계정으로 로그인해 주세요.`);
      await window.firebase.auth().signOut();
      location.reload();
    } else {
      location.reload();
    }
  } catch (error) {
    console.error("로그인 에러:", error);
    alert(`로그인 실패: ${error.message}`);
  }
}

// 🌟 로그아웃
export async function logoutAdmin() {
  if (!window.firebase || !window.firebase.auth) return;
  await window.firebase.auth().signOut();
  alert("로그아웃되었습니다.");
  location.reload();
}

// 🌟 보안 가드 (리다이렉트 원천 차단)
export function initAuthGuard(isPortal = false, onAuthorized = null) {
  // 포털 메인 화면은 페이지 잠금 오버레이를 띄우지 않고 헤더 버튼으로만 제어
  if (isPortal) {
    waitForAuth((user) => {
      renderHeaderAuthUI(user, true);
      if (user && user.email === ADMIN_EMAIL && onAuthorized) {
        onAuthorized(user);
      }
    });
    return;
  }

  // 패밀리 사이트: 로그인 전까지 화면을 덮는 잠금창 생성 (사라지지 않음)
  let overlay = document.getElementById('auth-lock-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'auth-lock-overlay';
    overlay.className = 'fixed inset-0 bg-slate-950/95 backdrop-blur-xl z-[99999] flex items-center justify-center p-4';
    overlay.innerHTML = `
      <div class="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl space-y-5">
        <div class="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 text-2xl mx-auto">
          <i class="fa-solid fa-lock"></i>
        </div>
        <div>
          <h2 class="text-lg font-bold text-white">관리자 인증 필요</h2>
          <p class="text-xs text-slate-400 mt-1.5 leading-relaxed">
            비공개 개인 아카이브입니다.<br/>
            지정된 구글 계정(<strong class="text-indigo-300 font-mono">${ADMIN_EMAIL}</strong>)으로 로그인해 주세요.
          </p>
        </div>
        <div class="pt-2 space-y-2">
          <button id="btn-guard-login" type="button" class="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer">
            <i class="fa-brands fa-google text-sm"></i> Google 계정으로 로그인
          </button>
          <a href="https://jck0306-art.github.io/portal/" class="block text-[11px] text-slate-500 hover:text-slate-300 pt-1">
            포털 메인으로 돌아가기
          </a>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    document.getElementById('btn-guard-login').onclick = () => loginWithGoogle();
  }

  waitForAuth((user) => {
    const curOverlay = document.getElementById('auth-lock-overlay');
    if (user && user.email === ADMIN_EMAIL) {
      if (curOverlay) curOverlay.remove();
      renderHeaderAuthUI(user, false);
      if (onAuthorized) onAuthorized(user);
    } else {
      // 비로그인 상태여도 절대 다른 곳으로 튕겨내지 않고 잠금창을 화면에 유지
      if (curOverlay) curOverlay.style.display = 'flex';
      renderHeaderAuthUI(null, false);
    }
  });
}

function waitForAuth(callback) {
  const timer = setInterval(() => {
    if (window.firebase && window.firebase.auth) {
      clearInterval(timer);
      window.firebase.auth().onAuthStateChanged((user) => {
        callback(user);
      });
    }
  }, 50);
}

// 상단 헤더에 로그인/로그아웃 버튼 표시
function renderHeaderAuthUI(user, isPortal) {
  let container = document.getElementById('admin-header-auth');
  if (!container) {
    const headerRight = document.querySelector('header .flex.items-center.gap-2') || 
                        document.querySelector('header .flex.items-center.justify-between') ||
                        document.querySelector('header');
    if (headerRight) {
      container = document.createElement('div');
      container.id = 'admin-header-auth';
      container.className = 'flex items-center gap-2';
      headerRight.appendChild(container);
    }
  }
  if (!container) return;

  if (user && user.email === ADMIN_EMAIL) {
    container.innerHTML = `
      <div class="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5">
        <img src="${user.photoURL || 'https://via.placeholder.com/24'}" class="w-5 h-5 rounded-full border border-slate-700" alt="avatar" />
        <span class="text-[11px] font-mono font-bold text-slate-300 hidden sm:inline">${user.email}</span>
        <button onclick="window.logoutAdmin()" class="text-[10px] text-slate-400 hover:text-rose-400 p-1 ml-1 transition" title="로그아웃">
          <i class="fa-solid fa-power-off"></i>
        </button>
      </div>
    `;
  } else {
    // 비로그인 상태일 때 누를 수 있는 구글 로그인 버튼
    container.innerHTML = `
      <button onclick="window.loginWithGoogle()" class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-indigo-600/20 cursor-pointer">
        <i class="fa-brands fa-google text-[11px]"></i> 로그인
      </button>
    `;
  }
}
