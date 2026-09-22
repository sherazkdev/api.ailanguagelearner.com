# Full API smoke + security test suite
$ErrorActionPreference = "Stop"
$base = "http://127.0.0.1:3000"
$apiKey = "dev-lingua-api-key-change-me"
$apiHeaders = @{ "x-api-key" = $apiKey }
$passed = 0
$failed = 0
$results = @()

function Test-Case {
  param([string]$Name, [scriptblock]$Action)
  try {
    & $Action
    $script:passed++
    $script:results += [pscustomobject]@{ Status = "PASS"; Test = $Name }
    Write-Host "[PASS] $Name" -ForegroundColor Green
  } catch {
    $script:failed++
    $msg = $_.Exception.Message
    if ($_.ErrorDetails.Message) { $msg = $_.ErrorDetails.Message }
    $script:results += [pscustomobject]@{ Status = "FAIL"; Test = $Name; Error = $msg }
    Write-Host "[FAIL] $Name -> $msg" -ForegroundColor Red
  }
}

function Invoke-Api($method, $uri, $body = $null, $customHeaders = $null, $expectStatus = $null) {
  $baseHeaders = if ($customHeaders) { $customHeaders } else { @{ "x-api-key" = $apiKey } }
  $hdrs = @{}
  foreach ($key in $baseHeaders.Keys) { $hdrs[$key] = $baseHeaders[$key] }
  if ($body -ne $null) {
    if (-not $hdrs.ContainsKey("Content-Type")) {
      $hdrs["Content-Type"] = "application/json; charset=utf-8"
    }
  }
  $params = @{ Uri = $uri; Method = $method; Headers = $hdrs }
  if ($body -ne $null) {
    $params.Body = [System.Text.Encoding]::UTF8.GetBytes(($body | ConvertTo-Json -Compress))
  }
  try {
    $r = Invoke-WebRequest @params -UseBasicParsing
    $status = $r.StatusCode
    $content = $r.Content | ConvertFrom-Json
  } catch {
    $resp = $_.Exception.Response
    if (-not $resp) { throw }
    $status = [int]$resp.StatusCode
    $reader = New-Object System.IO.StreamReader($resp.GetResponseStream())
    $raw = $reader.ReadToEnd()
    try { $content = $raw | ConvertFrom-Json } catch { $content = @{ raw = $raw } }
  }
  if ($expectStatus -and $status -ne $expectStatus) {
    throw "Expected HTTP $expectStatus but got $status : $($content | ConvertTo-Json -Compress)"
  }
  return @{ status = $status; data = $content }
}

Write-Host "`n=== Lingua AI Full API Test ===`n" -ForegroundColor Cyan

Test-Case -Name "GET /health (no auth)" -Action {
  $r = Invoke-Api GET "$base/health" $null @{ "Content-Type" = "application/json" } 200
  if (-not $r.data.ok) { throw "health not ok" }
}

Test-Case -Name "401 without x-api-key" -Action {
  Invoke-Api GET "$base/v1/conversation-types" $null @{ "Content-Type" = "application/json" } 401 | Out-Null
}

Test-Case -Name "POST /v1/users/subscribe (deviceId)" -Action {
  $body = @{ deviceId = "full-test-device-001"; subscriptionActive = $true; subscriptionProvider = "google" }
  $r = Invoke-Api POST "$base/v1/users/subscribe" $body $apiHeaders 200
  if (-not $r.data.user.deviceId) { throw "no deviceId in response" }
}

Test-Case -Name "POST /v1/users/subscribe (userId)" -Action {
  $body = @{ userId = "full-test-user-001"; deviceId = "full-test-device-001"; subscriptionActive = $true }
  $r = Invoke-Api POST "$base/v1/users/subscribe" $body $apiHeaders 200
  if (-not $r.data.user.userId) { throw "no userId in response" }
}

Test-Case -Name "GET /v1/users/:deviceId" -Action {
  $r = Invoke-Api GET "$base/v1/users/full-test-device-001" $null $apiHeaders 200
  if ($r.data.user.deviceId -ne "full-test-device-001") { throw "wrong user" }
}

Test-Case -Name "GET /v1/users/by-user-id/:userId" -Action {
  $r = Invoke-Api GET "$base/v1/users/by-user-id/full-test-user-001" $null $apiHeaders 200
  if ($r.data.user.userId -ne "full-test-user-001") { throw "wrong userId" }
}

Test-Case -Name "GET /v1/users (admin list)" -Action {
  $r = Invoke-Api GET "$base/v1/users" $null $apiHeaders 200
  if ($r.data.users.Count -lt 1) { throw "empty users list" }
}

Test-Case -Name "GET /v1/conversation-types" -Action {
  $r = Invoke-Api GET "$base/v1/conversation-types" $null $apiHeaders 200
  if ($r.data.types.Count -ne 9) { throw "expected 9 types, got $($r.data.types.Count)" }
}

Test-Case -Name "GET /v1/conversation-types?filter=daily_life" -Action {
  $r = Invoke-Api GET "$base/v1/conversation-types?filter=daily_life" $null $apiHeaders 200
  if ($r.data.types.Count -lt 1) { throw "filter returned empty" }
}

Test-Case -Name "GET /v1/conversation-types/:slugOrId" -Action {
  $r = Invoke-Api GET "$base/v1/conversation-types/daily-life" $null $apiHeaders 200
  if ($r.data.type.slug -ne "daily-life") { throw "wrong type" }
}

