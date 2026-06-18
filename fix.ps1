$files = Get-ChildItem -Path "C:\Users\ADMIN\Desktop\Perlyn\perlyn" -Include *.html, *.js, *.ts, *.json -Recurse -Exclude "node_modules"

$report = "# 🧹 Mojibake Restoration Report`n`n| File | Replacements | Details |`n|---|---|---|`n"
$totalModified = 0

foreach ($file in $files) {
    if ($file.FullName -match "node_modules" -or $file.FullName -match "\.git") { continue }
    
    $originalContent = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
    $content = $originalContent

    $changes = 0
    $details = @()

    $replacements = [ordered]@{
        "â‚¹" = "₹"
        "â€™" = "'"
        "â€œ" = "`""
        "â€¢" = "•"
        "â€" = "`""
        "ðŸ’„" = "💄"
        "ðŸš€" = "🚀"
        "ðŸ“¦" = "📦"
        "ðŸ“§" = "📧"
        "ðŸšš" = "🚚"
        "ðŸ’–" = "💖"
        "âœ¨" = "✨"
        "â Œ" = "❌"
        "âš ï¸" = "⚠️"
        "ðŸ’¡" = "💡"
        "ðŸ‡®ðŸ‡³" = "🇮🇳"
        "ðŸ ¡" = "🏠"
        "ðŸ’°" = "💰"
        "ðŸ†•" = "🆕"
        "ðŸ”¥" = "🔥"
        "âœ ï¸" = "✏️"
        "â­ " = "⭐"
        "Â" = ""
    }

    foreach ($key in $replacements.Keys) {
        if ($content.Contains($key)) {
            $count = ($content.Length - $content.Replace($key, "").Length) / $key.Length
            $content = $content.Replace($key, $replacements[$key])
            if ($count -gt 0) {
                $changes += $count
                $details += "$count x '$key'"
            }
        }
    }

    # Fix bullet points in title and meta tags globally
    $patternTitle = '(?i)<title>(.*?)</title>'
    $content = [regex]::Replace($content, $patternTitle, { 
        param($m) 
        $t = $m.Groups[1].Value.Replace("•", "|")
        return "<title>$t</title>"
    })

    $patternMeta = '(?i)<meta\s+name=["'']description["'']\s+content=["''](.*?)["'']'
    $content = [regex]::Replace($content, $patternMeta, { 
        param($m) 
        $t = $m.Groups[1].Value.Replace("•", "|")
        return "<meta name=`"description`" content=`"$t`""
    })

    if ($content -cne $originalContent) {
        $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
        [System.IO.File]::WriteAllText($file.FullName, $content, $utf8NoBom)
        
        $name = $file.Name
        $detailsStr = $details -join ", "
        $report += "| $name | $changes | $detailsStr |`n"
        $totalModified++
    }
}

$report += "`n**Total files fixed:** $totalModified`n"
[System.IO.File]::WriteAllText("C:\Users\ADMIN\Desktop\Perlyn\perlyn\mojibake_restoration_report.md", $report)
Write-Output "Done. Fixed $totalModified files."
