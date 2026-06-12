// ===================== DASHBOARD =====================

function renderDashboard() {
  const user = state.currentUser;
  if (!user) return;

  const { crops, expenses, sales } = user;
  const totalExp = expenses.reduce((s, e) => s + e.amount, 0);
  const totalRev = sales.reduce((s, sa) => s + sa.qty * sa.pricePerUnit, 0);
  const profit   = totalRev - totalExp;

  animateCount('totalExpense', totalExp, '₹');
  animateCount('totalRevenue', totalRev, '₹');
  animateCount('totalProfit', Math.abs(profit), '₹');

  const profitCard  = document.getElementById('profitCard');
  profitCard.className = `summary-card ${profit >= 0 ? 'profit' : 'loss'}`;

  const profitTrend = document.getElementById('profitTrend');
  profitTrend.textContent = profit >= 0 ? '▲ Profit' : '▼ Loss';
  profitTrend.className   = `summary-card-trend ${profit >= 0 ? 'trend-up' : 'trend-down'}`;

  // Dynamic Expense Trend (OER - Operating Expense Ratio)
  const expenseTrend = document.getElementById('expenseTrend');
  if (expenseTrend) {
    const expPercent = totalRev > 0 ? Math.round((totalExp / totalRev) * 100) : (totalExp > 0 ? 100 : 0);
    if (expPercent > 70) {
      expenseTrend.className = 'summary-card-trend trend-down';
      expenseTrend.textContent = `▲ ${expPercent}%`;
    } else if (expPercent > 0) {
      expenseTrend.className = 'summary-card-trend trend-up';
      expenseTrend.textContent = `↓ ${expPercent}%`;
    } else {
      expenseTrend.className = 'summary-card-trend trend-up';
      expenseTrend.textContent = '0%';
    }
  }

  // Dynamic Revenue Trend (Net Profit Margin)
  const revenueTrend = document.getElementById('revenueTrend');
  if (revenueTrend) {
    const margin = totalRev > 0 ? Math.round((profit / totalRev) * 100) : 0;
    if (margin > 0) {
      revenueTrend.className = 'summary-card-trend trend-up';
      revenueTrend.textContent = `▲ ${margin}%`;
    } else if (margin < 0) {
      revenueTrend.className = 'summary-card-trend trend-down';
      revenueTrend.textContent = `▼ ${Math.abs(margin)}%`;
    } else {
      revenueTrend.className = 'summary-card-trend trend-up';
      revenueTrend.textContent = '0%';
    }
  }

  // Crop summary list
  const dashList = document.getElementById('dashCropList');
  if (dashList) {
    if (!crops.length) {
      dashList.innerHTML = `
        <div class="empty-state" style="padding: 24px;">
          <div class="empty-state-icon">🌱</div>
          <div class="empty-state-title">No crops yet</div>
          <div class="empty-state-sub">Add crops in the "My Crops" tab to see financial summaries.</div>
        </div>`;
    } else {
      dashList.innerHTML = crops.map(crop => {
        const cropExp = expenses.filter(e => e.cropId === crop.id).reduce((s, e) => s + e.amount, 0);
        const cropRev = sales.filter(s => s.cropId === crop.id).reduce((s, sa) => s + sa.qty * sa.pricePerUnit, 0);
        const p = cropRev - cropExp;
        const imgKey = Object.keys(CROP_IMAGES).find(k => crop.name.includes(k)) || 'default';
        const imgUrl = CROP_IMAGES[imgKey];

        return `
          <div class="dash-crop-item">
            <div class="dash-crop-img" style="background-image:url('${imgUrl}')"></div>
            <div class="dash-crop-main">
              <div class="dash-crop-name">${crop.name}</div>
              <div class="dash-crop-meta">
                <span>🌿 ${crop.land} ac</span> &nbsp;&nbsp;
                <span class="status-badge status-${crop.status.toLowerCase()}" style="padding:2px 8px;font-size:10px;">${crop.status === 'Growing' ? '🌱 ' : '✅'} ${crop.status}</span>
              </div>
            </div>
            <div class="dash-crop-finance" style="align-items:center;">
               <div style="font-size:11px;color:var(--clay);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:2px;">Expenses</div>
               <div style="font-family:var(--font-mono);font-size:13px;font-weight:600;color:var(--rust);">₹${fmtNum(cropExp)}</div>
            </div>
            <div class="dash-crop-finance" style="align-items:center;margin-left:8px;">
               <div style="font-size:11px;color:var(--clay);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:2px;">Revenue</div>
               <div style="font-family:var(--font-mono);font-size:13px;font-weight:600;color:var(--sage);">₹${fmtNum(cropRev)}</div>
            </div>
            <div class="dash-crop-finance" style="margin-left:14px;background:rgba(250,246,238,0.7);padding:8px 12px;border-radius:8px;border:1px solid rgba(123,74,45,0.06);">
              <div class="dash-crop-profit ${p >= 0 ? 'pos' : 'neg'}">${p >= 0 ? '+' : ''}₹${fmtNum(p)}</div>
              <div class="dash-crop-rev">Net Profit</div>
            </div>
          </div>`;
      }).join('');
    }
  }

  renderCostPerAcreChart();
  renderCatBreakdownChart();
  renderLandPieChart();
  renderCropExpChart();
  
  // Initialize weather widget with cache check
  if (typeof initWeather === 'function') {
    initWeather();
  }
}