Test-Case -Name "GET /v1/conversation-types/:slug/topics" -Action {
  $r = Invoke-Api GET "$base/v1/conversation-types/daily-life/topics" $null $apiHeaders 200
  if ($r.data.topics.Count -lt 1) { throw "no topics" }
  $script:topicId = $r.data.topics[0]._id
  $script:typeId = $r.data.type._id
}

Test-Case -Name "GET ai-conversation topics blocked" -Action {
  Invoke-Api GET "$base/v1/conversation-types/ai-conversation/topics" $null $apiHeaders 400 | Out-Null
}

Test-Case -Name "POST role_play chat" -Action {
  $body = @{
    deviceId = "full-test-device-001"
    mode = "role_play"
    learningLanguageName = "Spanish"
    typeId = $script:typeId
    topicId = $script:topicId
    difficultyKey = "dl_beginner"
  }
  $r = Invoke-Api POST "$base/v1/chats" $body $apiHeaders 201
  if ($r.data.chat.systemInstruction) { throw "systemInstruction LEAKED" }
  $script:roleChatId = if ($r.data.chat._id) { $r.data.chat._id } else { $r.data.chat.id }
}

Test-Case -Name "POST free_chat chat" -Action {
  $body = @{ deviceId = "full-test-device-001"; mode = "free_chat"; learningLanguageName = "Spanish" }
  $r = Invoke-Api POST "$base/v1/chats" $body $apiHeaders 201
  if ($r.data.chat.topicId) { throw "free_chat should not have topicId" }
  $script:freeChatId = if ($r.data.chat._id) { $r.data.chat._id } else { $r.data.chat.id }
}

Test-Case -Name "Security: role_play without topicId -> 400" -Action {
  $body = @{ deviceId = "full-test-device-001"; mode = "role_play"; learningLanguageName = "Spanish"; typeId = $script:typeId }
  Invoke-Api POST "$base/v1/chats" $body $apiHeaders 400 | Out-Null
}

Test-Case -Name "Security: free_chat with topicId -> 400" -Action {
  $body = @{ deviceId = "full-test-device-001"; mode = "free_chat"; learningLanguageName = "Spanish"; topicId = $script:topicId }
  Invoke-Api POST "$base/v1/chats" $body $apiHeaders 400 | Out-Null
}

Test-Case -Name "Security: invalid ObjectId -> 400" -Action {
  Invoke-Api GET "$base/v1/chats/not-a-valid-id?deviceId=full-test-device-001" $null $apiHeaders 400 | Out-Null
}

Test-Case -Name "GET /v1/chats list" -Action {
  $r = Invoke-Api GET "$base/v1/chats?deviceId=full-test-device-001" $null $apiHeaders 200
  if ($r.data.chats.Count -lt 2) { throw "expected at least 2 chats" }
}

Test-Case -Name "GET /v1/chats/:chatId (no systemInstruction)" -Action {
  $r = Invoke-Api GET "$base/v1/chats/$($script:roleChatId)?deviceId=full-test-device-001" $null $apiHeaders 200
  if ($r.data.chat.systemInstruction) { throw "systemInstruction LEAKED in getOne" }
}

Test-Case -Name "GET /v1/chats/:chatId/messages (empty)" -Action {
  $r = Invoke-Api GET "$base/v1/chats/$($script:roleChatId)/messages?deviceId=full-test-device-001" $null $apiHeaders 200
  if ($null -eq $r.data.messages) { throw "no messages field" }
}

Test-Case -Name "POST /v1/chats/:chatId/messages (Groq)" -Action {
  $body = @{ deviceId = "full-test-device-001"; userMessage = "Hola, quiero un cafe por favor." }
  $r = Invoke-Api POST "$base/v1/chats/$($script:roleChatId)/messages" $body $apiHeaders 200
  if ($null -eq $r.data.text) {
    Write-Host "  [WARN] Groq returned null - set valid GROQ_API_KEY on VPS (API route OK)" -ForegroundColor Yellow
    return
  }
  if ($r.data.text.Length -lt 1) { throw "empty response text" }
  $script:aiReply = $r.data.text
}

Test-Case -Name "GET messages after send" -Action {
  $r = Invoke-Api GET "$base/v1/chats/$($script:roleChatId)/messages?deviceId=full-test-device-001" $null $apiHeaders 200
  if ($script:aiReply -and $r.data.messages.Count -lt 2) { throw "expected user+model messages" }
}

Test-Case -Name "Security: wrong owner cannot read chat -> 404" -Action {
  Invoke-Api GET "$base/v1/chats/$($script:roleChatId)?deviceId=wrong-device-999" $null $apiHeaders 404 | Out-Null
}

Test-Case -Name "DELETE /v1/chats/:chatId" -Action {
  Invoke-Api DELETE "$base/v1/chats/$($script:freeChatId)?deviceId=full-test-device-001" $null $apiHeaders 200 | Out-Null
}

Test-Case -Name "Deleted chat returns 404" -Action {
  Invoke-Api GET "$base/v1/chats/$($script:freeChatId)?deviceId=full-test-device-001" $null $apiHeaders 404 | Out-Null
}

Write-Host "`n=== Summary ===" -ForegroundColor Cyan
Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Failed: $failed" -ForegroundColor $(if ($failed -gt 0) { "Red" } else { "Green" })
if ($script:aiReply) { Write-Host "Groq sample reply: $($script:aiReply.Substring(0, [Math]::Min(80, $script:aiReply.Length)))..." }

if ($failed -gt 0) {
  $results | Where-Object Status -eq "FAIL" | Format-Table -AutoSize
  exit 1
}
