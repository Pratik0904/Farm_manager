// ===================== SALES =====================

async function addSale() {
  const cropId       = document.getElementById('saleCropSelect').value;
  const qty          = parseFloat(document.getElementById('saleQty').value);
  const unit         = document.getElementById('saleUnit').value;
  const pricePerUnit = parseFloat(document.getElementById('salePricePerUnit').value);
  const date         = document.getElementById('saleDate').value;

  if (!cropId || !qty || !pricePerUnit || !date) { showToast('Fill all sale fields', 'error'); return; }

  const crop = state.currentUser.crops.find(c => c.id === cropId);
  if (crop && unit === 'Quintal' && qty > crop.land * 80) {
    if(!confirm(`Warning: Yield of ${qty} Quintals seems unusually high for a ${crop.land} acre farm. Do you want to proceed?`)) return;
  }

  const sale = { cropId, qty, unit, pricePerUnit, date };

  try {
    showToast('Saving sale record...', 'success');
    const savedSale = await dbAddSale(state.currentUser.id, sale);
    
    // Update local state in-memory
    state.currentUser.sales.push(savedSale);

    closeModal('addSaleModal');
    showToast('Sale recorded! 💰', 'success');
    renderSales();
  } catch (err) {
    console.error("Failed to add sale:", err);
    showToast("Failed to record sale: " + err.message, "error");
  }
}

function updateSalePreview() {
  const qty   = parseFloat(document.getElementById('saleQty').value) || 0;
  const price = parseFloat(document.getElementById('salePricePerUnit').value) || 0;
  const total = qty * price;
  document.getElementById('salePreview').innerHTML = `
    <div class="calc-preview-label">Total Revenue = ${qty} × ₹${fmtNum(price)}</div>
    <div class="calc-preview-value">₹ ${fmtNum(total)}</div>`;
}

function updateEditSalePreview() {
  const qty   = parseFloat(document.getElementById('editSaleQty').value) || 0;
  const price = parseFloat(document.getElementById('editSalePricePerUnit').value) || 0;
  const total = qty * price;
  document.getElementById('editSalePreview').innerHTML = `
    <div class="calc-preview-label">Total Revenue = ${qty} × ₹${fmtNum(price)}</div>
    <div class="calc-preview-value">₹ ${fmtNum(total)}</div>`;
}

function openEditSale(saleId) {
  const sale = state.currentUser.sales.find(s => s.id === saleId);
  if (!sale) return;

  document.getElementById('editSaleId').value           = sale.id;
  document.getElementById('editSaleQty').value          = sale.qty;
  document.getElementById('editSalePricePerUnit').value = sale.pricePerUnit;
  document.getElementById('editSaleUnit').value         = sale.unit;
  document.getElementById('editSaleDate').value         = sale.date;

  // Populate crop select
  const sel = document.getElementById('editSaleCropSelect');
  sel.innerHTML = state.currentUser.crops.map(c =>
    `<option value="${c.id}" ${c.id === sale.cropId ? 'selected' : ''}>${getCropOptionText(c)}</option>`
  ).join('');

  updateEditSalePreview();
  openModal('editSaleModal');
}

