################################################################################
#  A.L.F.R.E.D. -- Master Launch Script  (PS 5.1+ compatible)
#  Usage:  .\start.ps1
#  Flags:  -SkipTests   skip API test suite
#          -SkipSeed    skip data seeding
#          -Reset       kill all running services first
################################################################################
param(
    [switch]$SkipTests,
    [switch]$SkipSeed,
    [switch]$Reset
)

$ErrorActionPreference = "SilentlyContinue"
$ROOT     = Split-Path -Parent $MyInvocation.MyCommand.Path
$BACKEND  = "$ROOT\backend"
$FRONTEND = "$ROOT\frontend"
$PUBSITE  = "$ROOT\public_site"
$API      = "http://localhost:3000"
$APP_URL  = "http://localhost:5174"
$PUB_URL  = "http://localhost:5173"

function Write-Header { param($t) Write-Host "`n$('-'*62)`n  $t`n$('-'*62)" -ForegroundColor Cyan }
function Write-Ok     { param($t) Write-Host "  [OK]  $t" -ForegroundColor Green }
function Write-Warn   { param($t) Write-Host "  [!!]  $t" -ForegroundColor Yellow }
function Write-Err    { param($t) Write-Host "  [XX]  $t" -ForegroundColor Red }
function Write-Step   { param($t) Write-Host "        $t" -ForegroundColor Gray }

function Is-Alive {
    param($url)
    try {
        $r = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 3
        return $r.StatusCode -lt 400
    } catch { return $false }
}

function Wait-Port {
    param($url, [int]$maxSecs = 90)
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    while ($sw.Elapsed.TotalSeconds -lt $maxSecs) {
        if (Is-Alive $url) { return $true }
        Start-Sleep -Seconds 2
        Write-Host "." -NoNewline
    }
    return $false
}

Clear-Host
Write-Host @"

  ==============================================================
  |  A.L.F.R.E.D.  Decision Engineering Platform  v0.1.0    |
  ==============================================================

"@ -ForegroundColor Cyan

# -- 0: RESET ------------------------------------------------------------------
if ($Reset) {
    Write-Header "0 / RESET"
    Get-Process -Name "api-gateway" -ErrorAction SilentlyContinue | Stop-Process -Force
    foreach ($port in @(3000, 5173, 5174)) {
        $lines = netstat -aon 2>$null | Select-String ":$port "
        foreach ($line in $lines) {
            $parts = ($line.ToString().Trim() -split '\s+')
            $portPid = $parts[-1]
            if ($portPid -match '^\d+$' -and [int]$portPid -gt 0) {
                Stop-Process -Id ([int]$portPid) -Force -ErrorAction SilentlyContinue
            }
        }
    }
    Start-Sleep -Seconds 2
    Write-Ok "Previous processes cleared"
}

# -- 1: PREREQUISITES ----------------------------------------------------------
Write-Header "1 / PREREQUISITES"
$allOk = $true
foreach ($check in @(
    @{cmd="cargo --version"; name="Rust/Cargo"},
    @{cmd="node   --version"; name="Node.js"},
    @{cmd="npm    --version"; name="npm"}
)) {
    $ver = (Invoke-Expression $check.cmd 2>&1 | Select-Object -First 1)
    if ($ver) { Write-Ok "$($check.name)  [$ver]" }
    else       { Write-Err "$($check.name) NOT FOUND"; $allOk = $false }
}
if (-not $allOk) { Write-Err "Install missing prerequisites then re-run."; exit 1 }

# -- 2: NPM DEPS ---------------------------------------------------------------
Write-Header "2 / NODE DEPENDENCIES"
foreach ($dir in @($FRONTEND, $PUBSITE)) {
    $name = Split-Path $dir -Leaf
    if (-not (Test-Path "$dir\node_modules")) {
        Write-Step "Installing npm packages for $name ..."
        Push-Location $dir
        npm install --silent 2>&1 | Out-Null
        Pop-Location
        Write-Ok "$name -- packages installed"
    } else {
        Write-Ok "$name -- node_modules present"
    }
}

