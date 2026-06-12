// ===================== UDHARI KHATA LOGIC =====================

/**
 * Renders the Udhari Khata tab content.
 */
function renderUdhari() {
  const user = state.currentUser;
  if (!user) return;

  const udhariList = user.udhari || [];

  // 1. Calculate Totals
  const totalTake = udhariList.filter(u => u.type === 'take').reduce((sum, u) => sum + Number(u.amount), 0);
  const totalGive = udhariList.filter(u => u.type === 'give').reduce((sum, u) => sum + Number(u.amount), 0);

  // 2. Animate and Update Totals on Top Cards
  animateCount('udhariTotalTake', totalTake, '₹');
  animateCount('udhariTotalGive', totalGive, '₹');

  // 3. Render Receivables (Log Dene Wale)
  const takeList = udhariList.filter(u => u.type === 'take');
  document.getElementById('udhariCountTake').textContent = `${takeList.length} Entries`;
  const takeContainer = document.getElementById('udhariListTake');

  if (takeList.length === 0) {
    takeContainer.innerHTML = `
      <div class="empty-state" style="padding: 30px 20px;">
        <div class="empty-state-icon">📥</div>
        <div class="empty-state-title">No Receivables</div>
        <div class="empty-state-sub">No one owes you money right now.</div>
      </div>`;
  } else {
    takeContainer.innerHTML = takeList.map(u => renderUdhariCard(u)).join('');
  }

  // 4. Render Payables (Main Deta Hoon)
  const giveList = udhariList.filter(u => u.type === 'give');
  document.getElementById('udhariCountGive').textContent = `${giveList.length} Entries`;
  const giveContainer = document.getElementById('udhariListGive');

  if (giveList.length === 0) {
    giveContainer.innerHTML = `
      <div class="empty-state" style="padding: 30px 20px;">
        <div class="empty-state-icon">📤</div>
        <div class="empty-state-title">No Payables</div>
        <div class="empty-state-sub">You don't owe anyone money right now.</div>
      </div>`;
  } else {
    giveContainer.innerHTML = giveList.map(u => renderUdhariCard(u)).join('');
  }
}

/**
 * Generates HTML for an Udhari card item.
 */
function renderUdhariCard(u) {
  const formattedDate = u.date ? formatDate(u.date) : 'No Date';
  const cleanPhone = u.phone ? u.phone.replace(/[^0-9]/g, '') : '';
  const waLink = cleanPhone ? `https://wa.me/${cleanPhone}` : '#';

  return `
    <div class="udhari-card ${u.type}">
      <div class="udhari-card-header">
        <div class="udhari-card-info">
          <div class="udhari-card-name">👤 ${escapeHTML(u.name)}</div>
          ${u.phone ? `
            <div class="udhari-card-contacts">
              <a href="tel:${escapeHTML(u.phone)}" class="contact-btn phone-btn">📞 ${escapeHTML(u.phone)}</a>
              <a href="${waLink}" target="_blank" class="contact-btn wa-btn">💬 WhatsApp</a>
            </div>` : ''}
        </div>
        <div class="udhari-card-amount">₹${fmtNum(u.amount)}</div>
      </div>
      <div class="udhari-card-body">
        <div class="udhari-card-notes">📋 ${escapeHTML(u.notes) || 'No description'}</div>
        <div class="udhari-card-date">📅 ${formattedDate}</div>
      </div>
      <div class="udhari-card-actions">
        <button class="action-btn edit-btn" onclick="openEditUdhari('${u.id}')">✏️ Edit</button>
        <button class="action-btn settle-btn" onclick="settleUdhariEntry('${u.id}')">✅ Settle</button>
      </div>
    </div>`;
}

/**
 * Handles adding a new Udhari entry.
 */
