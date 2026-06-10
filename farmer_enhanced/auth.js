// ===================== NAVIGATION =====================

function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function switchTab(tab, navItem) {
  state.currentTab = tab;
  document.querySelectorAll('[id^="tab-"]').forEach(t => (t.style.display = 'none'));
  document.getElementById('tab-' + tab).style.display = 'block';

  if (navItem) {
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    navItem.classList.add('active');
  }

  const sidebar = document.getElementById('sidebar');
  if (sidebar) sidebar.classList.remove('open');

  const backdrop = document.getElementById('sidebarBackdrop');
  if (backdrop) backdrop.style.display = 'none';

  renderTab(tab);
}

function renderTab(tab) {
  if (tab === 'dashboard') renderDashboard();
  if (tab === 'crops')     renderCrops();
  if (tab === 'expenses')  renderExpenses();
  if (tab === 'sales')     renderSales();
  if (tab === 'udhari')    renderUdhari();
  if (tab === 'compare')   renderCompare();
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('sidebarBackdrop');
  if (sidebar && backdrop) {
    const isOpen = sidebar.classList.toggle('open');
    backdrop.style.display = isOpen ? 'block' : 'none';
  }
}

// Close sidebar on tapping the backdrop
document.addEventListener('DOMContentLoaded', () => {
  const backdrop = document.getElementById('sidebarBackdrop');
  if (backdrop) {
    backdrop.addEventListener('click', () => {
      const sidebar = document.getElementById('sidebar');
      if (sidebar && sidebar.classList.contains('open')) {
        toggleSidebar();
      }
    });
  }
});

// ===================== AUTH =====================

async function handleLogin() {
  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  if (!email || !password) {
    showToast('Please enter both email and password', 'error');
    return;
  }

  try {
    showToast('Signing in...', 'success');
    await dbLogin(email, password);
  } catch (err) {
    console.error("Login failed:", err);
    showToast(err.message || 'Invalid email or password.', 'error');
  }
}

async function handleRegister() {
  const name     = document.getElementById('regName').value.trim();
  const location = document.getElementById('regLocation').value.trim();
  const phone    = document.getElementById('regPhone').value.trim();
  const landSize = parseFloat(document.getElementById('regLandSize').value);
  const landUnit = document.getElementById('regLandUnit').value;
  const email    = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;

  if (!name || !email || !password || !landSize) {
    showToast('Please fill in all required fields', 'error'); return;
  }
  if (!validatePassword(password)) {
    showToast('Password must be 8+ chars with uppercase, lowercase, number & special char', 'error'); return;
  }

  try {
    showToast('Creating account...', 'success');
    sessionStorage.setItem('isRegistering', 'true');
    const totalLand = landUnit === 'hectare' ? +(landSize * 2.47105).toFixed(2) : landSize;
    
    // Register the user profile in Auth & Firestore
    await dbRegister(name, email, password, location, phone, totalLand);
    
    // Log them out immediately so they have to log in on the login page
    await dbLogout();
    
    sessionStorage.removeItem('isRegistering');
    showToast('Account created successfully! Redirecting to login...', 'success');
    
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 1500);
  } catch (err) {
    sessionStorage.removeItem('isRegistering');
    console.error("Registration failed:", err);
    showToast(err.message, 'error');
  }
}

function loginSuccess(user) {
  const sidebarName = document.getElementById('sidebarName');
  if (sidebarName) {
    document.getElementById('sidebarName').textContent      = user.name;
    document.getElementById('sidebarLoc').textContent       = '📍 ' + (user.location || 'Unknown');
    document.getElementById('sidebarLand').textContent      = user.totalLand + ' acres';
    document.getElementById('greetName').textContent        = user.name.split(' ')[0];
    document.getElementById('cropCountBadge').textContent   = user.crops.length;
    showPage('appPage');
    switchTab('dashboard', document.querySelector('.nav-item'));
  }
}

async function handleLogout() {
  try {
    await dbLogout();
  } catch (err) {
    console.error("Logout failed:", err);
    showToast("Logout failed: " + err.message, "error");
  }
}

function validatePassword(pwd) {
  return pwd.length >= 8 &&
    /[A-Z]/.test(pwd) && /[a-z]/.test(pwd) &&
    /[0-9]/.test(pwd) && /[^A-Za-z0-9]/.test(pwd);
}