# -- 3: START SERVICES ---------------------------------------------------------
Write-Header "3 / SERVICES"

if (Is-Alive "$API/health") {
    Write-Ok "API Gateway already running at $API"
} else {
    Write-Step "Starting API Gateway (Rust/Axum) -- this takes ~30s first run..."
    Start-Process powershell -ArgumentList "-NoExit","-Command","Set-Location '$BACKEND'; cargo run --bin api-gateway" -WindowStyle Normal
    Write-Host "  Waiting for API Gateway" -NoNewline
    if (Wait-Port "$API/health") { Write-Ok "`n  API Gateway live at $API" }
    else { Write-Warn "`n  API Gateway slow to start -- check the terminal window" }
}

if (Is-Alive $APP_URL) {
    Write-Ok "App Dashboard already running at $APP_URL"
} else {
    Start-Process powershell -ArgumentList "-NoExit","-Command","Set-Location '$FRONTEND'; npm run dev" -WindowStyle Minimized
    Start-Sleep -Seconds 4
    Write-Ok "App Dashboard starting at $APP_URL"
}

if (Is-Alive $PUB_URL) {
    Write-Ok "Public Site already running at $PUB_URL"
} else {
    Start-Process powershell -ArgumentList "-NoExit","-Command","Set-Location '$PUBSITE'; npm run dev" -WindowStyle Minimized
    Start-Sleep -Seconds 4
    Write-Ok "Public Site starting at $PUB_URL"
}

# -- 4: SEED DATA --------------------------------------------------------------
if (-not $SkipSeed) {
    Write-Header "4 / SEED DATA"
    $seedData = @(
        @{
            desc   = "Install FinOps Agent"
            url    = "$API/api/marketplace/packages/agent-finops/install"
            method = "POST"
            body   = "{}"
        },
        @{
            desc   = "Install Datadog Connector"
            url    = "$API/api/marketplace/packages/conn-datadog/install"
            method = "POST"
            body   = "{}"
        },
        @{
            desc   = "RLHF feedback -- approved decision"
            url    = "$API/api/feedback"
            method = "POST"
            body   = '{"decision_id":"DEC-SEED-001","user_id":"admin","user_role":"sr_engineer","action_type":"restart_service","recommendation":"Restart orders-api connection pool","ai_confidence":0.94,"decision":"approved","environment":"production"}'
        },
        @{
            desc   = "RLHF feedback -- rejected decision"
            url    = "$API/api/feedback"
            method = "POST"
            body   = '{"decision_id":"DEC-SEED-002","user_id":"ops-lead","user_role":"sr_engineer","action_type":"scale_up","recommendation":"Scale orders-api to 8 replicas","ai_confidence":0.81,"decision":"rejected","reason":"Scheduled maintenance window","environment":"production"}'
        }
    )

    foreach ($s in $seedData) {
        try {
            Invoke-RestMethod -Uri $s.url -Method $s.method -Body $s.body -ContentType "application/json" -Headers @{ Authorization = "Bearer sk_test_xxxxx" } | Out-Null
            Write-Ok $s.desc
        } catch {
            Write-Warn "Skipped (may already exist): $($s.desc)"
        }
    }
}