// Chart.js global config and instances
const chartInstances = {};

Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.color = '#64748B'; // Slate 500
Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(15, 23, 42, 0.9)';
Chart.defaults.plugins.tooltip.titleFont = { family: "'Inter', sans-serif", size: 13, weight: 'bold' };
Chart.defaults.plugins.tooltip.bodyFont = { family: "'Inter', sans-serif", size: 12 };
Chart.defaults.plugins.tooltip.padding = 12;
Chart.defaults.plugins.tooltip.cornerRadius = 8;
Chart.defaults.scale.grid.color = 'rgba(226, 232, 240, 0.5)'; // Slate 200 light
Chart.defaults.scale.grid.borderColor = 'transparent';

// ===================== CHARTS =====================

function destroyChart(id) {
  if (chartInstances[id]) {
    chartInstances[id].destroy();
    delete chartInstances[id];
  }
}

function renderCostPerAcreChart() {
  const user  = state.currentUser;
  const crops = user.crops;
  const ctx   = document.getElementById('costPerAcreChart');
  if (!ctx) return;
  if (!crops.length) {
    destroyChart('costPerAcre');
    return;
  }

  const data = crops.map(c => {
    const exp = user.expenses.filter(e => e.cropId === c.id).reduce((s, e) => s + e.amount, 0);
    return { label: c.name.split('(')[0].trim(), value: c.land > 0 ? Math.round(exp / c.land) : 0 };
  });

  destroyChart('costPerAcre');
  chartInstances['costPerAcre'] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.map(d => d.label),
      datasets: [{
        label: 'Cost per Acre',
        data: data.map(d => d.value),
        backgroundColor: 'rgba(13, 148, 136, 0.85)',
        hoverBackgroundColor: 'rgba(20, 184, 166, 1)',
        borderRadius: 6,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function(context) {
              return ' ' + context.dataset.label + ': ₹' + context.raw.toLocaleString('en-IN');
            }
          }
        }
      },
      scales: {
        y: { 
          beginAtZero: true, 
          grid: { borderDash: [4, 4] },
          ticks: {
            callback: function(value) {
              return '₹' + value.toLocaleString('en-IN');
            }
          }
        },
        x: { grid: { display: false } }
      }
    }
  });
}

