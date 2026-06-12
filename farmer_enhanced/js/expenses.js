// ===================== EXPENSES =====================

async function addExpense() {
  const cropId   = document.getElementById('expCropSelect').value;
  const category = document.getElementById('expCategory').value;
  const amount   = parseFloat(document.getElementById('expAmount').value);
  const date     = document.getElementById('expDate').value;
  const notes    = document.getElementById('expNotes').value;

  if (!cropId || !amount || !date) { showToast('Fill crop, amount & date', 'error'); return; }

  const exp = { cropId, category, amount, date, notes };

  try {
    showToast('Saving expense...', 'success');
    const savedExp = await dbAddExpense(state.currentUser.id, exp);
    
    // Update local state in-memory
    state.currentUser.expenses.push(savedExp);

    closeModal('addExpenseModal');
    showToast('Expense recorded! 💸', 'success');
    renderExpenses();
  } catch (err) {
    console.error("Failed to add expense:", err);
    showToast("Failed to add expense: " + err.message, "error");
  }
}

function openEditExpense(expId) {
  const exp   = state.currentUser.expenses.find(e => e.id === expId);
  if (!exp) return;

  document.getElementById('editExpenseId').value  = exp.id;
  document.getElementById('editExpAmount').value  = exp.amount;
  document.getElementById('editExpDate').value    = exp.date;
  document.getElementById('editExpNotes').value   = exp.notes || '';
  document.getElementById('editExpCategory').value = exp.category;

  // Populate crop select
  const sel = document.getElementById('editExpCropSelect');
  sel.innerHTML = state.currentUser.crops.map(c =>
    `<option value="${c.id}" ${c.id === exp.cropId ? 'selected' : ''}>${getCropOptionText(c)}</option>`
  ).join('');

  openModal('editExpenseModal');
}

async function saveEditedExpense() {
  const id       = document.getElementById('editExpenseId').value;
  const cropId   = document.getElementById('editExpCropSelect').value;
  const category = document.getElementById('editExpCategory').value;
  const amount   = parseFloat(document.getElementById('editExpAmount').value);
  const date     = document.getElementById('editExpDate').value;
  const notes    = document.getElementById('editExpNotes').value;

  if (!cropId || !amount || !date) { showToast('Fill all fields', 'error'); return; }

  const idx = state.currentUser.expenses.findIndex(e => e.id === id);
  if (idx !== -1) {
    const updatedData = { cropId, category, amount, date, notes };

    try {
      showToast('Saving changes...', 'success');
      await dbUpdateExpense(state.currentUser.id, id, updatedData);

      // Update local state in-memory
      state.currentUser.expenses[idx] = { ...state.currentUser.expenses[idx], ...updatedData };

      closeModal('editExpenseModal');
      showToast('Expense updated! ✅', 'success');
      renderExpenses();
    } catch (err) {
      console.error("Failed to update expense:", err);
      showToast("Update failed: " + err.message, "error");
    }
  }
}

async function deleteExpense(expId) {
  if (!confirm('Delete this expense record?')) return;
  
  try {
    showToast('Deleting expense...', 'success');
    await dbDeleteExpense(state.currentUser.id, expId);

    // Update local state in-memory
    state.currentUser.expenses = state.currentUser.expenses.filter(e => e.id !== expId);

    showToast('Expense deleted.', 'success');
    renderExpenses();
  } catch (err) {
    console.error("Failed to delete expense:", err);
    showToast("Deletion failed: " + err.message, "error");
  }
}

function renderExpenses() {
  const crops   = state.currentUser?.crops || [];
  const tabsWrap = document.getElementById('expenseCropTabs');

  // Populate crop filter dropdown dynamically
  const cropFilter = document.getElementById('expenseFilterCrop');
  if (cropFilter) {
    const currentVal = cropFilter.value || 'all';
    cropFilter.innerHTML = '<option value="all">All Crops</option>' +
      crops.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    
    if (state.selectedExpenseCropId) {
      cropFilter.value = state.selectedExpenseCropId;
    } else {
      cropFilter.value = 'all';
    }
  }

  if (!crops.length) {
    if (tabsWrap) tabsWrap.innerHTML = '<div class="crop-tab" style="color:var(--clay)">No crops added yet</div>';
    renderExpenseContent();
    return;
  }

  if (tabsWrap) {
    const isAllActive = !state.selectedExpenseCropId || state.selectedExpenseCropId === 'all';
    tabsWrap.innerHTML = `
      <div class="crop-tab ${isAllActive ? 'active' : ''}" onclick="selectExpenseCrop('all')">
        All Crops
      </div>
    ` + crops.map(c => {
      const total = getExpensesForCrop(c.id).reduce((s, e) => s + e.amount, 0);
      return `<div class="crop-tab ${c.id === state.selectedExpenseCropId ? 'active' : ''}" onclick="selectExpenseCrop('${c.id}')">
        ${c.name}
        <span class="crop-tab-amount">₹${fmtNum(total)}</span>
      </div>`;
    }).join('');
  }

  renderExpenseContent();
}

function selectExpenseCrop(id) {
  state.selectedExpenseCropId = id;
  const cropFilter = document.getElementById('expenseFilterCrop');
  if (cropFilter) {
    cropFilter.value = id;
  }
  renderExpenses();
}

function handleExpenseDateFilterChange() {
  const dateFilter = document.getElementById('expenseFilterDate');
  const customInputs = document.getElementById('expenseCustomDateInputs');
  if (dateFilter && customInputs) {
    if (dateFilter.value === 'custom') {
      customInputs.style.display = 'flex';
    } else {
      customInputs.style.display = 'none';
    }
  }
  renderExpenses();
}

