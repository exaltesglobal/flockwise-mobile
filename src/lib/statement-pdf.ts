import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import type { GivingStatement } from '@/api/types';

import { formatMoney } from './format';

const esc = (s: string | null | undefined) => (s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const date = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

// Same layout as the web portal's printed statement (flockwise-web/src/lib/print.ts).
export function statementHtml(s: GivingStatement) {
  const m = (v: number) => esc(formatMoney(v, s.currency));
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    body{font-family:-apple-system,Roboto,sans-serif;color:#14211F;padding:32px;font-size:13px}
    h1{color:#1F6B5C;margin:0 0 4px;font-size:22px} h2{font-size:16px;margin:24px 0 8px}
    .muted{color:#5B6B68} table{width:100%;border-collapse:collapse;margin-top:12px}
    th,td{text-align:left;padding:6px 4px;border-bottom:1px solid #DDE5E3} .num{text-align:right}
    .tot td{font-weight:700;border-top:2px solid #14211F}
  </style></head><body>
    <h1>${esc(s.church.name)}</h1>
    <div class="muted">${esc(s.church.address)}${s.church.pan ? ` · PAN ${esc(s.church.pan)}` : ''}${s.church.registration80g ? ` · 80G ${esc(s.church.registration80g)}` : ''}</div>
    <h2>Statement of donations · FY ${esc(s.financialYear)}</h2>
    <p><b>${esc(s.donor.name)}</b>${s.donor.pan ? ` · PAN ${esc(s.donor.pan)}` : ''}<br><span class="muted">${esc(s.donor.address)}</span></p>
    <table><thead><tr><th>Date</th><th>Receipt</th><th>Fund</th><th>Mode</th><th>80G</th><th class="num">Amount</th></tr></thead><tbody>
    ${s.gifts.map((g) => `<tr><td>${esc(date(g.date))}</td><td>${esc(g.receiptNumber ?? '—')}</td><td>${esc(g.fundName)}</td><td>${esc(g.method ?? '')}</td><td>${g.eligible80g ? 'Yes' : 'No'}</td><td class="num">${m(g.amount)}</td></tr>`).join('')}
    <tr class="tot"><td colspan="5">Total</td><td class="num">${m(s.total)}</td></tr>
    <tr><td colspan="5">Eligible for deduction under section 80G</td><td class="num">${m(s.eligible80g)}</td></tr>
    </tbody></table>
    <p class="muted" style="margin-top:24px">This statement lists gifts received during the financial year. The official certificate is Form 10BE, issued after the church files Form 10BD. Cash gifts above ₹2,000, gifts to non-80G funds and FCRA gifts are not eligible.</p>
  </body></html>`;
}

/** Renders the statement to a PDF and opens the share sheet (save to Files, WhatsApp, email...). */
export async function shareStatementPdf(s: GivingStatement) {
  const html = statementHtml(s);
  if (Platform.OS === 'web') return Print.printAsync({ html });
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: `Giving statement FY ${s.financialYear}` });
  } else {
    await Print.printAsync({ uri });
  }
}
