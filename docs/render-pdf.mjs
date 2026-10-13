// Renders docs/requirements-v12.md to PDF. Usage: npm i --no-save marked playwright && node docs/render-pdf.mjs docs/requirements-v12.md docs/bundle-insure-onboarding-requirements-v12.pdf
import { readFileSync } from 'fs'
import { marked } from 'marked'
import { chromium } from 'playwright'
const [src, out] = process.argv.slice(2)
const dots = '<span style="letter-spacing:2pt"><span style="color:#EF009B">●</span><span style="color:#29AF3E">●</span><span style="color:#287EFF">●</span><span style="color:#FFC211">●</span></span> '
const body = marked.parse(readFileSync(src, 'utf8')).replace('<h1>', '<h1>' + dots)
const html = `<!doctype html><html><head><meta charset="utf-8"><title>bundle.insure onboarding journey v12</title><style>
@page { size: A4; margin: 22mm 20mm 20mm 20mm; }
body { font-family: Inter, "Liberation Sans", Arial, sans-serif; font-size: 11pt; line-height: 1.45; color: #111; }
h1 { font-size: 26pt; font-weight: 800; letter-spacing: -0.02em; margin: 0 0 4pt; line-height: 1.15; }
h1 + p { color: #595959; font-size: 13pt; margin-top: 0; }
h2 { color: #0C192B; font-weight: 700 !important; border-left: 4px solid #FFC211; padding-left: 8pt; font-weight: 400; font-size: 17pt; margin: 22pt 0 8pt; page-break-after: avoid; }
h3 { color: #0C192B; font-weight: 700 !important; font-weight: 400; font-size: 13.5pt; margin: 16pt 0 6pt; page-break-after: avoid; }
p, li { orphans: 3; widows: 3; }
ul, ol { padding-left: 20pt; } li { margin: 2pt 0; }
table { width: 100%; border-collapse: collapse; margin: 8pt 0 12pt; font-size: 10pt; page-break-inside: auto; }
tr { page-break-inside: avoid; }
th { background: #0C192B; color: #fff; text-align: left; font-weight: 700; }
th, td { border: 1px solid #c8c8c8; padding: 5pt 7pt; vertical-align: top; }
code { font-family: "Liberation Mono", monospace; font-size: 9pt; background: #f2f2f2; padding: 0 2pt; }
hr { border: 0; border-top: 1px solid #ccc; margin: 16pt 0; }
strong { font-weight: 700; }
p:has(> strong:only-child) { page-break-after: avoid; break-after: avoid; margin-bottom: 4pt; }
h1 + p + p { color: #595959; font-size: 10.5pt; margin-top: -4pt; }
</style></head><body>${body}</body></html>`
const b = await chromium.launch({ ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) })
const p = await b.newPage()
await p.setContent(html, { waitUntil: 'load' })
await p.pdf({ path: out, format: 'A4', printBackground: true, displayHeaderFooter: true,
  headerTemplate: '<div></div>',
  footerTemplate: '<div style="font-family:sans-serif;font-size:8pt;color:#777;width:100%;padding:0 20mm;display:flex;justify-content:space-between"><span>bundle.insure · Onboarding requirements v12</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>',
  margin: { top: '22mm', bottom: '20mm', left: '20mm', right: '20mm' } })
await b.close()
