// ===================== APP INIT =====================

window.addEventListener('DOMContentLoaded', () => {
  // Enforce auth state
  const isAuthPage = window.location.pathname.endsWith('login.html') || window.location.pathname.endsWith('register.html');

  // Set default dates if elements exist
  const cropStartEl = document.getElementById('cropStartDate');
  const expDateEl   = document.getElementById('expDate');
  if (cropStartEl) cropStartEl.valueAsDate = new Date();
  if (expDateEl) expDateEl.valueAsDate = new Date();

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
        const userData = await dbLoadUserData(user.uid);
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
  ['dashCarousel', 'cropsCarousel', 'expenseCarousel', 'salesCarousel', 'compareCarousel'].forEach(id => {
    startAutoCarousel(id);
  });
});
