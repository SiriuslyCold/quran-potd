# Set project directory
$projectDir = "D:\Users\fkami\OneDrive\Documents\Projects\quran-potd"
Set-Location $projectDir

# Auto-increment CURRENT_PROJECT_VERSION in project.pbxproj
$pbxprojPath = "$projectDir\ios\App\App.xcodeproj\project.pbxproj"
if (Test-Path $pbxprojPath) {
    $content = Get-Content -Path $pbxprojPath -Raw
    if ($content -match 'CURRENT_PROJECT_VERSION\s*=\s*(\d+);') {
        $oldVersionCode = $Matches[1]
        $newVersionCode = [int]$oldVersionCode + 1
        $content = $content -replace "CURRENT_PROJECT_VERSION\s*=\s*$oldVersionCode;", "CURRENT_PROJECT_VERSION = $newVersionCode;"
        [System.IO.File]::WriteAllText($pbxprojPath, $content)
        Write-Host "Auto-incremented iOS build number (CURRENT_PROJECT_VERSION) from $oldVersionCode to $newVersionCode" -ForegroundColor Green
    } else {
        Write-Warning "Could not parse CURRENT_PROJECT_VERSION in $pbxprojPath"
    }
} else {
    Write-Warning "Could not find project.pbxproj at $pbxprojPath"
}

Write-Host "`nSyncing Capacitor assets to iOS..." -ForegroundColor Cyan
npx cap sync ios

if ($LASTEXITCODE -ne 0) {
    Write-Error "Capacitor sync failed!"
    exit 1
}

Write-Host "`n==========================================" -ForegroundColor Green
Write-Host "iOS Sync & Version Increment Succeeded!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host "The project is updated to build number: $newVersionCode" -ForegroundColor Yellow
Write-Host "You can now push these changes to GitHub to trigger your iOS remote build pipeline."
