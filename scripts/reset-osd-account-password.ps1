$ErrorActionPreference = 'Stop'

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$envFile = Join-Path $projectRoot '.env.local'
$nodeScript = Join-Path $PSScriptRoot 'reset-osd-account-password.mjs'

if (-not (Test-Path $envFile)) {
  throw 'Could not find .env.local. Configure the Supabase project URL first.'
}

$urlLine = Get-Content $envFile | Where-Object { $_ -match '^\s*VITE_SUPABASE_URL\s*=' } | Select-Object -First 1
if (-not $urlLine) {
  throw 'VITE_SUPABASE_URL is missing from .env.local.'
}

$projectUrl = ($urlLine -replace '^\s*VITE_SUPABASE_URL\s*=\s*', '').Trim().Trim('"').Trim("'")
if ($projectUrl -notmatch '^https://[a-zA-Z0-9-]+\.supabase\.co/?$') {
  throw 'VITE_SUPABASE_URL in .env.local is not a standard Supabase project URL.'
}

Write-Host 'This will reset only the existing osd@hayag.edu.ph account password.'
Write-Host 'A unique temporary password will be shown once in this terminal.'
$secureKey = Read-Host 'Paste the Supabase service-role/secret key (input is hidden)' -AsSecureString
if (-not $secureKey -or $secureKey.Length -lt 1) {
  throw 'A Supabase service-role/secret key is required.'
}

$keyPointer = [IntPtr]::Zero
$plainKey = $null
$previousUrl = $env:SUPABASE_URL
$previousKey = $env:SUPABASE_SERVICE_ROLE_KEY
$locationPushed = $false

try {
  $keyPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureKey)
  $plainKey = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($keyPointer)
  $env:SUPABASE_URL = $projectUrl
  $env:SUPABASE_SERVICE_ROLE_KEY = $plainKey
  Push-Location $projectRoot
  $locationPushed = $true

  & node $nodeScript
  if ($LASTEXITCODE -ne 0) {
    throw 'Account verification failed. No password was reset.'
  }

  $confirmation = Read-Host 'Type RESET to set a new temporary password for this account'
  if ($confirmation -cne 'RESET') {
    Write-Host 'Cancelled. No changes were made.'
    return
  }

  & node $nodeScript --apply
  if ($LASTEXITCODE -ne 0) {
    throw 'Password reset failed. Read the error above before retrying.'
  }
} finally {
  $env:SUPABASE_URL = $previousUrl
  $env:SUPABASE_SERVICE_ROLE_KEY = $previousKey
  if ($keyPointer -ne [IntPtr]::Zero) {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($keyPointer)
  }
  if ($plainKey) {
    $plainKey = $null
  }
  if ($secureKey) {
    $secureKey.Dispose()
  }
  if ($locationPushed) {
    Pop-Location
  }
}
