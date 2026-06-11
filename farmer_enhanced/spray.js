// ===================== SPRAY DIARY =====================

const SPRAY_COLORS = {
  'Pesticide': 'cat-machinery',
  'Fungicide': 'cat-labor',
  'Herbicide': 'cat-irrigation',
  'Fertilizer': 'cat-fertilizer',
  'Growth Regulator': 'cat-seeds'
};

const SPRAY_ICONS = {
  'Pesticide': '🐛',
  'Fungicide': '🍄',
  'Herbicide': '🌿',
  'Fertilizer': '🧪',
  'Growth Regulator': '📈'
};

async function addSpray() {
  const cropId      = document.getElementById('sprayCropSelect').value;
  const date        = document.getElementById('sprayDate').value;
  const productName = document.getElementById('sprayProductName').value.trim();
  const productType = document.getElementById('sprayProductType').value;
  const dose        = parseFloat(document.getElementById('sprayDose').value);
  const doseUnit    = document.getElementById('sprayDoseUnit').value;
  const reason      = document.getElementById('sprayReason').value;
  const notes       = document.getElementById('sprayNotes').value.trim();

  if (!cropId || !date || !productName || isNaN(dose)) { 
    showToast('Fill crop, date, product name & dose', 'error'); 
    return; 
  }

  const spray = { cropId, date, productName, productType, dose, doseUnit, reason, notes };

  try {
    showToast('Saving spray log...', 'success');
    const savedSpray = await dbAddSpray(state.currentUser.id, spray);
    
    // Update local state in-memory
    if (!state.currentUser.sprayLogs) state.currentUser.sprayLogs = [];
    state.currentUser.sprayLogs.push(savedSpray);
    saveState();

    closeModal('addSprayModal');
    showToast('Spray recorded! 🧪', 'success');
    renderSpray();
  } catch (err) {
    console.error("Failed to add spray:", err);
    showToast("Failed to add spray: " + err.message, "error");
  }
}

function renderSpray() {
  const crops   = state.currentUser?.crops || [];
  const tabsWrap = document.getElementById('sprayCropTabs');

  if (!crops.length) {
    if (tabsWrap) tabsWrap.innerHTML = '<div class="crop-tab" style="color:var(--clay)">No crops added yet</div>';
    renderSprayContent();
    return;
  }

  if (tabsWrap) {
    const isAllActive = !state.selectedSprayCropId || state.selectedSprayCropId === 'all';
    tabsWrap.innerHTML = `
      <div class="crop-tab ${isAllActive ? 'active' : ''}" onclick="selectSprayCrop('all')">
        All Crops
      </div>
    ` + crops.map(c => {
      const count = getSprayForCrop(c.id).length;
      return `<div class="crop-tab ${c.id === state.selectedSprayCropId ? 'active' : ''}" onclick="selectSprayCrop('${c.id}')">
        ${c.name} (${count})
      </div>`;
    }).join('');
  }

  renderSprayContent();
}

function selectSprayCrop(id) {
  state.selectedSprayCropId = id;
  renderSpray();
}

function getSprayForCrop(cropId) {
  const sprayLogs = state.currentUser?.sprayLogs || [];
  return sprayLogs.filter(s => s.cropId === cropId);
}

