import type { CustomerPortalProfile, PortalPayment } from '@/types/portal'

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function methodLabel(method: string): string {
  if (method === 'account_credit') return 'Account credit'
  return method.replace(/_/g, ' ')
}

function paymentRows(payments: PortalPayment[]): string {
  if (payments.length === 0) {
    return `
      <tr>
        <td colspan="6" class="empty">No payments recorded for this account.</td>
      </tr>
    `
  }

  return payments
    .map((payment, index) => {
      const n = String(index + 1).padStart(2, '0')
      return `
        <tr>
          <td class="num">${n}</td>
          <td>
            <div class="primary">${escapeHtml(payment.paid_label || '—')}</div>
            <div class="mono muted">${escapeHtml(payment.reference_number)}</div>
          </td>
          <td>
            <div class="primary">${escapeHtml(payment.bill_title || 'Bill payment')}</div>
            <div class="mono muted">${escapeHtml(payment.bill_number)}</div>
          </td>
          <td class="cap">${escapeHtml(methodLabel(payment.payment_method))}</td>
          <td class="right amount">${escapeHtml(payment.amount_label)}</td>
          <td class="right">${escapeHtml(payment.balance_after_label || '₱0.00')}</td>
        </tr>
      `
    })
    .join('')
}

function pendingRows(profile: CustomerPortalProfile): string {
  if (profile.pending_bills.length === 0) {
    return `
      <tr>
        <td colspan="4" class="empty">No outstanding bills.</td>
      </tr>
    `
  }

  return profile.pending_bills
    .map((bill) => {
      const status = bill.is_overdue
        ? 'Overdue'
        : bill.status === 'partial'
          ? 'Partial'
          : bill.status
      return `
        <tr>
          <td>
            <div class="primary">${escapeHtml(bill.title)}</div>
            <div class="mono muted">${escapeHtml(bill.bill_number)}</div>
          </td>
          <td>${escapeHtml(bill.due_on_label || '—')}</td>
          <td class="cap">${escapeHtml(status)}</td>
          <td class="right amount">${escapeHtml(bill.balance_label)}</td>
        </tr>
      `
    })
    .join('')
}

