# 推送修复到 GitHub Pages（xqz144/ZY）
# 用法：$env:GH_TOKEN = "ghp_xxxx"; .\push-fix.ps1
# 或把 token 填到下方 $token 变量（不推荐，容易泄露）

$token = $env:GH_TOKEN
if (-not $token) {
    Write-Error "请先设置环境变量 GH_TOKEN，或在脚本中填写 token。"
    exit 1
}

$owner = "xqz144"
$repo = "ZY"
$apiBase = "https://api.github.com/repos/$owner/$repo"
$headers = @{
    Authorization = "Bearer $token"
    Accept = "application/vnd.github+json"
    "X-GitHub-Api-Version" = "2022-11-28"
}

$localRoot = "C:\Users\linkongxi\AppData\Roaming\TRAE SOLO CN\ModularData\ai-agent\work-mode-projects\6a6aeb274a33c6316409d32c\mengjiao-chuanxun"

$files = @(
    @{ local = "$localRoot\index.html"; repo = "index.html" },
    @{ local = "$localRoot\manifest.json"; repo = "manifest.json" },
    @{ local = "$localRoot\sw.js"; repo = "sw.js" },
    @{ local = "$localRoot\icon.svg"; repo = "icon.svg" },
    @{ local = "$localRoot\pages\index-new-v2.html"; repo = "pages/index-new-v2.html" },
    @{ local = "$localRoot\pages\customize-replies.html"; repo = "pages/customize-replies.html" },
    @{ local = "$localRoot\pages\customize-profile.html"; repo = "pages/customize-profile.html" },
    @{ local = "$localRoot\pages\chat-new.html"; repo = "pages/chat-new.html" },
    @{ local = "$localRoot\pages\anniversary-new.html"; repo = "pages/anniversary-new.html" },
    @{ local = "$localRoot\assets\image-utils.js"; repo = "assets/image-utils.js" },
    @{ local = "$localRoot\assets\sticker-utils.js"; repo = "assets/sticker-utils.js" }
)

# 获取现有文件 SHA
Write-Output "正在获取远程文件 SHA..."
$existingShas = @{}
foreach ($file in $files) {
    try {
        $resp = Invoke-RestMethod -Uri "$apiBase/contents/$($file.repo)" -Headers $headers -Method Get -TimeoutSec 30
        $existingShas[$file.repo] = $resp.sha
        Write-Output "  $($file.repo): $($resp.sha.Substring(0,7))"
    } catch {
        Write-Output "  $($file.repo): 不存在，将新建"
    }
}

# 上传
foreach ($file in $files) {
    $localPath = $file.local
    $repoPath = $file.repo

    $content = Get-Content $localPath -Raw -Encoding UTF8
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($content)
    $base64 = [Convert]::ToBase64String($bytes)

    $body = @{
        message = "feat: search, import/export, images, stickers, PWA"
        content = $base64
        branch = "main"
    }
    if ($existingShas.ContainsKey($repoPath)) {
        $body.sha = $existingShas[$repoPath]
    }

    $jsonBody = $body | ConvertTo-Json -Depth 5

    Write-Output "正在上传 $repoPath ..."
    try {
        $response = Invoke-RestMethod -Uri "$apiBase/contents/$repoPath" -Headers $headers -Method Put -Body $jsonBody -ContentType "application/json; charset=utf-8" -TimeoutSec 60
        Write-Output "  成功: commit $($response.commit.sha.Substring(0,7))"
    } catch {
        $errMsg = $_.Exception.Message
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $errBody = $reader.ReadToEnd()
            Write-Output "  失败: $errMsg"
            Write-Output "  响应: $($errBody.Substring(0, [Math]::Min(300, $errBody.Length)))"
        } else {
            Write-Output "  失败: $errMsg"
        }
    }
}

Write-Output ""
Write-Output "=== 推送完成 ==="
Write-Output "线上地址: https://xqz144.github.io/ZY/"
Write-Output "提示：GitHub Pages 缓存可能需要 1-3 分钟生效，强制刷新或加 ?v=2 访问。"
