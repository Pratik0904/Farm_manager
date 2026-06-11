// ===================== HELPERS =====================

function fmtNum(n) {
  if (!n) return '0';
  return n.toLocaleString('en-IN');
}

function fmtNumShort(n) {
  if (n >= 100000) return (n / 100000).toFixed(1) + 'L';
  if (n >= 1000)   return (n / 1000).toFixed(1) + 'K';
  return Math.round(n).toString();
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getExpensesForCrop(cropId) {
  return (state.currentUser?.expenses || []).filter(e => e.cropId === cropId);
}

function getRevenueForCrop(cropId) {
  return (state.currentUser?.sales || [])
    .filter(s => s.cropId === cropId)
    .reduce((sum, s) => sum + s.qty * s.pricePerUnit, 0);
}

function animateCount(id, target, prefix = '') {
  const el = document.getElementById(id);
  if (!el) return;
  const start    = Date.now();
  const duration = 800;

  const tick = () => {
    const elapsed  = Date.now() - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased    = 1 - Math.pow(1 - progress, 3);
    const val      = Math.round(target * eased);
    el.textContent = prefix + fmtNum(val);
    if (progress < 1) requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
}

function showToast(msg, type = '') {
  const container = document.getElementById('toastContainer');
  const toast      = document.createElement('div');
  toast.className  = `toast ${type}`;
  const icons = { success: '✅', error: '❌', '': 'ℹ️' };
  toast.innerHTML = `<span>${icons[type]}</span> ${msg}`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity   = '0';
    toast.style.transform = 'translateX(20px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function polarToXY(cx, cy, r, angle) {
  const rad = (angle * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

/**
 * Filter records by date range criteria.
 */
function filterByDateRange(records, rangeType, customStart, customEnd) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return records.filter(r => {
    if (!r.date) return false;
    // Normalize date string parsing
    const rDate = new Date(r.date);
    
    switch (rangeType) {
      case 'this-month': {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return rDate >= startOfMonth && rDate <= now;
      }
      case 'last-3-months': {
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(now.getMonth() - 3);
        return rDate >= threeMonthsAgo && rDate <= now;
      }
      case 'this-year': {
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        return rDate >= startOfYear && rDate <= now;
      }
      case 'custom': {
        if (!customStart || !customEnd) return true;
        const start = new Date(customStart);
        const end = new Date(customEnd);
        end.setHours(23, 59, 59, 999);
        return rDate >= start && rDate <= end;
      }
      case 'all':
      default:
        return true;
    }
  });
}

function getCropOptionText(c) {
  const year = c.year || (c.startDate ? new Date(c.startDate).getFullYear() : '');
  return `${c.name} (${c.season}${year ? ' ' + year : ''})`;
}
