// ===================== PWA — SERVICE WORKER & INSTALL =====================

// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js')
      .then(reg => console.log('[SW] Registered:', reg.scope))
      .catch(err => console.warn('[SW] Registration failed:', err));
  });
}

// Deferred install prompt
let _pwaDeferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent the mini-infobar from appearing on mobile
  e.preventDefault();
  _pwaDeferredPrompt = e;

  // Show the install banner only if not dismissed this session
  // and app is not already installed (standalone mode)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  const wasDismissed = sessionStorage.getItem('pwa_banner_dismissed');

  if (!isStandalone && !wasDismissed) {
    const banner = document.getElementById('pwaInstallBanner');
    if (banner) banner.style.display = 'flex';
  }
});

// Hide banner if app becomes installed
window.addEventListener('appinstalled', () => {
  _pwaDeferredPrompt = null;
  const banner = document.getElementById('pwaInstallBanner');
  if (banner) banner.style.display = 'none';
  console.log('[PWA] App installed successfully');
});

// Called by the "+ Add" button in the install banner
function triggerPWAInstall() {
  if (!_pwaDeferredPrompt) return;
  _pwaDeferredPrompt.prompt();
  _pwaDeferredPrompt.userChoice.then(choice => {
    if (choice.outcome === 'accepted') {
      console.log('[PWA] User accepted install');
    } else {
      console.log('[PWA] User dismissed install');
    }
    _pwaDeferredPrompt = null;
    const banner = document.getElementById('pwaInstallBanner');
    if (banner) banner.style.display = 'none';
  });
}

// Called by the "✕" dismiss button in the install banner
function dismissPWABanner() {
  const banner = document.getElementById('pwaInstallBanner');
  if (banner) banner.style.display = 'none';
  sessionStorage.setItem('pwa_banner_dismissed', 'true');
}

// ===================== APP INIT =====================

window.addEventListener('DOMContentLoaded', () => {
  // Enforce auth state
  const isAuthPage = window.location.pathname.endsWith('login.html') || window.location.pathname.endsWith('register.html');

  // Set default dates if elements exist
  const cropStartEl = document.getElementById('cropStartDate');
  const expDateEl   = document.getElementById('expDate');
  const saleDateEl  = document.getElementById('saleDate');
  if (cropStartEl) cropStartEl.valueAsDate = new Date();
  if (expDateEl) expDateEl.valueAsDate = new Date();
  if (saleDateEl) saleDateEl.valueAsDate = new Date();

  // Greet
  if (typeof setGreet === 'function') setGreet();

  // Crop land preview listener
  const cropLandEl = document.getElementById('cropLandSize');
  if (cropLandEl) cropLandEl.addEventListener('input', updateCropLandPreview);

  // Close sidebar on outside click (mobile)
  document.addEventListener('click', e => {
    const sidebar   = document.getElementById('sidebar');
    const hamburger = document.querySelector('.hamburger');
    if (sidebar && sidebar.classList.contains('open') &&
        !sidebar.contains(e.target) &&
        !hamburger?.contains(e.target)) {
      sidebar.classList.remove('open');
      const backdrop = document.getElementById('sidebarBackdrop');
      if (backdrop) backdrop.style.display = 'none';
    }
  });

  // Track Firebase Auth State Changed
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      if (sessionStorage.getItem('isRegistering') === 'true') {
        return;
      }
      try {
        // Load data from firestore
        let userData;
        try {
          userData = await dbLoadUserData(user.uid, false);
        } catch (netErr) {
          console.warn("Network fetch failed, attempting to load from offline cache...", netErr);
          try {
            userData = await dbLoadUserData(user.uid, true);
            state.isOffline = true;
            showOfflineBanner();
          } catch (cacheErr) {
            throw new Error("You are offline and have no cached data on this device. Please connect to the internet to load your farm ledger.");
          }
        }

        state.currentUser = userData;
        
        // Profile dropdown
        if (typeof initProfileDropdown === 'function') initProfileDropdown();

        if (isAuthPage) {
          // If on login/register page and successfully logged in, redirect
          setTimeout(() => {
            window.location.href = 'index.html';
          }, 800);
        } else {
          // If on main page, initialize application UI
          loginSuccess(state.currentUser);
        }
      } catch (err) {
        console.error("Failed to load user data:", err);
        showToast("Error loading profile: " + err.message, "error");
        if (!isAuthPage) {
          auth.signOut();
        }
      }
    } else {
      // Not logged in
      state.currentUser = null;
      if (!isAuthPage) {
        window.location.href = 'login.html';
      }
    }
  });
});

// ===================== CAROUSEL LOGIC =====================
const carouselIntervals = {};

function setCarousel(carouselId, index, isAuto = false) {
  const wrap = document.getElementById(carouselId);
  if (!wrap) return;

  const slides = wrap.querySelectorAll('.carousel-slide');
  slides.forEach((s, i) => {
    if (i === index) {
      s.classList.add('active');
    } else {
      s.classList.remove('active');
    }
  });

  const nav = wrap.nextElementSibling;
  if (!nav || !nav.classList.contains('carousel-nav')) return;

  const dots = nav.querySelectorAll('.carousel-dot');
  dots.forEach((d, i) => {
    if (i === index) {
      d.classList.add('active');
    } else {
      d.classList.remove('active');
    }
  });

  // If user interacted manually, restart auto-play timer
  if (!isAuto) {
    startAutoCarousel(carouselId);
  }
}

function startAutoCarousel(carouselId) {
  if (carouselIntervals[carouselId]) {
    clearInterval(carouselIntervals[carouselId]);
  }
  
  carouselIntervals[carouselId] = setInterval(() => {
    const wrap = document.getElementById(carouselId);
    if (!wrap || !wrap.offsetParent) return; // Only process if visible on screen
    
    const slides = wrap.querySelectorAll('.carousel-slide');
    if (!slides.length) return;
    
    let currentIndex = 0;
    slides.forEach((s, i) => { if (s.classList.contains('active')) currentIndex = i; });
    
    const nextIndex = (currentIndex + 1) % slides.length;
    setCarousel(carouselId, nextIndex, true);
  }, 5000); // 5 seconds per slide to allow Ken Burns effect to look beautiful
}

// Initialize all auto-playing carousels on load
window.addEventListener('DOMContentLoaded', () => {
  ['dashCarousel', 'cropsCarousel', 'expenseCarousel', 'sprayCarousel', 'salesCarousel', 'compareCarousel'].forEach(id => {
    startAutoCarousel(id);
  });
});

function showOfflineBanner() {
  let banner = document.getElementById('offlineBanner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'offlineBanner';
    banner.style.cssText = 'background: #f59e0b; color: white; text-align: center; padding: 10px; font-weight: 600; font-size: 13px; position: fixed; top: 0; left: 0; width: 100%; z-index: 9999; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);';
    banner.innerHTML = '<span>⚠️ You are currently offline. Viewing cached data. Changes will sync when online.</span>';
    document.body.prepend(banner);
  }
}