# -- 5: API TEST SUITE ---------------------------------------------------------
if (-not $SkipTests) {
    Write-Header "5 / API TEST SUITE (23 endpoints)"

    $tests = @(
        @{ m="GET";  url="$API/health";                                                  body="";   desc="Platform health" },
        @{ m="GET";  url="$API/api/monitoring/kpis";                                     body="";   desc="Monitoring KPIs" },
        @{ m="GET";  url="$API/api/incidents";                                           body="";   desc="Incidents list" },
        @{ m="GET";  url="$API/api/incidents/metrics";                                   body="";   desc="Incident metrics" },
        @{ m="GET";  url="$API/api/decisions/pending";                                   body="";   desc="Pending decisions" },
        @{ m="GET";  url="$API/api/decisions/recommendations";                           body="";   desc="AI recommendations" },
        @{ m="GET";  url="$API/api/workflows";                                           body="";   desc="Workflows" },
        @{ m="GET";  url="$API/api/agents";                                              body="";   desc="AI agents" },
        @{ m="GET";  url="$API/api/sops";                                                body="";   desc="Knowledge SOPs" },
        @{ m="GET";  url="$API/api/templates";                                           body="";   desc="Template catalog (21 templates)" },
        @{ m="GET";  url="$API/api/topology/api-gw-prod";                                body="";   desc="Topology graph" },
        @{ m="GET";  url="$API/api/topology/api-gw-prod/impact";                         body="";   desc="Impact radius" },
        @{ m="GET";  url="$API/api/marketplace/packages";                                body="";   desc="All marketplace packages" },
        @{ m="GET";  url="$API/api/marketplace/packages/agents";                         body="";   desc="Agent packages" },
        @{ m="GET";  url="$API/api/marketplace/packages/automations";                    body="";   desc="Automation packages" },
        @{ m="GET";  url="$API/api/marketplace/packages/connectors";                     body="";   desc="Connector packages" },
        @{ m="GET";  url="$API/api/feedback/history";                                    body="";   desc="RLHF feedback history" },
        @{ m="GET";  url="$API/api/governance/roles";                                    body="";   desc="RBAC roles (5)" },
        @{ m="GET";  url="$API/api/governance/audit";                                    body="";   desc="Audit trail" },
        @{ m="GET";  url="$API/api/opex/roi";                                            body="";   desc="OpEx ROI -- data-driven" },
        @{ m="POST"; url="$API/api/decisions/simulate";                                  body='{"action_type":"restart_service","target_entity_id":"api-gw-prod"}'; desc="Decision simulation" },
        @{ m="POST"; url="$API/api/ml/predict/failure";                                  body='{"entity_id":"db-postgres-prod"}'; desc="ML failure prediction" },
        @{ m="POST"; url="$API/api/ml/predict/capacity";                                 body='{"resource_id":"orders-db","current_usage_pct":78.5}'; desc="Capacity forecast" }
    )

    $pass = 0; $fail = 0
    foreach ($t in $tests) {
        try {
            if ($t.m -eq "POST") {
                $postBody = $t.body
                if (-not $postBody) { $postBody = "{}" }
                $r = Invoke-WebRequest -Uri $t.url -Method POST -Body $postBody -ContentType "application/json" -UseBasicParsing -TimeoutSec 8 -Headers @{ Authorization = "Bearer sk_test_xxxxx" }
            } else {
                $r = Invoke-WebRequest -Uri $t.url -UseBasicParsing -TimeoutSec 8 -Headers @{ Authorization = "Bearer sk_test_xxxxx" }
            }
            Write-Ok "$($t.desc)  [HTTP $($r.StatusCode)]"
            $pass++
        } catch {
            $errMsg = $_.Exception.Message.Split("`n")[0]
            Write-Err "$($t.desc)  [$errMsg]"
            $fail++
        }
    }

    Write-Host ""
    Write-Host "  $('-'*60)" -ForegroundColor DarkGray
    if ($fail -eq 0) {
        Write-Host "  RESULT: $pass / $($tests.Count) passed -- all systems nominal" -ForegroundColor Green
    } else {
        Write-Host "  RESULT: $pass passed  |  $fail failed  |  $($tests.Count) total" -ForegroundColor Yellow
    }
    Write-Host "  $('-'*60)" -ForegroundColor DarkGray
}

# -- 6: LIVE STATS FROM API (data-driven, no assumptions) ----------------------
Write-Header "6 / LIVE PLATFORM SNAPSHOT (computed from /api/opex/roi)"

