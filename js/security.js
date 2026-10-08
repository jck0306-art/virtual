export const ADMIN_EMAIL = "jck0306@gmail.com";

// 🌟 반택 주소록 핀번호 검증용 SHA-256 해시 함수
export async function hashSHA256(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

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

export function sanitizeHandle(handle) {
  if (!handle) return '';
  return String(handle).trim().replace(/^@/, '');
}

// 🌟 로그인 함수
export async function loginWithGoogle() {
  localStorage.setItem('admin_logged_in', 'true');
  location.reload();
}

// 🌟 로그아웃 함수
export async function logoutAdmin() {
  localStorage.removeItem('admin_logged_in');
  sessionStorage.removeItem('delivery_unlocked');
  alert("로그아웃되었습니다.");
  location.reload();
}

// 🌟 관리자 인증 가드 (팝업/오류 없이 즉시 통과)
export function initAuthGuard(isPortal = false, onAuthorized = null) {
  const dummyUser = { 
    email: ADMIN_EMAIL, 
    photoURL: '' 
  };

  const curOverlay = document.getElementById('auth-lock-overlay');
  if (curOverlay) {
    curOverlay.remove();
  }

  renderHeaderAuthUI(dummyUser, isPortal);

  if (onAuthorized) {
    onAuthorized(dummyUser);
  }
}

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

  container.innerHTML = `
    <div class="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5">
      <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
      <span class="text-[11px] font-mono font-bold text-slate-300 hidden sm:inline">${ADMIN_EMAIL}</span>
      <button onclick="window.logoutAdmin()" class="text-[10px] text-slate-400 hover:text-rose-400 p-1 ml-1 transition" title="로그아웃">
        <i class="fa-solid fa-power-off"></i>
      </button>
    </div>
  `;
}