async function addUdhariEntry() {
  const type = document.getElementById('addUdhariType').value;
  const name = document.getElementById('addUdhariName').value.trim();
  const phone = document.getElementById('addUdhariPhone').value.trim();
  const amount = parseFloat(document.getElementById('addUdhariAmount').value);
  const date = document.getElementById('addUdhariDate').value;
  const notes = document.getElementById('addUdhariNotes').value.trim();

  // Validate inputs
  if (!name) {
    showToast("Please enter a person's name", "error");
    return;
  }
  if (isNaN(amount) || amount <= 0) {
    showToast("Please enter a valid amount", "error");
    return;
  }
  if (!date) {
    showToast("Please select a date", "error");
    return;
  }

  try {
    const entry = { type, name, phone, amount, date, notes };
    const savedEntry = await dbAddUdhari(state.currentUser.id, entry);
    
    // Update local state
    state.currentUser.udhari.push(savedEntry);
    
    closeModal('addUdhariModal');
    renderUdhari();
    showToast("Udhari entry added successfully", "success");
  } catch (err) {
    console.error("Error adding Udhari entry:", err);
    showToast("Failed to add entry: " + err.message, "error");
  }
}

/**
 * Opens and prepopulates the Edit Udhari modal.
 */
function openEditUdhari(id) {
  const entry = state.currentUser.udhari.find(u => u.id === id);
  if (!entry) return;

  document.getElementById('editUdhariId').value = entry.id;
  document.getElementById('editUdhariType').value = entry.type;
  document.getElementById('editUdhariName').value = entry.name;
  document.getElementById('editUdhariPhone').value = entry.phone || '';
  document.getElementById('editUdhariAmount').value = entry.amount;
  document.getElementById('editUdhariDate').value = entry.date;
  document.getElementById('editUdhariNotes').value = entry.notes || '';

  openModal('editUdhariModal');
}

/**
 * Handles saving changes to an edited Udhari entry.
 */
async function saveEditedUdhari() {
  const id = document.getElementById('editUdhariId').value;
  const type = document.getElementById('editUdhariType').value;
  const name = document.getElementById('editUdhariName').value.trim();
  const phone = document.getElementById('editUdhariPhone').value.trim();
  const amount = parseFloat(document.getElementById('editUdhariAmount').value);
  const date = document.getElementById('editUdhariDate').value;
  const notes = document.getElementById('editUdhariNotes').value.trim();

  // Validate inputs
  if (!name) {
    showToast("Please enter a person's name", "error");
    return;
  }
  if (isNaN(amount) || amount <= 0) {
    showToast("Please enter a valid amount", "error");
    return;
  }
  if (!date) {
    showToast("Please select a date", "error");
    return;
  }

  try {
    const entryData = { type, name, phone, amount, date, notes };
    await dbUpdateUdhari(state.currentUser.id, id, entryData);
    
    // Update local state
    const index = state.currentUser.udhari.findIndex(u => u.id === id);
    if (index !== -1) {
      state.currentUser.udhari[index] = { id, ...entryData };
    }

    closeModal('editUdhariModal');
    renderUdhari();
    showToast("Udhari entry updated successfully", "success");
  } catch (err) {
    console.error("Error updating Udhari entry:", err);
    showToast("Failed to update entry: " + err.message, "error");
  }
}

/**
 * Handles settling/deleting an Udhari entry.
 */
async function settleUdhariEntry(id) {
  const entry = state.currentUser.udhari.find(u => u.id === id);
  if (!entry) return;

  const confirmMsg = `Are you sure you want to settle the payment of ₹${fmtNum(entry.amount)} with ${entry.name}?`;
  if (!confirm(confirmMsg)) return;

  try {
    await dbDeleteUdhari(state.currentUser.id, id);
    
    // Remove from local state
    state.currentUser.udhari = state.currentUser.udhari.filter(u => u.id !== id);
    
    renderUdhari();
    showToast(`Payment settled with ${entry.name}`, "success");
  } catch (err) {
    console.error("Error settling Udhari entry:", err);
    showToast("Failed to settle entry: " + err.message, "error");
  }
}
