Param(
  [Parameter(Mandatory=$true)] [string] $BackendUrl,
  [Parameter(Mandatory=$true)] [decimal] $AmountBRL,
  [Parameter(Mandatory=$true)] [string] $PixPhone,
  [Parameter(Mandatory=$false)] [string] $PixCpf = ""
)

$body = @{
  amountBRL = [double]$AmountBRL
  pixPhone  = $PixPhone
  pixCpf    = $PixCpf
} | ConvertTo-Json

Write-Host "POST $BackendUrl/api/order"
$resp = Invoke-RestMethod -Method Post -Uri "$BackendUrl/api/order" -Body $body -ContentType "application/json" -ErrorAction Stop
$resp | ConvertTo-Json -Depth 5
