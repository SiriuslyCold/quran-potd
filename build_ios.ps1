param (
    [switch]$NoPush
)

# Set project directory
$projectDir = "D:\Users\fkami\OneDrive\Documents\Projects\quran-potd"
Set-Location $projectDir

# Auto-increment Android versionCode and sync iOS CURRENT_PROJECT_VERSION
$gradlePath = "$projectDir\android\app\build.gradle"
$newVersionCode = $null
if (Test-Path $gradlePath) {
    $content = Get-Content -Path $gradlePath -Raw
    if ($content -match 'versionCode\s+(\d+)') {
        $oldAndroidVersion = $Matches[1]
        $newVersionCode = [int]$oldAndroidVersion + 1
        $content = $content -replace "versionCode\s+$oldAndroidVersion", "versionCode $newVersionCode"
        [System.IO.File]::WriteAllText($gradlePath, $content)
        Write-Host "Auto-incremented Android build number (versionCode) to $newVersionCode" -ForegroundColor Green
    } else {
        Write-Warning "Could not parse 'versionCode' in $gradlePath"
    }
} else {
    Write-Warning "Could not find build.gradle at $gradlePath"
}

if ($newVersionCode) {
    $pbxprojPath = "$projectDir\ios\App\App.xcodeproj\project.pbxproj"
    if (Test-Path $pbxprojPath) {
        $content = Get-Content -Path $pbxprojPath -Raw
        if ($content -match 'CURRENT_PROJECT_VERSION\s*=\s*(\d+);') {
            $oldIosVersion = $Matches[1]
            $content = $content -replace "CURRENT_PROJECT_VERSION\s*=\s*$oldIosVersion;", "CURRENT_PROJECT_VERSION = $newVersionCode;"
            [System.IO.File]::WriteAllText($pbxprojPath, $content)
            Write-Host "Synchronized iOS build number (CURRENT_PROJECT_VERSION) from $oldIosVersion to $newVersionCode" -ForegroundColor Green
        } else {
            Write-Warning "Could not parse CURRENT_PROJECT_VERSION in $pbxprojPath"
        }
    } else {
        Write-Warning "Could not find project.pbxproj at $pbxprojPath"
    }
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
    git add ios/App/App.xcodeproj/project.pbxproj android/app/build.gradle
    git commit -m "chore: bump build number to $newVersionCode"
    
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