function renderCatBreakdownChart() {
  const user = state.currentUser;
  const ctx  = document.getElementById('catBreakdownChart');
  if (!ctx) return;

  const totals = {};
  CATEGORIES.forEach(c => totals[c] = 0);
  user.expenses.forEach(e => { totals[e.category] = (totals[e.category] || 0) + e.amount; });

  const catClrs = CATEGORIES.map(c => CAT_CLRS[c] || '#64748B');

  destroyChart('catBreakdown');
  chartInstances['catBreakdown'] = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: CATEGORIES,
      datasets: [{
        data: CATEGORIES.map(c => totals[c]),
        backgroundColor: catClrs,
        borderWidth: 2,
        borderColor: '#F8FAFC',
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%',
      plugins: {
        legend: { 
          position: 'bottom', 
          labels: { 
            usePointStyle: true, 
            boxWidth: 8,
            padding: 15,
            font: { size: 11, weight: '500' }
          } 
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return ' ' + context.label + ': ₹' + context.raw.toLocaleString('en-IN');
            }
          }
        }
      }
    }
  });
}

function renderLandPieChart() {
  const user  = state.currentUser;
  const crops = user.crops || [];
  const ctx   = document.getElementById('landPieChart');
  if (!ctx) return;

  const totalLand = parseFloat(user.totalLand) || 0;
  const allocatedLand = crops.reduce((sum, c) => sum + (parseFloat(c.land) || 0), 0);
  const unplantedLand = Math.max(0, totalLand - allocatedLand);

  if (totalLand <= 0 && crops.length === 0) {
    destroyChart('landPie');
    return;
  }

  const data = [];
  const labels = [];
  const backgroundColors = [];

  // Add crops
  const colors = ['#0F766E', '#14B8A6', '#D97706', '#F59E0B', '#E11D48', '#0284C7'];
  crops.forEach((c, idx) => {
    const landVal = parseFloat(c.land) || 0;
    if (landVal > 0) {
      data.push(landVal);
      labels.push(`${c.name.split('(')[0].trim()} (${landVal.toFixed(2)} ac)`);
      backgroundColors.push(colors[idx % colors.length]);
    }
  });

  // Add unplanted portion if it is positive
  if (unplantedLand > 0.01) {
    data.push(unplantedLand);
    labels.push(`Unplanted (${unplantedLand.toFixed(2)} ac)`);
    backgroundColors.push('#94A3B8'); // Slate 400 (Grey)
  }

  destroyChart('landPie');
  chartInstances['landPie'] = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: backgroundColors,
        borderWidth: 2,
        borderColor: '#F8FAFC',
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { 
          position: 'bottom', 
          labels: { 
            usePointStyle: true, 
            boxWidth: 8,
            padding: 15,
            font: { size: 11, weight: '500' }
          } 
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label.split('(')[0].trim();
              return ' ' + label + ': ' + context.raw.toFixed(2) + ' acres';
            }
          }
        }
      }
    }
  });
}

function renderCropExpChart() {
  const user  = state.currentUser;
  const crops = user.crops;
  const ctx   = document.getElementById('cropExpChart');
  if (!ctx) return;
  if (!crops.length) {
    destroyChart('cropExp');
    return;
  }

  const catClrs = CATEGORIES.map(c => CAT_CLRS[c] || '#64748B');
  const labels = crops.map(c => c.name.split('(')[0].trim());

  const datasets = CATEGORIES.map((cat, i) => {
    return {
      label: cat,
      data: crops.map(c => {
        return user.expenses.filter(e => e.cropId === c.id && e.category === cat).reduce((s, e) => s + e.amount, 0);
      }),
      backgroundColor: catClrs[i],
      borderRadius: labels.length > 0 ? 4 : 0
    };
  });

  destroyChart('cropExp');
  chartInstances['cropExp'] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { 
          position: 'bottom', 
          labels: { 
            usePointStyle: true, 
            boxWidth: 8,
            padding: 15,
            font: { size: 11, weight: '500' }
          } 
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return ' ' + context.dataset.label + ': ₹' + context.raw.toLocaleString('en-IN');
            }
          }
        }
      },
      scales: {
        x: { stacked: true, grid: { display: false } },
        y: { 
          stacked: true, 
          beginAtZero: true, 
          grid: { borderDash: [4, 4] },
          ticks: {
            callback: function(value) {
              return '₹' + value.toLocaleString('en-IN');
            }
          }
        }
      }
    }
  });
}