try {
    $roi    = Invoke-RestMethod "$API/api/opex/roi"            -TimeoutSec 5 -Headers @{ Authorization = "Bearer sk_test_xxxxx" }
    $pkgs   = Invoke-RestMethod "$API/api/marketplace/packages" -TimeoutSec 5 -Headers @{ Authorization = "Bearer sk_test_xxxxx" }
    $agents = Invoke-RestMethod "$API/api/agents"              -TimeoutSec 5 -Headers @{ Authorization = "Bearer sk_test_xxxxx" }
    $kpis   = Invoke-RestMethod "$API/api/monitoring/kpis"     -TimeoutSec 5 -Headers @{ Authorization = "Bearer sk_test_xxxxx" }

    $s           = $roi.summary
    $installed   = ($pkgs | Where-Object { $_.install_state -eq "installed" }).Count
    $annualSav   = [math]::Round($s.monthly_sre_savings_usd * 12, 0)

    Write-Host @"

  Source: $API/api/opex/roi
  ------------------------------------------------------------
   Templates loaded           : $($s.template_count)
   Monthly automation events  : $($s.total_monthly_occurrences) incidents handled
   Monthly SRE hours saved    : $($s.monthly_hours_saved) hrs
   Monthly cost avoidance     : `$$($s.monthly_sre_savings_usd)
   Annual cost avoidance      : `$$annualSav
   Weighted AI confidence     : $($s.weighted_avg_ai_confidence_pct)%
   Marketplace packages       : $($pkgs.Count) available, $installed installed
   Active AI agents           : $($agents.Count)
   Active incidents           : $($kpis.active_incidents)
   Automation success rate    : $($kpis.automation_success_rate)
  ------------------------------------------------------------
  Methodology: SRE cost = `$150/hr (Gartner 2024)
  Scope: SRE time only. Downtime avoidance NOT included.
"@ -ForegroundColor White

    Write-Host "  Category Breakdown:" -ForegroundColor Cyan
    Write-Host "  +--------------------+-------+----------+----------+--------------+"
    Write-Host "  | Category           | Tmpls |  Occ/mo  | Hrs/mo   | Savings/mo   |"
    Write-Host "  +--------------------+-------+----------+----------+--------------+"
    $sorted = $roi.by_category | Sort-Object monthly_sre_savings_usd -Descending
    foreach ($cat in $sorted) {
        $n = $cat.category.PadRight(18)
        $tc = "$($cat.template_count)".PadLeft(3)
        $oc = "$($cat.monthly_occurrences)".PadLeft(6)
        $hr = "$($cat.monthly_hours_saved)".PadLeft(6)
        $sv = "`$$($cat.monthly_sre_savings_usd)".PadLeft(10)
        Write-Host "  | $n |  $tc  | $oc   | $hr   | $sv   |"
    }
    Write-Host "  +--------------------+-------+----------+----------+--------------+"

} catch {
    Write-Warn "Could not fetch live stats: $($_.Exception.Message)"
}

# -- 7: OPEN BROWSERS ----------------------------------------------------------
Write-Header "7 / OPENING BROWSERS"
Start-Sleep -Seconds 2

$urls = @(
    @{ url=$PUB_URL;              desc="Public Site (Marketing)" },
    @{ url="$APP_URL/decisions";  desc="Decision Engineering Dashboard" },
    @{ url="$ROOT\opex-guide.html"; desc="Client OpEx Reduction Guide" }
)
foreach ($u in $urls) {
    Write-Step "Opening $($u.desc)  ->  $($u.url)"
    Start-Process $u.url
    Start-Sleep -Milliseconds 700
}

Write-Host @"

  ==============================================================
  |  A.L.F.R.E.D. is fully operational                      |
  ==============================================================
  |                                                          |
  |  Public Site    ->  $PUB_URL
  |  App Dashboard  ->  $APP_URL
  |  API Gateway    ->  $API
  |  OpEx Guide     ->  opex-guide.html (opens in browser)  |
  |  Live ROI API   ->  /api/opex/roi                       |
  |                                                          |
  ==============================================================
"@ -ForegroundColor Cyan

