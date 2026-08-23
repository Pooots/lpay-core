import type { CustomerPortalProfile, PortalPayment } from '@/types/portal'

type ReceiptContext = {
  merchant: CustomerPortalProfile['merchant']
  customer: CustomerPortalProfile['customer']
}

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

function receiptFilename(payment: PortalPayment, merchantName: string): string {
  const merchantSlug = (merchantName || 'merchant')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  const ref = payment.reference_number.replace(/[^a-zA-Z0-9_-]/g, '')
  return `E-Receipt-${merchantSlug}-${ref || payment.uuid}.pdf`
}

export function buildEReceiptHtml(
  payment: PortalPayment,
  context: ReceiptContext,
  logoSrc: string,
): string {
  const merchantName = context.merchant.name || 'Merchant'
  const generatedAt = new Date().toLocaleString('en-PH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
  const status = payment.status || 'completed'
  const notes: string[] = []
  if (payment.balance_after !== null && payment.balance_after > 0) {
    notes.push(
      `Partial payment. Remaining bill balance: ${payment.balance_after_label || '₱0.00'}.`,
    )
  }
  if (payment.credit_added > 0) {
    notes.push(
      `Excess ${payment.credit_added_label} saved as account credit for the next bill.`,
    )
  }
  if (payment.payment_method === 'account_credit') {
    notes.push('Applied from account credit to this bill.')
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>E-Receipt — ${escapeHtml(merchantName)}</title>
  <style>
    :root {
      --purple: #4B1D6E;
      --purple-soft: #f4eef8;
      --gold: #C9A227;
      --ink: #1a1224;
      --muted: #6b6280;
      --line: #e8e0f0;
      --ok: #047857;
      --ok-bg: #ecfdf5;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      color: var(--ink);
      background: #f7f4fb;
      font-family: "Segoe UI", "DM Sans", system-ui, sans-serif;
      font-size: 11px;
      line-height: 1.35;
    }
    .sheet {
      max-width: 560px;
      margin: 12px auto;
      background: #fff;
      border: 1px solid var(--line);
      box-shadow: 0 12px 32px -24px rgb(75 29 110 / 0.4);
      overflow: hidden;
    }
    .brand-bar {
      height: 4px;
      background: linear-gradient(90deg, var(--purple), #6b3a8f 55%, var(--gold));
    }
    .header {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: center;
      padding: 12px 16px 10px;
      border-bottom: 1px solid var(--line);
    }
    .brand-logo {
      display: block;
      height: 34px;
      width: auto;
      max-width: 140px;
      object-fit: contain;
    }
    .doc-meta { text-align: right; }
    .doc-meta .eyebrow {
      font-size: 8px;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--gold);
    }
    .doc-meta h1 {
      margin: 2px 0 0;
      font-size: 16px;
      color: var(--purple);
    }
    .doc-meta .gen {
      margin-top: 2px;
      color: var(--muted);
      font-size: 9px;
    }
    .merchant-banner {
      margin: 0;
      padding: 10px 16px;
      background: linear-gradient(135deg, var(--purple), #6b3a8f);
      color: #fff;
    }
    .merchant-banner .label {
      font-size: 8px;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: #f3e6b0;
    }
    .merchant-banner .name {
      margin-top: 2px;
      font-size: 16px;
      font-weight: 800;
      letter-spacing: -0.02em;
    }
    .merchant-banner .contact {
      margin-top: 2px;
      font-size: 10px;
      color: rgb(255 255 255 / 0.85);
    }
    .amount-block {
      text-align: center;
      padding: 10px 16px 6px;
    }
    .amount-block .label {
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--muted);
    }
    .amount-block .amount {
      margin-top: 2px;
      font-size: 24px;
      font-weight: 800;
      color: var(--ok);
      letter-spacing: -0.03em;
    }
    .status-pill {
      display: inline-flex;
      margin-top: 4px;
      padding: 2px 8px;
      border-radius: 999px;
      background: var(--ok-bg);
      color: var(--ok);
      font-size: 10px;
      font-weight: 700;
      text-transform: capitalize;
    }
    .section { padding: 8px 16px; }
    .section h2 {
      margin: 0 0 6px;
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--purple);
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
    }
    .field {
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 7px 9px;
      background: #faf8fc;
    }
    .field.wide { grid-column: 1 / -1; }
    .field .k {
      font-size: 8px;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--muted);
    }
    .field .v {
      margin-top: 2px;
      font-size: 11px;
      font-weight: 600;
      color: var(--ink);
      word-break: break-word;
    }
    .field .v.mono {
      font-family: ui-monospace, Consolas, monospace;
      font-size: 10px;
    }
    .field .v.cap { text-transform: capitalize; }
    .breakdown {
      border: 1px solid var(--line);
      border-radius: 8px;
      overflow: hidden;
    }
    .breakdown .row {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      padding: 7px 10px;
      border-bottom: 1px solid var(--line);
      font-size: 11px;
    }
    .breakdown .row:last-child { border-bottom: none; }
    .breakdown .row.total {
      background: var(--purple-soft);
      font-weight: 800;
      color: var(--purple);
    }
    .note {
      margin-top: 6px;
      border-radius: 8px;
      border: 1px solid #fde68a;
      background: #fffbeb;
      color: #92400e;
      padding: 6px 8px;
      font-size: 10px;
    }
    .footer {
      padding: 8px 16px 12px;
      border-top: 1px solid var(--line);
      color: var(--muted);
      font-size: 9px;
    }
    .footer strong { color: var(--ink); }
    .actions {
      position: sticky;
      top: 0;
      z-index: 5;
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      padding: 10px 14px;
      background: rgb(247 244 251 / 0.92);
      border-bottom: 1px solid var(--line);
    }
    .actions button {
      appearance: none;
      border: none;
      border-radius: 8px;
      padding: 8px 12px;
      font-weight: 700;
      font-size: 12px;
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
      .sheet { margin: 0; border: none; box-shadow: none; max-width: none; }
    }
    @page { margin: 8mm; size: A4; }
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
      <img class="brand-logo" src="${escapeHtml(logoSrc)}" alt="iLpay" />
      <div class="doc-meta">
        <div class="eyebrow">Official receipt</div>
        <h1>E-Receipt</h1>
        <div class="gen">Issued ${escapeHtml(generatedAt)}</div>
      </div>
    </header>

    <section class="merchant-banner">
      <div class="label">Merchant</div>
      <div class="name">${escapeHtml(merchantName)}</div>
      ${
        context.merchant.code
          ? `<div class="contact mono">${escapeHtml(context.merchant.code)}</div>`
          : ''
      }
      ${
        context.merchant.email || context.merchant.phone
          ? `<div class="contact">${escapeHtml(
              [context.merchant.email, context.merchant.phone]
                .filter(Boolean)
                .join(' · '),
            )}</div>`
          : ''
      }
    </section>

    <div class="amount-block">
      <div class="label">Amount paid</div>
      <div class="amount">${escapeHtml(payment.amount_label)}</div>
      <div class="status-pill">${escapeHtml(status)}</div>
    </div>

    <section class="section">
      <h2>Payment details</h2>
      <div class="grid">
        <div class="field wide">
          <div class="k">Reference number</div>
          <div class="v mono">${escapeHtml(payment.reference_number)}</div>
        </div>
        <div class="field">
          <div class="k">Paid on</div>
          <div class="v">${escapeHtml(payment.paid_label || '—')}</div>
        </div>
        <div class="field">
          <div class="k">Method</div>
          <div class="v cap">${escapeHtml(methodLabel(payment.payment_method))}</div>
        </div>
        <div class="field wide">
          <div class="k">Bill</div>
          <div class="v">${escapeHtml(payment.bill_title || 'Bill payment')}</div>
          <div class="v mono" style="margin-top:4px;color:var(--muted);font-weight:500">
            ${escapeHtml(payment.bill_number)}
          </div>
        </div>
      </div>
    </section>

    <section class="section">
      <h2>Account</h2>
      <div class="grid">
        <div class="field">
          <div class="k">Account holder</div>
          <div class="v">${escapeHtml(context.customer.full_name)}</div>
        </div>
        <div class="field">
          <div class="k">Account number</div>
          <div class="v mono">${escapeHtml(context.customer.account_number)}</div>
        </div>
      </div>
    </section>

    <section class="section">
      <h2>Allocation</h2>
      <div class="breakdown">
        <div class="row">
          <span>Applied to bill</span>
          <span>${escapeHtml(payment.applied_to_bill_label)}</span>
        </div>
        <div class="row">
          <span>Still to pay after</span>
          <span>${escapeHtml(payment.balance_after_label || '₱0.00')}</span>
        </div>
        ${
          payment.credit_added > 0
            ? `<div class="row">
                <span>Credit added</span>
                <span>${escapeHtml(payment.credit_added_label)}</span>
              </div>`
            : ''
        }
        <div class="row total">
          <span>Total paid</span>
          <span>${escapeHtml(payment.amount_label)}</span>
        </div>
      </div>
      ${notes.map((note) => `<div class="note">${escapeHtml(note)}</div>`).join('')}
    </section>

    <footer class="footer">
      This e-receipt was issued for <strong>${escapeHtml(merchantName)}</strong>
      via iLpay. Keep this copy for your records.
    </footer>
  </div>
</body>
</html>`
}

async function renderReceiptSheet(
  payment: PortalPayment,
  context: ReceiptContext,
): Promise<{ host: HTMLDivElement; sheet: HTMLElement }> {
  const logoSrc = await resolveLogoSrc()
  const html = buildEReceiptHtml(payment, context, logoSrc)
  const parsed = new DOMParser().parseFromString(html, 'text/html')
  const style = parsed.querySelector('style')
  const sheetNode = parsed.querySelector('.sheet')
  if (!sheetNode) throw new Error('E-receipt layout missing.')

  const host = document.createElement('div')
  host.setAttribute('aria-hidden', 'true')
  host.style.cssText =
    'position:fixed;left:-12000px;top:0;width:560px;background:#ffffff;opacity:0;pointer-events:none;z-index:-1;'
  if (style) host.appendChild(document.importNode(style, true))
  const sheet = document.importNode(sheetNode, true) as HTMLElement
  const wrap = document.createElement('div')
  wrap.style.cssText = 'width:560px;background:#ffffff;'
  wrap.appendChild(sheet)
  host.appendChild(wrap)
  document.body.appendChild(host)

  await waitForImages(host)
  await new Promise((resolve) => window.setTimeout(resolve, 80))
  return { host, sheet }
}

export async function openEReceipt(
  payment: PortalPayment,
  context: ReceiptContext,
): Promise<void> {
  const logoSrc = await resolveLogoSrc()
  const html = buildEReceiptHtml(payment, context, logoSrc)
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const win = window.open(url, '_blank', 'noopener,noreferrer')
  if (!win) {
    await downloadEReceiptPdf(payment, context)
  }
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

export async function downloadEReceiptPdf(
  payment: PortalPayment,
  context: ReceiptContext,
): Promise<void> {
  const { jsPDF } = await import('jspdf')
  const html2canvas = (await import('html2canvas')).default
  const { host, sheet } = await renderReceiptSheet(payment, context)

  try {
    const canvas = await html2canvas(sheet, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: 560,
    })

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 10
    const maxWidth = pageWidth - margin * 2
    const maxHeight = pageHeight - margin * 2

    // Fit entire receipt on a single A4 page
    let imgWidth = maxWidth
    let imgHeight = (canvas.height * imgWidth) / canvas.width
    if (imgHeight > maxHeight) {
      imgHeight = maxHeight
      imgWidth = (canvas.width * imgHeight) / canvas.height
    }

    const x = margin + (maxWidth - imgWidth) / 2
    const y = margin

    pdf.addImage(
      canvas.toDataURL('image/png'),
      'PNG',
      x,
      y,
      imgWidth,
      imgHeight,
    )
    pdf.save(receiptFilename(payment, context.merchant.name))
  } finally {
    host.remove()
  }
}
