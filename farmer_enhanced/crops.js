// ===================== CROPS =====================

const CROP_OPTIONS = [
  'Wheat (Gehu)', 'Rice (Chawal)', 'Cotton (Kapas)', 'Sugarcane (Ganna)',
  'Soybean', 'Maize (Makka)', 'Groundnut (Moongfali)', 'Onion (Pyaaz)',
  'Tomato', 'Potato (Aloo)', 'Turmeric (Haldi)', 'Jowar (Sorghum)',
  'Bajra (Pearl Millet)', 'Chilli (Mirchi)', 'Gram (Chana)'
];

function initCustomCropSelect(selectId) {
  const container = document.getElementById(selectId);
  if (!container) return;
  const optionsContainer = container.querySelector('.custom-select-options');
  
  optionsContainer.innerHTML = CROP_OPTIONS.map(name => {
    const imgKey = Object.keys(CROP_IMAGES).find(k => name.includes(k)) || 'default';
    const imgUrl = CROP_IMAGES[imgKey];
    return `<div class="cs-option" onclick="handleCropSelect('${selectId}', '${name}', '${imgUrl}')">
      <div class="cs-option-img" style="background-image:url('${imgUrl}')"></div>
      <span>${name}</span>
    </div>`;
  }).join('');
  
  document.addEventListener('click', (e) => {
    if (!container.contains(e.target)) {
      container.classList.remove('open');
    }
  });
}

function handleCropSelect(selectId, name, imgUrl) {
  const container = document.getElementById(selectId);
  container.querySelector('span').textContent = name;
  const imgEl = container.querySelector('.cs-preview-img');
  imgEl.style.backgroundImage = `url('${imgUrl}')`;
  imgEl.style.display = 'block';
  
  const inputId = selectId === 'addCropCustomSelect' ? 'cropNameSelect' : 'editCropNameSelect';
  document.getElementById(inputId).value = name;
  container.classList.remove('open');
}

function toggleCustomSelect(selectId) {
  document.getElementById(selectId).classList.toggle('open');
}

document.addEventListener('DOMContentLoaded', () => {
  initCustomCropSelect('addCropCustomSelect');
  initCustomCropSelect('editCropCustomSelect');
});


function updateCropLandPreview() {
  const size = parseFloat(document.getElementById('cropLandSize').value);
  const unit = document.getElementById('cropLandUnit').value;
  const el   = document.getElementById('cropLandPreview');
  if (!size || !el) return;
  el.textContent = unit === 'hectare' ? `≈ ${(size * 2.47105).toFixed(2)} acres` : '';
}

async function addCrop() {
  const name   = document.getElementById('cropNameSelect').value;
  const size   = parseFloat(document.getElementById('cropLandSize').value);
  const unit   = document.getElementById('cropLandUnit').value;
  const season = document.getElementById('cropSeason').value;
  const date   = document.getElementById('cropStartDate').value;

  if (!name || !size || !date) { showToast('Please fill all fields', 'error'); return; }

  const land       = unit === 'hectare' ? +(size * 2.47105).toFixed(2) : size;
  const totalLand  = state.currentUser.totalLand || 0;
  const usedLand   = state.currentUser.crops.reduce((s, c) => s + (c.land || 0), 0);
  const available  = +(totalLand - usedLand).toFixed(2);

  if (land > available) {
    showToast(
      `Not enough land! You only have ${available} ac available out of ${totalLand} ac total. This crop needs ${land} ac.`,
      'error'
    );
    return;
  }

  const crop = { name, land, season, startDate: date, status: 'Growing', year: new Date(date).getFullYear() };

  try {
    showToast('Saving crop...', 'success');
    const savedCrop = await dbAddCrop(state.currentUser.id, crop);
    
    // Update local state in-memory
    state.currentUser.crops.push(savedCrop);

    document.getElementById('cropCountBadge').textContent = state.currentUser.crops.length;
    closeModal('addCropModal');
    showToast(`${name} added to your farm! 🌱`, 'success');
    renderCrops();
  } catch (err) {
    console.error("Failed to add crop:", err);
    showToast("Failed to add crop: " + err.message, "error");
  }
}

function updateEditCropLandPreview() {
  const size = parseFloat(document.getElementById('editCropLandSize').value);
  const unit = document.getElementById('editCropLandUnit').value;
  const el   = document.getElementById('editCropLandPreview');
  if (!size || !el) return;
  el.textContent = unit === 'hectare' ? `≈ ${(size * 2.47105).toFixed(2)} acres` : '';
}

function openEditCropModal(cropId) {
  const crop = state.currentUser.crops.find(c => c.id === cropId);
  if (!crop) return;

  document.getElementById('editCropId').value = crop.id;
  
  // Update custom select
  const imgKey = Object.keys(CROP_IMAGES).find(k => crop.name.includes(k)) || 'default';
  handleCropSelect('editCropCustomSelect', crop.name, CROP_IMAGES[imgKey]);
  
  document.getElementById('editCropLandSize').value = crop.land;
  document.getElementById('editCropLandUnit').value = 'acre'; // Base unit is acre
  document.getElementById('editCropSeason').value = crop.season;
  document.getElementById('editCropStartDate').value = crop.startDate;
  document.getElementById('editCropStatus').value = crop.status;
  
  updateEditCropLandPreview();
  openModal('editCropModal');
}