function renderExpenseContent() {
  const crops = state.currentUser?.crops || [];
  const expenses = state.currentUser?.expenses || [];

  // Read filter values
  const cid = state.selectedExpenseCropId || 'all';
  const categoryFilter = document.getElementById('expenseFilterCategory')?.value || 'all';
  const dateFilter = document.getElementById('expenseFilterDate')?.value || 'all';
  const customStart = document.getElementById('expenseFilterStartDate')?.value || '';
  const customEnd = document.getElementById('expenseFilterEndDate')?.value || '';

  // 1. Filter by Crop
  let filteredExps = expenses;
  if (cid !== 'all') {
    filteredExps = filteredExps.filter(e => e.cropId === cid);
  }

  // 2. Filter by Category
  if (categoryFilter !== 'all') {
    filteredExps = filteredExps.filter(e => e.category === categoryFilter);
  }

  // 3. Filter by Date Range
  filteredExps = filterByDateRange(filteredExps, dateFilter, customStart, customEnd);

  // Calculate total
  const total = filteredExps.reduce((s, e) => s + e.amount, 0);

  // Crop details for headers
  const crop = crops.find(c => c.id === cid);
  const cropNameStr = crop ? crop.name : 'All Crops';
  const cropSeasonStr = crop ? `${crop.name} · ${crop.season}` : 'All Crops';

  // Build filtered total summary nudge
  let filterText = `Showing ${filteredExps.length} expenses`;
  if (cid !== 'all' || categoryFilter !== 'all' || dateFilter !== 'all') {
    const activeFilters = [];
    if (cid !== 'all') activeFilters.push(crop ? crop.name : 'Selected Crop');
    if (categoryFilter !== 'all') activeFilters.push(categoryFilter);
    if (dateFilter !== 'all') {
      if (dateFilter === 'custom') {
        activeFilters.push('Custom range');
      } else {
        const optionText = document.getElementById('expenseFilterDate')?.options[document.getElementById('expenseFilterDate').selectedIndex]?.text;
        activeFilters.push(optionText || dateFilter);
      }
    }
    filterText += ` — ₹${fmtNum(total)} total for ${activeFilters.join(' / ')} this season.`;
  } else {
    filterText += ` — ₹${fmtNum(total)} total.`;
  }

  document.getElementById('expenseTabCropName').textContent = cropNameStr;
  document.getElementById('expenseCardCrop').textContent    = cropSeasonStr;
  document.getElementById('expenseTotalValue').textContent  = '₹' + fmtNum(total);
  document.getElementById('expenseCount').innerHTML         = `<span style="background: rgba(15,118,110,0.1); color: var(--sage); padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700;">${filterText}</span>`;

  // Render list
  const listEl = document.getElementById('expenseList');
  if (!filteredExps.length) {
    listEl.innerHTML = `<div class="empty-state" style="padding:40px 20px;">
      <div class="empty-state-icon">💸</div>
      <div class="empty-state-title">No matching expenses</div>
      <div class="empty-state-sub">Try adjusting your filters or record a new expense.</div>
    </div>`;
  } else {
    listEl.innerHTML = [...filteredExps].reverse().map(e => {
      const eCrop = crops.find(c => c.id === e.cropId);
      const eCropName = eCrop ? eCrop.name : 'Unknown';
      return `
      <div class="expense-item">
        <div class="expense-cat-icon ${CAT_COLORS[e.category]}">${CAT_ICONS[e.category]}</div>
        <div class="expense-item-info">
          <div class="expense-item-name">${escapeHTML(e.category)} <span style="font-size:11px;color:var(--clay);font-weight:normal;margin-left:6px;">(${escapeHTML(eCropName)})</span></div>
          <div class="expense-item-meta">${formatDate(e.date)}${e.notes ? ' · ' + escapeHTML(e.notes) : ''}</div>
        </div>
        <div class="expense-item-amount">₹${fmtNum(e.amount)}</div>
        <div style="display:flex;gap:6px;margin-left:10px;flex-shrink:0;">
          <button onclick="openEditExpense('${e.id}')" style="background:rgba(90,122,74,0.1);border:none;border-radius:6px;width:28px;height:28px;cursor:pointer;font-size:13px;" title="Edit">✏️</button>
          <button onclick="deleteExpense('${e.id}')" style="background:rgba(192,68,26,0.1);border:none;border-radius:6px;width:28px;height:28px;cursor:pointer;font-size:13px;color:var(--rust);" title="Delete">🗑️</button>
        </div>
      </div>`;
    }).join('');
  }

  // Category breakdown
  const catTotals = {};
  CATEGORIES.forEach(c => { catTotals[c] = 0; });
  filteredExps.forEach(e => { catTotals[e.category] = (catTotals[e.category] || 0) + e.amount; });
  const maxVal = Math.max(...Object.values(catTotals), 1);

  document.getElementById('catBreakdown').innerHTML = CATEGORIES.map(c => {
    const amt = catTotals[c];
    const pct = Math.round((amt / maxVal) * 100);
    return `<div class="cat-row">
      <div style="font-size:14px;">${CAT_ICONS[c]}</div>
      <div class="cat-row-label">${c}</div>
      <div class="cat-row-bar-wrap"><div class="cat-row-bar" style="width:${pct}%;background:${CAT_CLRS[c]}"></div></div>
      <div class="cat-row-amount">₹${fmtNum(amt)}</div>
    </div>`;
  }).join('');
}

