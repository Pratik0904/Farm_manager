const { jsPDF } = window.jspdf;

function exportReport() {
  const user = state.currentUser;
  if (!user) {
    showToast('You must be logged in to export reports.', 'error');
    return;
  }

  const doc = new jsPDF();
  const primaryColor = [15, 118, 110]; // #0f766e
  const darkTextColor = [30, 41, 59];
  
  // Header section
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('FARMLEDGER FINANCIAL REPORT', 15, 18);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, 15, 26);
  doc.text(`Farmer: ${user.name || 'N/A'} | Location: ${user.location || 'N/A'}`, 15, 32);

  let currentY = 50;

  // Calculate totals
  const totalCrops = user.crops?.length || 0;
  const totalExpenses = (user.expenses || []).reduce((s, e) => s + e.amount, 0);
  const totalSales = (user.sales || []).reduce((s, sa) => s + sa.qty * sa.pricePerUnit, 0);
  const netProfit = totalSales - totalExpenses;

  const fmtInr = (num) => '₹' + Number(num || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });

  // Summary Cards section
  doc.setTextColor(...darkTextColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Farm Financial Summary', 15, currentY);
  currentY += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Total Crops Planted: ${totalCrops}`, 15, currentY);
  doc.text(`Total Expenses: ${fmtInr(totalExpenses)}`, 15, currentY + 6);
  doc.text(`Total Revenue: ${fmtInr(totalSales)}`, 15, currentY + 12);
  
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(netProfit >= 0 ? 15 : 192, netProfit >= 0 ? 118 : 68, netProfit >= 0 ? 110 : 26); // green vs red
  doc.text(`Net Profit / Loss: ${fmtInr(netProfit)}`, 15, currentY + 18);

  currentY += 28;

  // Expenses Table
  doc.setTextColor(...darkTextColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Expense Breakdown', 15, currentY);
  currentY += 6;

  const expenseRows = (user.expenses || []).map(e => {
    const crop = (user.crops || []).find(c => c.id === e.cropId);
    return [
      crop ? crop.name : 'Unknown',
      e.category,
      new Date(e.date).toLocaleDateString('en-IN'),
      fmtInr(e.amount),
      e.notes || '—'
    ];
  });

  doc.autoTable({
    startY: currentY,
    head: [['Crop', 'Category', 'Date', 'Amount', 'Notes']],
    body: expenseRows.length ? expenseRows : [['No expense entries found.', '', '', '', '']],
    theme: 'grid',
    headStyles: { fillColor: primaryColor },
    margin: { left: 15, right: 15 },
    styles: { font: 'helvetica', fontSize: 9 }
  });

  currentY = doc.lastAutoTable.finalY + 15;

  // Check if we need to add a page
  if (currentY > 240) {
    doc.addPage();
    currentY = 25;
  }

  // Sales Table
  doc.setTextColor(...darkTextColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Harvest Sales & Revenue', 15, currentY);
  currentY += 6;

  const salesRows = (user.sales || []).map(sa => {
    const crop = (user.crops || []).find(c => c.id === sa.cropId);
    return [
      crop ? crop.name : 'Unknown',
      new Date(sa.date).toLocaleDateString('en-IN'),
      `${sa.qty} ${sa.unit}`,
      fmtInr(sa.pricePerUnit),
      fmtInr(sa.qty * sa.pricePerUnit)
    ];
  });

  doc.autoTable({
    startY: currentY,
    head: [['Crop', 'Date', 'Quantity', 'Price/Unit', 'Total Revenue']],
    body: salesRows.length ? salesRows : [['No sales entries found.', '', '', '', '']],
    theme: 'grid',
    headStyles: { fillColor: [203, 128, 0] }, // Gold
    margin: { left: 15, right: 15 },
    styles: { font: 'helvetica', fontSize: 9 }
  });

  // Footer / Page numbers
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Page ${i} of ${pageCount}`, 195, 287, { align: 'right' });
    doc.text('FarmLedger App — Secure Offline Farm Accounting', 15, 287);
  }

  doc.save(`FarmLedger_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  showToast('Report downloaded successfully! 📄', 'success');
}

function exportCropReport(cropId) {
  const user = state.currentUser;
  const crop = user?.crops?.find(c => c.id === cropId);
  if (!user || !crop) {
    showToast('Crop not found.', 'error');
    return;
  }

  const doc = new jsPDF();
  const primaryColor = [15, 118, 110]; // #0f766e
  const darkTextColor = [30, 41, 59];

  // Header section
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text(`${crop.name.toUpperCase()} REPORT`, 15, 18);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, 15, 26);
  doc.text(`Farmer: ${user.name || 'N/A'} | Season: ${crop.season} | Land: ${crop.land} Acres`, 15, 32);

  let currentY = 50;

  // Filter list
  const cropExpenses = (user.expenses || []).filter(e => e.cropId === cropId);
  const cropSales = (user.sales || []).filter(s => s.cropId === cropId);
  const totalExpenses = cropExpenses.reduce((s, e) => s + e.amount, 0);
  const totalSales = cropSales.reduce((s, sa) => s + sa.qty * sa.pricePerUnit, 0);
  const netProfit = totalSales - totalExpenses;

  const fmtInr = (num) => '₹' + Number(num || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });

  // Summary section
  doc.setTextColor(...darkTextColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Crop Performance Summary', 15, currentY);
  currentY += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Planted Date: ${new Date(crop.startDate).toLocaleDateString('en-IN')}`, 15, currentY);
  doc.text(`Crop Status: ${crop.status}`, 15, currentY + 6);
  doc.text(`Total Cultivation Expenses: ${fmtInr(totalExpenses)}`, 15, currentY + 12);
  doc.text(`Total Sales Revenue: ${fmtInr(totalSales)}`, 15, currentY + 18);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(netProfit >= 0 ? 15 : 192, netProfit >= 0 ? 118 : 68, netProfit >= 0 ? 110 : 26); // green vs red
  doc.text(`Crop Net Profit / Loss: ${fmtInr(netProfit)}`, 15, currentY + 24);

  currentY += 34;

  // Expenses Table
  doc.setTextColor(...darkTextColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Expense Breakdown', 15, currentY);
  currentY += 6;

  const expenseRows = cropExpenses.map(e => [
    e.category,
    new Date(e.date).toLocaleDateString('en-IN'),
    fmtInr(e.amount),
    e.notes || '—'
  ]);

  doc.autoTable({
    startY: currentY,
    head: [['Category', 'Date', 'Amount', 'Notes']],
    body: expenseRows.length ? expenseRows : [['No expense entries recorded.', '', '', '']],
    theme: 'grid',
    headStyles: { fillColor: primaryColor },
    margin: { left: 15, right: 15 },
    styles: { font: 'helvetica', fontSize: 9 }
  });

  currentY = doc.lastAutoTable.finalY + 15;

  // Check page budget
  if (currentY > 240) {
    doc.addPage();
    currentY = 25;
  }

  // Sales Table
  doc.setTextColor(...darkTextColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Harvest Sales & Revenue', 15, currentY);
  currentY += 6;

  const salesRows = cropSales.map(sa => [
    new Date(sa.date).toLocaleDateString('en-IN'),
    `${sa.qty} ${sa.unit}`,
    fmtInr(sa.pricePerUnit),
    fmtInr(sa.qty * sa.pricePerUnit)
  ]);

  doc.autoTable({
    startY: currentY,
    head: [['Date', 'Quantity', 'Price/Unit', 'Total Revenue']],
    body: salesRows.length ? salesRows : [['No sales entries recorded.', '', '', '']],
    theme: 'grid',
    headStyles: { fillColor: [203, 128, 0] }, // Gold
    margin: { left: 15, right: 15 },
    styles: { font: 'helvetica', fontSize: 9 }
  });

  // Footer / Page numbers
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Page ${i} of ${pageCount}`, 195, 287, { align: 'right' });
    doc.text(`FarmLedger App — Official ${crop.name} Cultivation Report`, 15, 287);
  }

  const cleanCropName = crop.name.split('(')[0].trim().replace(/\s+/g, '_');
  doc.save(`FarmLedger_Crop_${cleanCropName}_Report.pdf`);
  showToast(`${crop.name} report downloaded successfully! 📄`, 'success');
}
