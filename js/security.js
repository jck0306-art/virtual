// 허용할 관리자 이메일
export const ADMIN_EMAIL = "jck0306@gmail.com";

// HTML 특수문자 이스케이프 (기존 보안 함수 유지)
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

// 🌟 Google 팝업 로그인 실행
export async function loginWithGoogle() {
  if (!window.firebase || !window.firebase.auth) {
    alert("Firebase Auth SDK가 로드되지 않았습니다.");
    return;
  }
  const provider = new window.firebase.auth.GoogleAuthProvider();
  try {
    const result = await window.firebase.auth().signInWithPopup(provider);
    const user = result.user;
    if (user.email !== ADMIN_EMAIL) {
      alert(`접근 권한이 없는 계정입니다 (${user.email}). 관리자 계정으로 로그인해 주세요.`);
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

// 🌟 로그아웃 실행
export async function logoutAdmin() {
  if (!window.firebase || !window.firebase.auth) return;
  await window.firebase.auth().signOut();
  alert("로그아웃되었습니다.");
  window.location.href = "https://jck0306-art.github.io/portal/";
}

// 🌟 전체 페이지 보안 가드 (isPortal: 포털 메인 여부)
export function initAuthGuard(isPortal = false, onAuthorized = null) {
  // 1. 화면 잠금용 오버레이 HTML 주입
  const lockOverlay = document.createElement('div');
  lockOverlay.id = 'auth-lock-overlay';
  lockOverlay.className = 'fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[9999] flex items-center justify-center p-4 transition-all duration-300';
  lockOverlay.innerHTML = `
    <div class="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl space-y-5">
      <div class="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 text-2xl mx-auto">
        <i class="fa-solid fa-lock"></i>
      </div>
      <div>
        <h2 class="text-lg font-bold text-white">관리자 인증 필요</h2>
        <p class="text-xs text-slate-400 mt-1">접속 및 데이터 관리를 위해 지정된 Google 계정으로 로그인해야 합니다.</p>
      </div>
      <div id="auth-guard-action" class="pt-2">
        <button id="btn-guard-login" class="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30">
          <i class="fa-brands fa-google"></i> Google 계정으로 로그인
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(lockOverlay);

  const loginBtn = document.getElementById('btn-guard-login');
  if (loginBtn) {
    loginBtn.onclick = () => loginWithGoogle();
  }

  // 2. Firebase Auth SDK 로드 확인 및 상태 감시
  let checkTimer = setInterval(() => {
    if (window.firebase && window.firebase.auth) {
      clearInterval(checkTimer);

      window.firebase.auth().onAuthStateChanged((user) => {
        const overlay = document.getElementById('auth-lock-overlay');
        
        if (user && user.email === ADMIN_EMAIL) {
          // 승인된 관리자: 오버레이 제거 및 정상 실행
          if (overlay) overlay.remove();
          renderUserUI(user);
          if (onAuthorized) onAuthorized(user);
        } else {
          // 비인가 또는 로그아웃 상태
          if (user) {
            alert(`인가되지 않은 계정입니다 (${user.email}). 관리자 계정만 접근 가능합니다.`);
            window.firebase.auth().signOut();
          }

          if (!isPortal) {
            // 패밀리 사이트인 경우 즉시 포털 로그인 창으로 이동
            window.location.href = "https://jck0306-art.github.io/portal/";
          } else {
            if (overlay) overlay.style.display = 'flex';
          }
        }
      });
    }
  }, 100);
}

// 상단 헤더에 관리자 프로필 및 로그아웃 버튼 렌더링
function renderUserUI(user) {
  let userBox = document.getElementById('admin-user-badge');
  if (!userBox) {
    const headerRight = document.querySelector('header .flex.items-center.gap-2') || document.querySelector('header');
    if (headerRight) {
      userBox = document.createElement('div');
      userBox.id = 'admin-user-badge';
      userBox.className = 'flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 shrink-0';
      headerRight.prepend(userBox);
    }
  }

  if (userBox) {
    userBox.innerHTML = `
      <div class="flex items-center gap-2">
        <img src="${user.photoURL || 'https://via.placeholder.com/24'}" class="w-5 h-5 rounded-full border border-slate-700" alt="avatar" />
        <span class="text-[11px] font-mono font-bold text-slate-300 hidden md:inline">${user.email}</span>
      </div>
      <button onclick="window.logoutAdmin && window.logoutAdmin()" class="text-[10px] text-slate-400 hover:text-rose-400 p-1 transition" title="로그아웃">
        <i class="fa-solid fa-power-off"></i>
      </button>
    `;
  }
}
