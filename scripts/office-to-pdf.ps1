# office-to-pdf.ps1 — convert a PowerPoint or Word file to PDF with the installed Office.
#
#   powershell -NoProfile -ExecutionPolicy Bypass -File scripts/office-to-pdf.ps1 -In deck.pptx -Out deck.pdf
#
# Used by the dev-only admin upload route (vite.config.ts): a .pptx/.ppt/.docx/.doc
# dropped in the admin is stored as a PDF, so the document viewer can show it
# inline and visitors never need Office. Exits non-zero if Office is missing,
# in which case the server keeps the original file.
param(
  [Parameter(Mandatory = $true)][string]$In,
  [Parameter(Mandatory = $true)][string]$Out
)
$ErrorActionPreference = 'Stop'
$In = (Resolve-Path $In).Path
$ext = [System.IO.Path]::GetExtension($In).ToLower()

if ($ext -in '.pptx', '.ppt', '.potx') {
  $app = New-Object -ComObject PowerPoint.Application
  try {
    # msoFalse = 0 for ReadOnly/Untitled/WithWindow — no window flashes up
    $pres = $app.Presentations.Open($In, 1, 0, 0)
    $pres.SaveAs($Out, 32)   # ppSaveAsPDF
    $pres.Close()
  } finally { $app.Quit() }
} elseif ($ext -in '.docx', '.doc') {
  $app = New-Object -ComObject Word.Application
  $app.Visible = $false
  try {
    $doc = $app.Documents.Open($In, $false, $true)
    $doc.SaveAs([ref]$Out, [ref]17)   # wdFormatPDF
    $doc.Close([ref]0)
  } finally { $app.Quit() }
} else {
  Write-Error "unsupported: $ext"
  exit 2
}
if (-not (Test-Path $Out)) { exit 1 }
