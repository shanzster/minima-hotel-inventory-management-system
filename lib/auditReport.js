/**
 * Audit Report Utility
 * Handles generation of printable Audit Worksheets
 */

export const printAuditWorksheet = (auditScope, items) => {
  const printWindow = window.open('', '_blank')
  const now = new Date()
  const dateStr = now.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const categories = auditScope.categories?.join(', ') || 'All'
  const locations = auditScope.locations?.join(', ') || 'All'

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Audit Worksheet - ${dateStr}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          
          @media print {
            @page { margin: 0.5in; size: A4; }
            body { -webkit-print-color-adjust: exact; }
          }
          
          body {
            font-family: 'Inter', sans-serif;
            font-size: 10pt;
            color: #333;
            margin: 0;
            padding: 20px;
          }
          
          .header {
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          
          .title {
            font-size: 22pt;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          
          .meta-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 30px;
            background: #f9f9f9;
            padding: 15px;
            border: 1px solid #ddd;
          }
          
          .meta-item {
            margin-bottom: 5px;
          }
          
          .label {
            font-weight: 600;
            font-size: 9pt;
            color: #666;
            text-transform: uppercase;
          }
          
          .value {
            font-size: 11pt;
            margin-top: 2px;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 40px;
          }
          
          th {
            background: #000;
            color: #fff;
            text-align: left;
            padding: 10px 8px;
            font-size: 9pt;
            text-transform: uppercase;
          }
          
          td {
            border-bottom: 1px solid #ddd;
            padding: 10px 8px;
            vertical-align: top;
          }
          
          .col-sku { width: 15%; }
          .col-name { width: 30%; }
          .col-loc { width: 15%; }
          .col-stock { width: 10%; text-align: center; }
          .col-count { width: 10%; border: 1px solid #000; }
          .col-remarks { width: 20%; }
          
          .instructions {
            margin-bottom: 20px;
            font-style: italic;
            font-size: 9pt;
            color: #555;
          }
          
          .footer {
            margin-top: 50px;
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 40px;
          }
          
          .signature-line {
            border-top: 1px solid #000;
            margin-top: 40px;
            text-align: center;
            font-size: 9pt;
            padding-top: 5px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">Audit Worksheet</div>
            <div style="font-size: 10pt; margin-top: 5px;">Minima Hotel Inventory Management System</div>
          </div>
          <div style="text-align: right;">
            <div class="label">Date Generated</div>
            <div class="value">${dateStr}</div>
          </div>
        </div>
        
        <div class="meta-grid">
          <div class="meta-item">
            <div class="label">Auditor Name</div>
            <div class="value" style="border-bottom: 1px dotted #000; height: 20px; width: 80%;"></div>
          </div>
          <div class="meta-item">
            <div class="label">Audit Type</div>
            <div class="value">${auditScope.auditType?.toUpperCase() || 'SCHEDULED'}</div>
          </div>
          <div class="meta-item">
            <div class="label">Categories</div>
            <div class="value">${categories}</div>
          </div>
          <div class="meta-item">
            <div class="label">Locations</div>
            <div class="value">${locations}</div>
          </div>
        </div>
        
        <div class="instructions">
          Instructions: Record the physical count found in the designated box. Note any damages or discrepancies in the remarks column.
        </div>
        
        <table>
          <thead>
            <tr>
              <th class="col-sku">SKU/ID</th>
              <th class="col-name">Item Name</th>
              <th class="col-loc">Location</th>
              <th class="col-stock">Expected</th>
              <th class="col-count">Actual Count</th>
              <th class="col-remarks">Remarks/Condition</th>
            </tr>
          </thead>
          <tbody>
            ${items.length > 0 ? items.map(item => `
              <tr>
                <td>${item.sku || item.itemId?.substring(0, 8) || item.id?.substring(0, 8) || '-'}</td>
                <td>
                  <strong>${item.itemName || item.name}</strong>
                  <div style="font-size: 8pt; color: #666; margin-top: 2px;">${item.category}</div>
                </td>
                <td>${item.location || '-'}</td>
                <td style="text-align: center;">${item.expectedStock !== undefined ? item.expectedStock : (item.currentStock || 0)} ${item.unit || 'pcs'}</td>
                <td></td>
                <td></td>
              </tr>
            `).join('') : ''}
            
            <!-- Additional Blank Rows for Manual Entry -->
            ${Array(10).fill(0).map(() => `
              <tr>
                <td style="height: 35px;"></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div style="margin-top: 30px;">
          <div class="label">General Observations & Notes</div>
          <div style="border: 1px solid #ddd; height: 150px; margin-top: 10px; background: #fff;"></div>
        </div>
        
        <div class="footer">
          <div>
            <div class="signature-line">Performed By (Signature)</div>
          </div>
          <div>
            <div class="signature-line">Verified By (Signature)</div>
          </div>
          <div>
            <div class="signature-line">Date Completed</div>
          </div>
        </div>
        
        <script>
          window.onafterprint = function() { window.close(); };
          if (document.readyState === 'complete') {
            window.print();
          } else {
            window.addEventListener('load', () => window.print());
          }
        </script>
      </body>
    </html>
  `

  printWindow.document.write(html)
  printWindow.document.close()
}
