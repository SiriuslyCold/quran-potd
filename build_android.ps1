# Set project directory
$projectDir = "D:\Users\fkami\OneDrive\Documents\Projects\quran-potd"
Set-Location $projectDir

# Set JAVA_HOME if not already set (ensuring compatibility with Gradle)
if (-not $env:JAVA_HOME) {
    $env:JAVA_HOME = "D:\Program Files\Android\Android Studio\jbr"
}

Write-Host "Using JAVA_HOME: $env:JAVA_HOME" -ForegroundColor Green

# Auto-increment versionCode in build.gradle
$gradlePath = "$projectDir\android\app\build.gradle"
if (Test-Path $gradlePath) {
    $content = Get-Content -Path $gradlePath -Raw
    if ($content -match 'versionCode\s+(\d+)') {
        $oldVersionCode = $Matches[1]
        $newVersionCode = [int]$oldVersionCode + 1
        $content = $content -replace "versionCode\s+$oldVersionCode", "versionCode $newVersionCode"
        [System.IO.File]::WriteAllText($gradlePath, $content)
        Write-Host "Auto-incremented build number (versionCode) from $oldVersionCode to $newVersionCode" -ForegroundColor Green
    } else {
        Write-Warning "Could not parse 'versionCode' in $gradlePath"
    }
} else {
    Write-Warning "Could not find build.gradle at $gradlePath"
}

Write-Host "`n[1/3] Syncing Capacitor assets to Android..." -ForegroundColor Cyan
npx cap sync android

if ($LASTEXITCODE -ne 0) {
    Write-Error "Capacitor sync failed!"
    exit 1
}

Write-Host "`n[2/3] Navigating to Android project..." -ForegroundColor Cyan
Set-Location "$projectDir\android"

Write-Host "`n[3/3] Compiling Android App Bundle (AAB) for GMS..." -ForegroundColor Cyan
.\gradlew.bat clean bundleGmsRelease

if ($LASTEXITCODE -ne 0) {
    Write-Error "Gradle build failed!"
    exit 1
}

Write-Host "`n==========================================" -ForegroundColor Green
Write-Host "Build Succeeded!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host "Generated AAB (App Bundle) file is located at:" -ForegroundColor Yellow
Write-Host " - GMS Release: android\app\build\outputs\bundle\gmsRelease\app-gms-release.aab"
Write-Host "`nNote: If you need to build local APKs instead of AABs, you can run:" -ForegroundColor Cyan
Write-Host "  .\gradlew.bat assembleGmsRelease"