async function saveEditedSale() {
  const id           = document.getElementById('editSaleId').value;
  const cropId       = document.getElementById('editSaleCropSelect').value;
  const qty          = parseFloat(document.getElementById('editSaleQty').value);
  const unit         = document.getElementById('editSaleUnit').value;
  const pricePerUnit = parseFloat(document.getElementById('editSalePricePerUnit').value);
  const date         = document.getElementById('editSaleDate').value;

  if (!cropId || !qty || !pricePerUnit) { showToast('Fill all fields', 'error'); return; }

  const crop = state.currentUser.crops.find(c => c.id === cropId);
  if (crop && unit === 'Quintal' && qty > crop.land * 80) {
    if(!confirm(`Warning: Yield of ${qty} Quintals seems unusually high for a ${crop.land} acre farm. Do you want to proceed?`)) return;
  }

  const idx = state.currentUser.sales.findIndex(s => s.id === id);
  if (idx !== -1) {
    const updatedData = { cropId, qty, unit, pricePerUnit, date };

    try {
      showToast('Saving changes...', 'success');
      await dbUpdateSale(state.currentUser.id, id, updatedData);

      // Update local state in-memory
      state.currentUser.sales[idx] = { ...state.currentUser.sales[idx], ...updatedData };

      closeModal('editSaleModal');
      showToast('Sale updated! ✅', 'success');
      renderSales();
    } catch (err) {
      console.error("Failed to update sale:", err);
      showToast("Update failed: " + err.message, "error");
    }
  }
}

async function deleteSale(saleId) {
  if (!confirm('Delete this sale record?')) return;
  
  try {
    showToast('Deleting sale...', 'success');
    await dbDeleteSale(state.currentUser.id, saleId);

    // Update local state in-memory
    state.currentUser.sales = state.currentUser.sales.filter(s => s.id !== saleId);

    showToast('Sale deleted.', 'success');
    renderSales();
  } catch (err) {
    console.error("Failed to delete sale:", err);
    showToast("Deletion failed: " + err.message, "error");
  }
}

function handleSalesDateFilterChange() {
  const dateFilter = document.getElementById('salesFilterDate');
  const customInputs = document.getElementById('salesCustomDateInputs');
  if (dateFilter && customInputs) {
    if (dateFilter.value === 'custom') {
      customInputs.style.display = 'flex';
    } else {
      customInputs.style.display = 'none';
    }
  }
  renderSales();
}

