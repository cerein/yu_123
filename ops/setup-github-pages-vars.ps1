param(
  [Parameter(Mandatory = $true)]
  [string]$GithubToken,
  [Parameter(Mandatory = $true)]
  [string]$RemoteUnmBase,
  [Parameter(Mandatory = $true)]
  [string]$StreamProxyBase,
  [string]$Repository = ""
)

$ErrorActionPreference = "Stop"

function Normalize-Repo([string]$repoInput) {
  if ($repoInput) { return $repoInput.Trim() }
  $remote = git remote get-url origin
  if (-not $remote) { throw "无法从 origin 推断仓库名，请显式传入 -Repository owner/repo" }
  if ($remote -match "github\.com[:/](.+?)(\.git)?$") {
    return $Matches[1]
  }
  throw "origin 不是 GitHub 仓库地址：$remote"
}

function Put-Variable($ownerRepo, $name, $value, $token) {
  $url = "https://api.github.com/repos/$ownerRepo/actions/variables/$name"
  $headers = @{
    Authorization = "Bearer $token"
    Accept        = "application/vnd.github+json"
    "X-GitHub-Api-Version" = "2022-11-28"
  }
  $body = @{ name = $name; value = $value } | ConvertTo-Json
  Invoke-RestMethod -Method Put -Uri $url -Headers $headers -Body $body -ContentType "application/json" | Out-Null
  Write-Host "✓ 变量已写入: $name"
}

function Dispatch-Workflow($ownerRepo, $workflow, $token) {
  $url = "https://api.github.com/repos/$ownerRepo/actions/workflows/$workflow/dispatches"
  $headers = @{
    Authorization = "Bearer $token"
    Accept        = "application/vnd.github+json"
    "X-GitHub-Api-Version" = "2022-11-28"
  }
  $body = @{ ref = "main" } | ConvertTo-Json
  Invoke-RestMethod -Method Post -Uri $url -Headers $headers -Body $body -ContentType "application/json" | Out-Null
  Write-Host "✓ 已触发工作流: $workflow"
}

$repo = Normalize-Repo $Repository
$normalizedUnm = $RemoteUnmBase.Trim().TrimEnd("/")
$normalizedProxy = $StreamProxyBase.Trim().TrimEnd("/")

if (-not $normalizedUnm.StartsWith("https://")) {
  throw "RemoteUnmBase 必须是 https:// 开头"
}
if (-not $normalizedUnm.ToLower().EndsWith("/unm-api")) {
  throw "RemoteUnmBase 必须以 /unm-api 结尾"
}
if (-not $normalizedProxy.StartsWith("https://")) {
  throw "StreamProxyBase 必须是 https:// 开头"
}

Put-Variable $repo "VITE_REMOTE_UNM_BASE" $normalizedUnm $GithubToken
Put-Variable $repo "VITE_STREAM_PROXY_BASE" $normalizedProxy $GithubToken

Dispatch-Workflow $repo "deploy.yml" $GithubToken

Write-Host ""
Write-Host "完成。请在 Actions 页面等待 Deploy to GitHub Pages 成功。"
Write-Host "仓库: $repo"
Write-Host "VITE_REMOTE_UNM_BASE=$normalizedUnm"
Write-Host "VITE_STREAM_PROXY_BASE=$normalizedProxy"