async function saveEditedCrop() {
  const id     = document.getElementById('editCropId').value;
  const name   = document.getElementById('editCropNameSelect').value;
  const size   = parseFloat(document.getElementById('editCropLandSize').value);
  const unit   = document.getElementById('editCropLandUnit').value;
  const season = document.getElementById('editCropSeason').value;
  const date   = document.getElementById('editCropStartDate').value;
  const status = document.getElementById('editCropStatus').value;

  if (!name || !size || !date) { showToast('Please fill all fields', 'error'); return; }

  const land      = unit === 'hectare' ? +(size * 2.47105).toFixed(2) : size;
  const totalLand = state.currentUser.totalLand || 0;
  // Used land excluding the crop being edited
  const usedLand  = state.currentUser.crops
    .filter(c => c.id !== id)
    .reduce((s, c) => s + (c.land || 0), 0);
  const available = +(totalLand - usedLand).toFixed(2);

  if (land > available) {
    showToast(
      `Not enough land! Only ${available} ac available for this crop (${totalLand} ac total).`,
      'error'
    );
    return;
  }

  const cropIndex = state.currentUser.crops.findIndex(c => c.id === id);
  if (cropIndex !== -1) {
    const updatedCropData = {
      name,
      land,
      season,
      startDate: date,
      status,
      year: new Date(date).getFullYear()
    };

    try {
      showToast('Saving changes...', 'success');
      await dbUpdateCrop(state.currentUser.id, id, updatedCropData);

      // Update in-memory state
      state.currentUser.crops[cropIndex] = { ...state.currentUser.crops[cropIndex], ...updatedCropData };

      closeModal('editCropModal');
      showToast('Crop updated successfully! ✅', 'success');
      renderCrops();
    } catch (err) {
      console.error("Failed to update crop:", err);
      showToast("Update failed: " + err.message, "error");
    }
  }
}

async function deleteCrop(cropId) {
  if (!confirm('Are you sure you want to delete this crop? This will also remove associated expenses and sales.')) return;
  
  try {
    showToast('Deleting crop...', 'success');
    await dbDeleteCrop(state.currentUser.id, cropId);

    // Update local state in-memory
    state.currentUser.crops = state.currentUser.crops.filter(c => c.id !== cropId);
    state.currentUser.expenses = state.currentUser.expenses.filter(e => e.cropId !== cropId);
    state.currentUser.sales = state.currentUser.sales.filter(s => s.cropId !== cropId);

    document.getElementById('cropCountBadge').textContent = state.currentUser.crops.length;
    showToast('Crop deleted.', 'success');
    renderCrops();
  } catch (err) {
    console.error("Failed to delete crop:", err);
    showToast("Deletion failed: " + err.message, "error");
  }
}

function renderCrops() {
  const crops = state.currentUser?.crops || [];
  const grid  = document.getElementById('cropsGrid');

  if (!crops.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">
      <div class="empty-state-icon">🌱</div>
      <div class="empty-state-title">No crops yet</div>
      <div class="empty-state-sub">Add your first crop to start tracking expenses and revenue</div>
    </div>`;
    return;
  }

  grid.innerHTML = crops.map(crop => {
    const expenses = getExpensesForCrop(crop.id);
    const revenue  = getRevenueForCrop(crop.id);
    const totalExp = expenses.reduce((s, e) => s + e.amount, 0);
    const profit   = revenue - totalExp;
    const imgKey   = Object.keys(CROP_IMAGES).find(k => crop.name.includes(k)) || 'default';

    return `<div class="crop-card" onclick="goCropExpenses('${crop.id}')">
      <div class="crop-card-image">
        <div class="crop-card-image-bg" style="background-image:url('${CROP_IMAGES[imgKey]}')"></div>
        <div class="crop-card-season-badge season-${crop.season.toLowerCase()}">${crop.season === 'Kharif' ? '☀️ Kharif' : '❄️ Rabi'}</div>
        <div style="position:absolute;top:12px;right:12px;display:flex;gap:6px;z-index:2;">
          <button onclick="event.stopPropagation(); exportCropReport('${crop.id}')" style="background:rgba(255,255,255,0.9);border:none;border-radius:6px;width:30px;height:30px;cursor:pointer;box-shadow:var(--shadow);color:var(--sage);" title="Export Crop Report">📄</button>
          <button onclick="event.stopPropagation(); openEditCropModal('${crop.id}')" style="background:rgba(255,255,255,0.9);border:none;border-radius:6px;width:30px;height:30px;cursor:pointer;box-shadow:var(--shadow);" title="Edit Crop">✏️</button>
          <button onclick="event.stopPropagation(); deleteCrop('${crop.id}')" style="background:rgba(255,255,255,0.9);border:none;border-radius:6px;width:30px;height:30px;cursor:pointer;box-shadow:var(--shadow);color:var(--rust);" title="Delete Crop">🗑️</button>
        </div>
      </div>
      <div class="crop-card-body">
        <div class="crop-card-name">${crop.name}</div>
        <div class="crop-card-meta">
          <div class="crop-card-meta-item">🌿 <strong>${crop.land}</strong> acres</div>
          <div class="crop-card-meta-item">📅 <strong>${formatDate(crop.startDate)}</strong></div>
        </div>
      </div>
      <div class="crop-card-footer">
        <div class="crop-card-financials">
          Exp: <strong>₹${fmtNum(totalExp)}</strong> &nbsp;·&nbsp; Rev: <strong>₹${fmtNum(revenue)}</strong>
          <br/><span class="${profit >= 0 ? 'profit-pos' : 'profit-neg'}">${profit >= 0 ? '▲' : '▼'} ₹${fmtNum(Math.abs(profit))}</span>
        </div>
        <div class="status-badge status-${crop.status.toLowerCase()}">${crop.status === 'Growing' ? '🌱' : '✅'} ${crop.status}</div>
      </div>
    </div>`;
  }).join('');
}

function goCropExpenses(cropId) {
  state.selectedExpenseCropId = cropId;
  switchTab('expenses', document.querySelectorAll('.nav-item')[2]);
}
