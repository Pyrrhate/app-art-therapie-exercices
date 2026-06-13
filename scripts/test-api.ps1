# Test rapide de l'API Art Thérapie (PowerShell)
# Usage : .\scripts\test-api.ps1

$baseUrl = "http://localhost:3000"

Write-Host "`n--- GET /api/health ---" -ForegroundColor Cyan
Invoke-RestMethod -Uri "$baseUrl/api/health" -Method GET | ConvertTo-Json

Write-Host "`n--- POST /api/exercise/generate ---" -ForegroundColor Cyan
$body = @{
  impulse   = "bleu apaisant"
  technique = "drawing"
} | ConvertTo-Json -Compress

Invoke-RestMethod `
  -Uri "$baseUrl/api/exercise/generate" `
  -Method POST `
  -Body $body `
  -ContentType "application/json; charset=utf-8" | ConvertTo-Json -Depth 5

Write-Host "`nOK — si source = fallback, l'API marche mais Hugging Face n'a pas répondu (quota, modèle, token)." -ForegroundColor Green
