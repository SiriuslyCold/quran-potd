param (
    [switch]$NoPush
)

# Set project directory
$projectDir = "D:\Users\fkami\OneDrive\Documents\Projects\quran-potd"
Set-Location $projectDir

# Auto-increment CURRENT_PROJECT_VERSION in project.pbxproj
$pbxprojPath = "$projectDir\ios\App\App.xcodeproj\project.pbxproj"
$newVersionCode = $null
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

Write-Host "`n[1/3] Syncing Capacitor assets to iOS..." -ForegroundColor Cyan
npx cap sync ios

if ($LASTEXITCODE -ne 0) {
    Write-Error "Capacitor sync failed!"
    exit 1
}

# Automatically commit and push version bump
if ($newVersionCode) {
    Write-Host "`n[2/3] Staging and committing version bump to Git..." -ForegroundColor Cyan
    git add ios/App/App.xcodeproj/project.pbxproj
    git commit -m "chore(ios): bump build number to $newVersionCode"
    
    if ($NoPush) {
        Write-Host "`n==========================================" -ForegroundColor Green
        Write-Host "iOS Version Bump committed locally!" -ForegroundColor Green
        Write-Host "Build number updated to #$newVersionCode. Pushing was skipped (-NoPush)." -ForegroundColor Yellow
        Write-Host "==========================================" -ForegroundColor Green
    } else {
        Write-Host "`n[3/3] Pushing to GitHub (triggers Ionic Appflow)..." -ForegroundColor Cyan
        git push origin main
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "`n==========================================" -ForegroundColor Green
            Write-Host "iOS Version Bump pushed to GitHub!" -ForegroundColor Green
            Write-Host "Ionic Appflow build #$newVersionCode is triggering now." -ForegroundColor Green
            Write-Host "==========================================" -ForegroundColor Green
        } else {
            Write-Warning "Failed to push to GitHub. Please push changes manually."
        }
    }
}
