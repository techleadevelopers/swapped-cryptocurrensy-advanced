Param(
  [Parameter(Mandatory=$true)] [string] $SignerUrl,
  [Parameter(Mandatory=$true)] [string] $SignerHmacSecret,
  [Parameter(Mandatory=$true)] [int]    $DerivationIndex,
  [Parameter(Mandatory=$true)] [string] $To,
  [Parameter(Mandatory=$true)] [string] $Amount,          # ex: "12.34" (até 6 decimais)
  [Parameter(Mandatory=$true)] [string] $TokenContract,   # ex: USDT TRC20
  [Parameter(Mandatory=$true)] [string] $IdempotencyKey
)

$ts    = [int][double]::Parse((Get-Date -UFormat %s))
$nonce = ([guid]::NewGuid().ToString("N")).Substring(0,16)

$bodyObj = [ordered]@{
  derivationIndex = $DerivationIndex
  to              = $To
  amount          = $Amount
  tokenContract   = $TokenContract
  idempotencyKey  = $IdempotencyKey
}
$rawBody = ($bodyObj | ConvertTo-Json -Depth 5)

# dataToSign = ts.nonce.body
$prefix = "$ts.$nonce."
$data   = [System.Text.Encoding]::UTF8.GetBytes($prefix) + [System.Text.Encoding]::UTF8.GetBytes($rawBody)

$hmac = New-Object System.Security.Cryptography.HMACSHA256
$hmac.Key = [byte[]]([System.Convert]::FromHexString($SignerHmacSecret))
$sigBytes = $hmac.ComputeHash($data)
$sigHex   = ([BitConverter]::ToString($sigBytes)).Replace("-","").ToLower()

$headers = @{
  "x-ts"          = $ts
  "x-nonce"       = $nonce
  "x-signer-hmac" = $sigHex
  "Content-Type"  = "application/json"
}

Write-Host "POST $SignerUrl/hd/transfer"
Write-Host "Headers:" ($headers | ConvertTo-Json -Depth 3)
Write-Host "Body:" $rawBody

$resp = Invoke-RestMethod -Method Post -Uri "$SignerUrl/hd/transfer" -Headers $headers -Body $rawBody -ErrorAction Stop
Write-Host "`nResponse:"
$resp | ConvertTo-Json -Depth 5
