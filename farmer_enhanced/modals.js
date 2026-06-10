// ===================== MODALS =====================

function openModal(id) {
  if (id === 'addExpenseModal') {
    populateCropSelect('expCropSelect');
    document.getElementById('expDate').valueAsDate = new Date();
  }
  if (id === 'addSaleModal') populateCropSelect('saleCropSelect');
  if (id === 'addUdhariModal') {
    document.getElementById('addUdhariDate').valueAsDate = new Date();
    document.getElementById('addUdhariName').value = '';
    document.getElementById('addUdhariPhone').value = '';
    document.getElementById('addUdhariAmount').value = '';
    document.getElementById('addUdhariNotes').value = '';
  }
  document.getElementById(id).classList.add('open');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

function populateCropSelect(selectId) {
  const sel   = document.getElementById(selectId);
  const crops = state.currentUser?.crops || [];
  sel.innerHTML = crops.length
    ? crops.map(c => `<option value="${c.id}">${c.name} (${c.season})</option>`).join('')
    : '<option value="">No crops added yet</option>';
}

// Close modal on overlay click
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('open');
  }
});

// ===================== FAB =====================
function handleFab() {
  const tabActions = {
    crops:    () => openModal('addCropModal'),
    expenses: () => openModal('addExpenseModal'),
    sales:    () => openModal('addSaleModal'),
    udhari:   () => openModal('addUdhariModal'),
    dashboard:() => openModal('addCropModal'),
    compare:  () => {},
  };
  (tabActions[state.currentTab] || tabActions.dashboard)();
}