export function buildSoaHtml(
  profile: CustomerPortalProfile,
  logoSrc: string,
): string {
  const merchantName = profile.merchant.name || 'Merchant'
  const generatedAt = new Date().toLocaleString('en-PH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
  const payments = profile.history
  const docTitle = `Statement of Account — ${merchantName}`
  const safeLogoSrc = escapeHtml(logoSrc)

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(docTitle)}</title>
  <style>
    :root {
      --purple: #4B1D6E;
      --purple-soft: #f4eef8;
      --gold: #C9A227;
      --ink: #1a1224;
      --muted: #6b6280;
      --line: #e8e0f0;
      --ok: #047857;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      color: var(--ink);
      background: #f7f4fb;
      font-family: "Segoe UI", "DM Sans", system-ui, sans-serif;
      font-size: 12.5px;
      line-height: 1.45;
    }
    .sheet {
      max-width: 860px;
      margin: 24px auto;
      background: #fff;
      border: 1px solid var(--line);
      box-shadow: 0 18px 48px -28px rgb(75 29 110 / 0.45);
      overflow: hidden;
    }
    .brand-bar {
      height: 6px;
      background: linear-gradient(90deg, var(--purple), #6b3a8f 55%, var(--gold));
    }
    .header {
      display: flex;
      justify-content: space-between;
      gap: 24px;
      padding: 28px 32px 20px;
      border-bottom: 1px solid var(--line);
    }
    .brand-logo {
      display: block;
      height: 52px;
      width: auto;
      max-width: 200px;
      object-fit: contain;
    }
    .doc-meta { text-align: right; }
    .doc-meta .eyebrow {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--gold);
    }
    .doc-meta h1 {
      margin: 6px 0 0;
      font-size: 22px;
      line-height: 1.2;
      color: var(--purple);
    }
    .doc-meta .gen {
      margin-top: 8px;
      color: var(--muted);
      font-size: 11px;
    }
    .parties {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      padding: 20px 32px;
      background: var(--purple-soft);
    }
    .party {
      background: #fff;
      border: 1px solid var(--line);
      border-radius: 12px;
      padding: 14px 16px;
    }
    .party .label {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--muted);
    }
    .party .name {
      margin-top: 6px;
      font-size: 16px;
      font-weight: 700;
      color: var(--purple);
    }
    .party .detail {
      margin-top: 4px;
      color: var(--muted);
    }
    .party .mono {
      font-family: ui-monospace, Consolas, monospace;
      font-size: 11px;
      font-weight: 600;
      color: var(--ink);
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      padding: 18px 32px 8px;
    }
    .stat {
      border: 1px solid var(--line);
      border-radius: 12px;
      padding: 12px 14px;
    }
    .stat.accent {
      background: var(--purple);
      border-color: var(--purple);
      color: #fff;
    }
    .stat .label {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      opacity: 0.75;
    }
    .stat.accent .label { color: #f3e6b0; opacity: 1; }
    .stat .value {
      margin-top: 4px;
      font-size: 20px;
      font-weight: 800;
    }
    .section { padding: 18px 32px 8px; }
    .section h2 {
      margin: 0 0 10px;
      font-size: 13px;
      font-weight: 800;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--purple);
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    thead th {
      text-align: left;
      padding: 10px 8px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--muted);
      border-bottom: 2px solid var(--purple);
      background: #faf8fc;
    }
    tbody td {
      padding: 10px 8px;
      border-bottom: 1px solid var(--line);
      vertical-align: top;
    }
    tbody tr:last-child td { border-bottom: none; }
    .primary { font-weight: 600; }
    .muted { color: var(--muted); font-size: 11px; margin-top: 2px; }
    .mono { font-family: ui-monospace, Consolas, monospace; }
    .cap { text-transform: capitalize; }
    .right { text-align: right; }
    .num { width: 36px; color: var(--muted); font-weight: 600; }
    .amount { font-weight: 700; color: var(--ok); white-space: nowrap; }
    .empty {
      text-align: center;
      color: var(--muted);
      padding: 28px 8px !important;
    }
    .footer {
      margin-top: 8px;
      padding: 18px 32px 28px;
      border-top: 1px solid var(--line);
      display: flex;
      justify-content: space-between;
      gap: 16px;
      color: var(--muted);
      font-size: 11px;
    }
    .footer strong { color: var(--ink); }
    .actions {
      position: sticky;
      top: 0;
      z-index: 5;
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      padding: 12px 16px;
      background: rgb(247 244 251 / 0.92);
      backdrop-filter: blur(8px);
      border-bottom: 1px solid var(--line);
    }
    .actions button {
      appearance: none;
      border: none;
      border-radius: 10px;
      padding: 10px 16px;
      font-weight: 700;
      font-size: 13px;
      cursor: pointer;
    }
    .actions .print {
      background: var(--purple);
      color: #fff;
    }
    .actions .close {
      background: #fff;
      color: var(--purple);
      border: 1px solid var(--line);
    }
    @media print {
      body { background: #fff; }
      .actions { display: none !important; }
      .sheet {
        margin: 0;
        border: none;
        box-shadow: none;
        max-width: none;
      }
    }
    @page { margin: 12mm; }
  </style>
</head>
<body>
  <div class="actions">
    <button type="button" class="close" onclick="window.close()">Close</button>
    <button type="button" class="print" onclick="window.print()">Print / Save as PDF</button>
  </div>
  <div class="sheet">
    <div class="brand-bar"></div>
    <header class="header">
      <div>
        <img
          class="brand-logo"
          src="${safeLogoSrc}"
          alt="iLpay"
        />
      </div>
      <div class="doc-meta">
        <div class="eyebrow">Official document</div>
        <h1>Statement of Account</h1>
        <div class="gen">Generated ${escapeHtml(generatedAt)}</div>
      </div>
    </header>

    <section class="parties">
      <div class="party">
        <div class="label">Merchant</div>
        <div class="name">${escapeHtml(merchantName)}</div>
        ${
          profile.merchant.code
            ? `<div class="detail mono">${escapeHtml(profile.merchant.code)}</div>`
            : ''
        }
        ${
          profile.merchant.email || profile.merchant.phone
            ? `<div class="detail">${escapeHtml(
                [profile.merchant.email, profile.merchant.phone]
                  .filter(Boolean)
                  .join(' · '),
              )}</div>`
            : ''
        }
      </div>
      <div class="party">
        <div class="label">Account holder</div>
        <div class="name">${escapeHtml(profile.customer.full_name)}</div>
        <div class="detail mono">${escapeHtml(profile.customer.account_number)}</div>
        ${
          profile.customer.email || profile.customer.phone
            ? `<div class="detail">${escapeHtml(
                [profile.customer.email, profile.customer.phone]
                  .filter(Boolean)
                  .join(' · '),
              )}</div>`
            : ''
        }
        ${
          profile.customer.address
            ? `<div class="detail">${escapeHtml(profile.customer.address)}</div>`
            : ''
        }
      </div>
    </section>

    <section class="summary">
      <div class="stat accent">
        <div class="label">Outstanding balance</div>
        <div class="value">${escapeHtml(profile.summary.pending_total_label)}</div>
      </div>
      <div class="stat">
        <div class="label">Total paid</div>
        <div class="value">${escapeHtml(profile.summary.paid_total_label)}</div>
      </div>
      <div class="stat">
        <div class="label">Payments listed</div>
        <div class="value">${payments.length}</div>
      </div>
    </section>

    <section class="section">
      <h2>Payment history</h2>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Paid on</th>
            <th>Bill</th>
            <th>Method</th>
            <th class="right">Amount</th>
            <th class="right">Balance after</th>
          </tr>
        </thead>
        <tbody>
          ${paymentRows(payments)}
        </tbody>
      </table>
    </section>

    <section class="section">
      <h2>Outstanding bills</h2>
      <table>
        <thead>
          <tr>
            <th>Bill</th>
            <th>Due on</th>
            <th>Status</th>
            <th class="right">Balance</th>
          </tr>
        </thead>
        <tbody>
          ${pendingRows(profile)}
        </tbody>
      </table>
    </section>

    <footer class="footer">
      <div>
        This statement of account is issued for
        <strong>${escapeHtml(merchantName)}</strong>
        via iLpay. For billing questions, contact the merchant listed above.
      </div>
      <div style="text-align:right;white-space:nowrap">
        Account credit:
        <strong>${escapeHtml(profile.customer.credit_balance_label)}</strong>
      </div>
    </footer>
  </div>
</body>
</html>`
}

async function resolveLogoSrc(): Promise<string> {
  const fallback = `${window.location.origin}/lpay-logo.png`
  try {
    const response = await fetch('/lpay-logo.png')
    if (!response.ok) return fallback
    const blob = await response.blob()
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(blob)
    })
  } catch {
    return fallback
  }
}

function soaFilename(profile: CustomerPortalProfile, extension: string): string {
  const merchantSlug = (profile.merchant.name || 'merchant')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  const account = profile.customer.account_number.replace(/[^a-zA-Z0-9_-]/g, '')
  return `SOA-${merchantSlug}-${account || 'account'}.${extension}`
}

function waitForImages(root: ParentNode): Promise<void> {
  const images = Array.from(root.querySelectorAll('img'))
  if (images.length === 0) return Promise.resolve()
  return Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) {
            resolve()
            return
          }
          img.onload = () => resolve()
          img.onerror = () => resolve()
        }),
    ),
  ).then(() => undefined)
}

async function renderSoaSheet(
  profile: CustomerPortalProfile,
): Promise<{ host: HTMLDivElement; sheet: HTMLElement }> {
  const logoSrc = await resolveLogoSrc()
  const html = buildSoaHtml(profile, logoSrc)
  const parsed = new DOMParser().parseFromString(html, 'text/html')
  const style = parsed.querySelector('style')
  const sheetNode = parsed.querySelector('.sheet')

  if (!sheetNode) {
    throw new Error('SOA layout missing.')
  }

  const host = document.createElement('div')
  host.setAttribute('aria-hidden', 'true')
  host.style.cssText =
    'position:fixed;left:-12000px;top:0;width:860px;background:#ffffff;opacity:0;pointer-events:none;z-index:-1;'

  if (style) {
    host.appendChild(document.importNode(style, true))
  }

  const sheet = document.importNode(sheetNode, true) as HTMLElement
  // Print layout: no page chrome / sticky buttons
  const sheetWrap = document.createElement('div')
  sheetWrap.style.cssText = 'width:860px;background:#ffffff;'
  sheetWrap.appendChild(sheet)
  host.appendChild(sheetWrap)
  document.body.appendChild(host)

  await waitForImages(host)
  await new Promise((resolve) => window.setTimeout(resolve, 80))

  return { host, sheet }
}

export async function openSoaDocument(
  profile: CustomerPortalProfile,
): Promise<void> {
  const logoSrc = await resolveLogoSrc()
  const html = buildSoaHtml(profile, logoSrc)
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const win = window.open(url, '_blank', 'noopener,noreferrer')
  if (!win) {
    await downloadSoaFile(profile)
  }
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

export async function downloadSoaFile(
  profile: CustomerPortalProfile,
): Promise<void> {
  const { jsPDF } = await import('jspdf')
  const html2canvas = (await import('html2canvas')).default

  const { host, sheet } = await renderSoaSheet(profile)

  try {
    const canvas = await html2canvas(sheet, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: 860,
    })

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 8
    const usableWidth = pageWidth - margin * 2
    const usableHeight = pageHeight - margin * 2
    const imgWidth = usableWidth
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    let remaining = imgHeight
    let offsetY = 0
    let page = 0

    while (remaining > 0) {
      if (page > 0) pdf.addPage()

      const sourceY = (offsetY * canvas.height) / imgHeight
      const sourceHeight = Math.min(
        (usableHeight * canvas.height) / imgHeight,
        canvas.height - sourceY,
      )
      const sliceHeight = (sourceHeight * imgWidth) / canvas.width

      const pageCanvas = document.createElement('canvas')
      pageCanvas.width = canvas.width
      pageCanvas.height = Math.max(1, Math.ceil(sourceHeight))
      const ctx = pageCanvas.getContext('2d')
      if (!ctx) throw new Error('Unable to render PDF page.')
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height)
      ctx.drawImage(
        canvas,
        0,
        sourceY,
        canvas.width,
        sourceHeight,
        0,
        0,
        canvas.width,
        sourceHeight,
      )

      pdf.addImage(
        pageCanvas.toDataURL('image/png'),
        'PNG',
        margin,
        margin,
        imgWidth,
        sliceHeight,
      )

      remaining -= usableHeight
      offsetY += usableHeight
      page += 1
      if (page > 30) break
    }

    pdf.save(soaFilename(profile, 'pdf'))
  } finally {
    host.remove()
  }
}