function checkPasswordStrength(pwd) {
  const bars = ['bar1','bar2','bar3','bar4'].map(id => document.getElementById(id));
  bars.forEach(b => { b.className = 'pwd-bar'; });

  const hint  = document.getElementById('pwdHint');
  let score   = 0;
  if (pwd.length >= 8)                           score++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd))   score++;
  if (/[0-9]/.test(pwd))                         score++;
  if (/[^A-Za-z0-9]/.test(pwd))                  score++;

  const cls    = score <= 1 ? 'weak' : score <= 3 ? 'medium' : 'strong';
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  hint.textContent = pwd ? (labels[score] || 'Too simple') : 'Must include uppercase, lowercase, number, and special character';
  hint.style.color = cls === 'strong' ? 'var(--sage)' : cls === 'medium' ? 'var(--amber)' : 'var(--rust)';

  for (let i = 0; i < score; i++) bars[i].classList.add(cls);
}

function updateLandPreview() {
  const size = parseFloat(document.getElementById('regLandSize').value);
  const unit = document.getElementById('regLandUnit').value;
  const el   = document.getElementById('landPreview');
  if (!size || !el) return;
  el.textContent = unit === 'hectare' ? `≈ ${(size * 2.47105).toFixed(2)} acres` : '';
}

function setGreet() {
  const h     = new Date().getHours();
  const greet = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  const el    = document.getElementById('greetDate');
  if (el) el.textContent = `${greet} — ${new Date().toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}`;
}

// ===================== PROFILE DROPDOWN =====================
function toggleProfileMenu() {
  const dd = document.getElementById('profileDropdown');
  if (!dd) return;
  dd.classList.toggle('open');
}

function initProfileDropdown() {
  const user = state.currentUser;
  if (!user) return;

  // Avatar initials
  const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const circle   = document.getElementById('profileAvatarCircle');
  if (circle) circle.textContent = initials;

  const nameEl  = document.getElementById('profileDropName');
  const emailEl = document.getElementById('profileDropEmail');
  if (nameEl)  nameEl.textContent  = user.name;
  if (emailEl) emailEl.textContent = user.email;

  // Close on outside click
  document.addEventListener('click', (e) => {
    const wrap = document.getElementById('profileMenuWrap');
    if (wrap && !wrap.contains(e.target)) {
      const dd = document.getElementById('profileDropdown');
      if (dd) dd.classList.remove('open');
    }
  });
}

function openEditProfile() {
  const user = state.currentUser;
  if (!user) return;
  document.getElementById('profileEditName').value     = user.name     || '';
  document.getElementById('profileEditLocation').value = user.location || '';
  document.getElementById('profileEditPhone').value    = user.phone    || '';
  document.getElementById('profileEditLand').value     = user.totalLand || '';
  const dd = document.getElementById('profileDropdown');
  if (dd) dd.classList.remove('open');
  openModal('editProfileModal');
}

async function saveProfile() {
  const name     = document.getElementById('profileEditName').value.trim();
  const location = document.getElementById('profileEditLocation').value.trim();
  const phone    = document.getElementById('profileEditPhone').value.trim();
  const land     = parseFloat(document.getElementById('profileEditLand').value);

  if (!name) { showToast('Name cannot be empty', 'error'); return; }

  const updatedProfile = {
    name,
    location,
    phone,
    totalLand: !isNaN(land) ? land : (state.currentUser.totalLand || 0)
  };

  try {
    showToast('Updating profile...', 'success');
    await dbUpdateProfile(state.currentUser.id, updatedProfile);

    // Update local state in-memory
    state.currentUser = { ...state.currentUser, ...updatedProfile };

    closeModal('editProfileModal');

    // Refresh sidebar and dropdown
    const sn = document.getElementById('sidebarName');
    const sl = document.getElementById('sidebarLoc');
    const sd = document.getElementById('sidebarLand');
    if (sn) sn.textContent = name;
    if (sl) sl.textContent = '📍 ' + location;
    if (sd) sd.textContent = updatedProfile.totalLand + ' acres';
    initProfileDropdown();
    showToast('Profile updated! ✅', 'success');
  } catch (err) {
    console.error("Failed to update profile:", err);
    showToast("Profile update failed: " + err.message, 'error');
  }
}

async function handleResetData() {
  const drop = document.getElementById('profileDropdown');
  if (drop) drop.classList.remove('open');

  // First confirm prompt
  const firstConfirm = confirm("⚠️ WARNING: Are you sure you want to reset all your farm data? This will permanently erase all your crops, expenses, and sales records.");
  if (!firstConfirm) return;

  // Second confirm prompt (2-stage verification)
  const secondConfirm = confirm("🚨 FINAL CONFIRMATION: This operation CANNOT be undone. All database records for your crops, expenses, and sales will be deleted forever. Do you wish to proceed?");
  if (!secondConfirm) return;

  try {
    showToast("Resetting your farm ledger...", "success");
    await dbResetUserData(state.currentUser.id);
    showToast("Farm ledger reset successfully! ✅", "success");
    
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  } catch (err) {
    console.error("Failed to reset data:", err);
    showToast("Reset failed: " + err.message, "error");
  }
}