function renderSprayContent() {
  const crops = state.currentUser?.crops || [];
  const sprayLogs = state.currentUser?.sprayLogs || [];

  const cid = state.selectedSprayCropId || 'all';

  let filtered = sprayLogs;
  if (cid !== 'all') {
    filtered = filtered.filter(s => s.cropId === cid);
  }

  // Crop details for headers
  const crop = crops.find(c => c.id === cid);
  const cropNameStr = crop ? crop.name : 'All Crops';

  document.getElementById('sprayTabCropName').textContent = cropNameStr;
  document.getElementById('sprayCount').textContent = `${filtered.length} entries`;

  const listEl = document.getElementById('sprayList');
  if (!filtered.length) {
    listEl.innerHTML = `<div class="empty-state" style="padding:40px 20px;">
      <div class="empty-state-icon">🧪</div>
      <div class="empty-state-title">No spray entries</div>
      <div class="empty-state-sub">Try recording a new spray entry.</div>
    </div>`;
  } else {
    listEl.innerHTML = [...filtered].reverse().map(s => {
      const sCrop = crops.find(c => c.id === s.cropId);
      const sCropName = sCrop ? sCrop.name : 'Unknown';
      const colClass = SPRAY_COLORS[s.productType] || 'cat-machinery';
      const icon = SPRAY_ICONS[s.productType] || '🧪';

      return `
      <div class="expense-item">
        <div class="expense-cat-icon ${colClass}">${icon}</div>
        <div class="expense-item-info">
          <div class="expense-item-name">
            <strong>${s.productName}</strong> 
            <span class="status-badge" style="font-size: 10px; padding: 2px 8px; margin-left: 8px; background: rgba(100,116,139,0.08); color: var(--soil);">${s.productType}</span>
            <span style="font-size:11px;color:var(--clay);font-weight:normal;margin-left:6px;">(${sCropName})</span>
          </div>
          <div class="expense-item-meta">
            ${formatDate(s.date)} · Dose: ${s.dose} ${s.doseUnit} · Reason: ${s.reason}
            ${s.notes ? `<div style="margin-top: 4px; font-style: italic; color: var(--clay);">${s.notes}</div>` : ''}
          </div>
        </div>
        <div style="display:flex;gap:6px;margin-left:10px;flex-shrink:0;">
          <button onclick="openEditSpray('${s.id}')" style="background:rgba(90,122,74,0.1);border:none;border-radius:6px;width:28px;height:28px;cursor:pointer;font-size:13px;" title="Edit">✏️</button>
          <button onclick="deleteSpray('${s.id}')" style="background:rgba(192,68,26,0.1);border:none;border-radius:6px;width:28px;height:28px;cursor:pointer;font-size:13px;color:var(--rust);" title="Delete">🗑️</button>
        </div>
      </div>`;
    }).join('');
  }
}

function openEditSpray(sprayId) {
  const spray = state.currentUser?.sprayLogs?.find(s => s.id === sprayId);
  if (!spray) return;

  document.getElementById('editSprayId').value = spray.id;
  document.getElementById('editSprayProductName').value = spray.productName;
  document.getElementById('editSprayProductType').value = spray.productType;
  document.getElementById('editSprayDose').value = spray.dose;
  document.getElementById('editSprayDoseUnit').value = spray.doseUnit;
  document.getElementById('editSprayReason').value = spray.reason;
  document.getElementById('editSprayNotes').value = spray.notes || '';
  document.getElementById('editSprayDate').value = spray.date;

  // Populate crop select
  const sel = document.getElementById('editSprayCropSelect');
  sel.innerHTML = state.currentUser.crops.map(c =>
    `<option value="${c.id}" ${c.id === spray.cropId ? 'selected' : ''}>${getCropOptionText(c)}</option>`
  ).join('');

  openModal('editSprayModal');
}

async function saveEditedSpray() {
  const id          = document.getElementById('editSprayId').value;
  const cropId      = document.getElementById('editSprayCropSelect').value;
  const date        = document.getElementById('editSprayDate').value;
  const productName = document.getElementById('editSprayProductName').value.trim();
  const productType = document.getElementById('editSprayProductType').value;
  const dose        = parseFloat(document.getElementById('editSprayDose').value);
  const doseUnit    = document.getElementById('editSprayDoseUnit').value;
  const reason      = document.getElementById('editSprayReason').value;
  const notes       = document.getElementById('editSprayNotes').value.trim();

  if (!cropId || !date || !productName || isNaN(dose)) { 
    showToast('Fill all fields', 'error'); 
    return; 
  }

  const idx = state.currentUser.sprayLogs.findIndex(s => s.id === id);
  if (idx !== -1) {
    const updatedData = { cropId, date, productName, productType, dose, doseUnit, reason, notes };

    try {
      showToast('Saving changes...', 'success');
      await dbUpdateSpray(state.currentUser.id, id, updatedData);

      // Update local state in-memory
      state.currentUser.sprayLogs[idx] = { ...state.currentUser.sprayLogs[idx], ...updatedData };
      saveState();

      closeModal('editSprayModal');
      showToast('Spray updated! ✅', 'success');
      renderSpray();
    } catch (err) {
      console.error("Failed to update spray log:", err);
      showToast("Update failed: " + err.message, "error");
    }
  }
}

async function deleteSpray(sprayId) {
  if (!confirm('Delete this spray diary record?')) return;

  try {
    showToast('Deleting spray entry...', 'success');
    await dbDeleteSpray(state.currentUser.id, sprayId);

    // Update local state in-memory
    state.currentUser.sprayLogs = state.currentUser.sprayLogs.filter(s => s.id !== sprayId);
    saveState();

    showToast('Spray entry deleted.', 'success');
    renderSpray();
  } catch (err) {
    console.error("Failed to delete spray log:", err);
    showToast("Deletion failed: " + err.message, "error");
  }
}