// ===================== COMPARE =====================
function renderCompare() {
  const user      = state.currentUser;
  const crops     = user.crops;
  const expenses  = user.expenses;
  const sales     = user.sales;

  const cropYear = (c) => c.year || new Date(c.startDate).getFullYear();
  const allYears = crops.map(cropYear);
  const thisYear = allYears.length > 0 ? Math.max(...allYears) : new Date().getFullYear();
  const lastYear = thisYear - 1;

  // Helper: get profit for an array of crop ids
  const getFinancials = (cropIds) => {
    const exp = expenses.filter(e => cropIds.includes(e.cropId)).reduce((s, e) => s + e.amount, 0);
    const rev = sales.filter(s => cropIds.includes(s.cropId)).reduce((s, sa) => s + sa.qty * sa.pricePerUnit, 0);
    return { exp, rev, profit: rev - exp };
  };

  // Split crops by year field
  const thisYrCrops = crops.filter(c => cropYear(c) === thisYear);
  const lastYrCrops = crops.filter(c => cropYear(c) === lastYear);

  const thisYrFin = getFinancials(thisYrCrops.map(c => c.id));
  const lastYrFin = getFinancials(lastYrCrops.map(c => c.id));
  const delta     = thisYrFin.profit - lastYrFin.profit;
  const deltaSign = delta >= 0;

  // ---- Overall Summary Cards ----
  const tyEl  = document.getElementById('thisYearProfit');
  const lyEl  = document.getElementById('lastYearProfit');
  const dvEl  = document.getElementById('yearDeltaValue');
  const dsEl  = document.getElementById('yearDeltaSub');
  const dcEl  = document.getElementById('yearDeltaCard');

  if (tyEl) {
    tyEl.textContent = (thisYrFin.profit >= 0 ? '₹' : '-₹') + fmtNum(Math.abs(thisYrFin.profit));
    tyEl.className   = 'summary-card-value ' + (thisYrFin.profit >= 0 ? '' : 'profit-neg');
  }
  if (lyEl) {
    lyEl.textContent = (lastYrFin.profit >= 0 ? '₹' : '-₹') + fmtNum(Math.abs(lastYrFin.profit));
    lyEl.className   = 'summary-card-value ' + (lastYrFin.profit >= 0 ? '' : 'profit-neg');
  }
  if (dvEl) {
    dvEl.textContent = (deltaSign ? '+₹' : '-₹') + fmtNum(Math.abs(delta));
    dvEl.className   = 'summary-card-value ' + (deltaSign ? 'profit-pos' : 'profit-neg');
  }
  if (dsEl) dsEl.textContent = deltaSign ? '▲ Better than last year' : '▼ Lower than last year';
  if (dcEl) dcEl.className   = 'summary-card ' + (deltaSign ? 'profit' : 'loss');

  // ---- Overall bar chart ----
  renderYearOverallChart(thisYrFin, lastYrFin);

  // ---- Per-crop table ----
  // Find crop names that appear in both years
  const thisYrNames = [...new Set(thisYrCrops.map(c => c.name))];
  const lastYrNames = [...new Set(lastYrCrops.map(c => c.name))];
  const allNames    = [...new Set([...thisYrNames, ...lastYrNames])];

  const tbody = document.getElementById('compareTableBody');
  tbody.innerHTML = allNames.map(name => {
    const tyCrop = thisYrCrops.find(c => c.name === name);
    const lyCrop = lastYrCrops.find(c => c.name === name);

    const tyFin = tyCrop ? getFinancials([tyCrop.id]) : { exp: 0, rev: 0, profit: 0 };
    const lyFin = lyCrop ? getFinancials([lyCrop.id]) : { exp: 0, rev: 0, profit: 0 };
    const d     = tyFin.profit - lyFin.profit;
    const dSign = d >= 0;

    const sharedBoth = tyCrop && lyCrop;
    const badge = sharedBoth
      ? ''
      : `<span class="delta ${tyCrop ? 'delta-pos' : 'delta-neg'}" style="margin-left:6px;font-size:10px;">${tyCrop ? 'New' : 'Last Yr'}</span>`;

    const tyProfitAcre = tyCrop && tyCrop.land > 0 ? tyFin.profit / tyCrop.land : 0;
    const lyProfitAcre = lyCrop && lyCrop.land > 0 ? lyFin.profit / lyCrop.land : 0;
    
    // Formatting helper
    const fmtCurrency = (val) => (val >= 0 ? '+' : '') + '₹' + fmtNum(val);

    return `<tr>
      <td><strong>${name}</strong>${badge}<div style="font-size:10px;color:var(--clay);margin-top:2px;">${tyCrop ? tyCrop.land + 'ac' : '0ac'} vs ${lyCrop ? lyCrop.land + 'ac' : '0ac'}</div></td>
      <td class="${tyFin.profit >= 0 ? 'profit-pos' : 'profit-neg'}">
        <div>${tyCrop ? fmtCurrency(tyFin.profit) : '—'}</div>
        <div style="font-size:10px; opacity:0.7; font-weight:normal;">${tyCrop ? fmtCurrency(Math.round(tyProfitAcre)) + '/ac' : ''}</div>
      </td>
      <td class="${lyFin.profit >= 0 ? 'profit-pos' : 'profit-neg'}">
        <div>${lyCrop ? fmtCurrency(lyFin.profit) : '—'}</div>
        <div style="font-size:10px; opacity:0.7; font-weight:normal;">${lyCrop ? fmtCurrency(Math.round(lyProfitAcre)) + '/ac' : ''}</div>
      </td>
      <td>
        <span class="delta ${dSign ? 'delta-pos' : 'delta-neg'}">${sharedBoth ? (dSign ? '▲ ' : '▼ ') + '₹' + fmtNum(Math.abs(d)) : '—'}</span>
      </td>
      <td>${tyCrop ? '₹' + fmtNum(tyFin.rev) : '—'}</td>
      <td>${lyCrop ? '₹' + fmtNum(lyFin.rev) : '—'}</td>
      <td>${tyCrop ? tyCrop.land + ' ac' : '—'}</td>
    </tr>`;
  }).join('');
}

function renderYearOverallChart(tyFin, lyFin) {
  const ctx = document.getElementById('yearOverallChart');
  if (!ctx) return;

  destroyChart('yearOverall');
  chartInstances['yearOverall'] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Revenue', 'Expenses', 'Profit'],
      datasets: [
        {
          label: 'This Year (₹)',
          data: [tyFin.rev, tyFin.exp, Math.max(0, tyFin.profit)],
          backgroundColor: 'rgba(13, 148, 136, 0.9)',
          borderRadius: 4
        },
        {
          label: 'Last Year (₹)',
          data: [lyFin.rev, lyFin.exp, Math.max(0, lyFin.profit)],
          backgroundColor: 'rgba(217, 119, 6, 0.85)',
          borderRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top', labels: { usePointStyle: true, boxWidth: 8 } }
      },
      scales: {
        y: { beginAtZero: true, grid: { borderDash: [4, 4] } },
        x: { grid: { display: false } }
      }
    }
  });
}

function lastYearProfitVal(tyFin, lyFin) {
  return lyFin.profit;
}