function renderSales() {
  const sales = state.currentUser?.sales || [];
  const crops = state.currentUser?.crops || [];

  // 1. Dynamic Dropdown Population
  const cropFilter = document.getElementById('salesFilterCrop');
  if (cropFilter) {
    const currentVal = cropFilter.value || 'all';
    cropFilter.innerHTML = '<option value="all">All Crops</option>' +
      crops.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    cropFilter.value = currentVal;
  }

  // 2. Read filter and sort inputs
  const cid = cropFilter ? cropFilter.value : 'all';
  const dateFilter = document.getElementById('salesFilterDate')?.value || 'all';
  const sortBy = document.getElementById('salesSort')?.value || 'date-newest';
  const customStart = document.getElementById('salesFilterStartDate')?.value || '';
  const customEnd = document.getElementById('salesFilterEndDate')?.value || '';

  // 3. Filter Sales
  let filteredSales = [...sales];
  if (cid !== 'all') {
    filteredSales = filteredSales.filter(s => s.cropId === cid);
  }
  
  filteredSales = filterByDateRange(filteredSales, dateFilter, customStart, customEnd);

  // 4. Sort Sales
  filteredSales.sort((a, b) => {
    const amtA = a.qty * a.pricePerUnit;
    const amtB = b.qty * b.pricePerUnit;
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);

    if (sortBy === 'date-newest') return dateB - dateA;
    if (sortBy === 'date-oldest') return dateA - dateB;
    if (sortBy === 'amount-highest') return amtB - amtA;
    if (sortBy === 'amount-lowest') return amtA - amtB;
    return 0;
  });

  // 5. Update Stat Cards (Filtered Totals)
  const totalRev = filteredSales.reduce((s, sa) => s + sa.qty * sa.pricePerUnit, 0);
  document.getElementById('salesTotalRev').textContent = '₹' + fmtNum(totalRev);
  document.getElementById('salesTotalTx').textContent  = filteredSales.length;

  // Best crop by revenue among filtered sales
  const revByCrop = {};
  filteredSales.forEach(sa => { revByCrop[sa.cropId] = (revByCrop[sa.cropId] || 0) + sa.qty * sa.pricePerUnit; });
  const bestId   = Object.entries(revByCrop).sort((a, b) => b[1] - a[1])[0]?.[0];
  const bestCrop = crops.find(c => c.id === bestId);
  document.getElementById('salesBestCrop').textContent = bestCrop ? bestCrop.name.split('(')[0].trim() : '—';

  // 6. Build the summary nudge text
  const activeFilters = [];
  if (cid !== 'all') {
    const crop = crops.find(c => c.id === cid);
    if (crop) activeFilters.push(crop.name);
  }
  if (dateFilter !== 'all') {
    if (dateFilter === 'custom') {
      activeFilters.push('Custom range');
    } else {
      const optionText = document.getElementById('salesFilterDate')?.options[document.getElementById('salesFilterDate').selectedIndex]?.text;
      activeFilters.push(optionText || dateFilter);
    }
  }
  
  const sectionTitle = document.querySelector('#tab-sales .section-title');
  if (sectionTitle) {
    if (activeFilters.length > 0) {
      sectionTitle.innerHTML = `Sale Records <span style="font-size:12px;color:var(--clay);font-weight:600;margin-left:10px;background:rgba(15,118,110,0.1);color:var(--sage);padding:4px 10px;border-radius:20px;">Showing ${filteredSales.length} sales — ₹${fmtNum(totalRev)} total for ${activeFilters.join(' / ')}</span>`;
    } else {
      sectionTitle.innerHTML = `Sale Records <span style="font-size:12px;color:var(--clay);font-weight:600;margin-left:10px;background:rgba(100,116,139,0.06);padding:4px 10px;border-radius:20px;">Showing ${filteredSales.length} sales — ₹${fmtNum(totalRev)} total</span>`;
    }
  }

  // 7. Render grid
  const grid = document.getElementById('salesGrid');
  if (!filteredSales.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <div class="empty-state-icon">📦</div>
      <div class="empty-state-title">No matching sales</div>
      <div class="empty-state-sub">Adjust your filters or add a new harvest sale.</div>
    </div>`;
    return;
  }

  grid.innerHTML = filteredSales.map(sa => {
    const crop = crops.find(c => c.id === sa.cropId);
    return `<div class="sale-card">
      <div class="sale-crop-name">${crop ? crop.name : 'Unknown Crop'}</div>
      <div class="sale-row">
        <div class="sale-row-label">📦 ${sa.qty} ${sa.unit} × ₹${fmtNum(sa.pricePerUnit)}</div>
        <div class="sale-row-value" style="font-size:18px;font-weight:800;color:var(--sage);">₹${fmtNum(sa.qty * sa.pricePerUnit)}</div>
      </div>
      <div class="sale-row" style="align-items:center;margin-top:8px;border-top:1px dashed rgba(123,74,45,0.08);padding-top:8px;">
        <div class="sale-row-label">📅 ${formatDate(sa.date)}</div>
        <div style="display:flex;gap:6px;">
          <button onclick="openEditSale('${sa.id}')" style="background:rgba(90,122,74,0.1);border:none;border-radius:6px;width:28px;height:28px;cursor:pointer;font-size:12px;" title="Edit">✏️</button>
          <button onclick="deleteSale('${sa.id}')" style="background:rgba(192,68,26,0.1);border:none;border-radius:6px;width:28px;height:28px;cursor:pointer;font-size:12px;color:var(--rust);" title="Delete">🗑️</button>
        </div>
      </div>
    </div>`;
  }).join('');
}


function updateSalePreview() {
  const qty   = parseFloat(document.getElementById('saleQty').value) || 0;
  const price = parseFloat(document.getElementById('salePricePerUnit').value) || 0;
  const total = qty * price;
  document.getElementById('salePreview').innerHTML = `
    <div class="calc-preview-label">Total Revenue = ${qty} × ₹${fmtNum(price)}</div>
    <div class="calc-preview-value">₹ ${fmtNum(total)}</div>`;
}

