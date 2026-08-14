# Set project directory
$projectDir = "D:\Users\fkami\OneDrive\Documents\Projects\quran-potd"
Set-Location $projectDir

# Set JAVA_HOME if not already set (ensuring compatibility with Gradle)
if (-not $env:JAVA_HOME) {
    $env:JAVA_HOME = "D:\Program Files\Android\Android Studio\jbr"
}

Write-Host "Using JAVA_HOME: $env:JAVA_HOME" -ForegroundColor Green

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

Write-Host "`n[1/3] Syncing Capacitor assets to Android..." -ForegroundColor Cyan
npx cap sync android

if ($LASTEXITCODE -ne 0) {
    Write-Error "Capacitor sync failed!"
    exit 1
}

Write-Host "Resolving symbolic links for Windows Gradle compatibility..." -ForegroundColor Yellow
$topLevelItems = Get-ChildItem -Path "$projectDir\android\app\src\main\assets\public"
foreach ($item in $topLevelItems) {
    if ($item.Name -eq "cordova.js" -or $item.Name -eq "cordova_plugins.js") {
        continue
    }
    if ($item.Attributes -match 'ReparsePoint') {
        $destPath = $item.FullName
        $srcPath = "$projectDir\public\$($item.Name)"
        if (Test-Path $srcPath) {
            Remove-Item -Path $destPath -Force -Recurse
            Copy-Item -Path $srcPath -Destination $destPath -Recurse -Force
            Write-Host "Replaced symlink: $($item.Name) with actual copy" -ForegroundColor Gray
        }
    }
}

Remove-Item -Path "$projectDir\android\app\src\main\assets\public\cordova.js" -Force -ErrorAction SilentlyContinue
Copy-Item -Path "$projectDir\node_modules\@capacitor\core\cordova.js" -Destination "$projectDir\android\app\src\main\assets\public\cordova.js"
Remove-Item -Path "$projectDir\android\app\src\main\assets\public\cordova_plugins.js" -Force -ErrorAction SilentlyContinue
New-Item -Path "$projectDir\android\app\src\main\assets\public\cordova_plugins.js" -ItemType File -Value "" -Force

Write-Host "`n[2/3] Navigating to Android project..." -ForegroundColor Cyan
Set-Location "$projectDir\android"

Write-Host "`n[3/3] Compiling Android App Bundle (AAB) for HMS..." -ForegroundColor Cyan
.\gradlew.bat clean bundleHmsRelease

if ($LASTEXITCODE -ne 0) {
    Write-Error "Gradle build failed!"
    exit 1
}

if ($null -eq $newVersionCode) {
    $gradleContent = Get-Content -Path "$projectDir\android\app\build.gradle" -Raw
    if ($gradleContent -match 'versionCode\s+(\d+)') {
        $newVersionCode = $Matches[1]
    }
}

$sourceAab = "$projectDir\android\app\build\outputs\bundle\hmsRelease\app-hms-release.aab"
$targetAab = "$projectDir\android\app\build\outputs\bundle\hmsRelease\app-hms-release-v$newVersionCode.aab"
if (Test-Path $sourceAab) {
    Copy-Item -Path $sourceAab -Destination $targetAab -Force
}

Write-Host "`n==========================================" -ForegroundColor Green
Write-Host "Build Succeeded!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host "Generated AAB (App Bundle) file is located at:" -ForegroundColor Yellow
Write-Host " - HMS Release: android\app\build\outputs\bundle\hmsRelease\app-hms-release-v$newVersionCode.aab"
Write-Host " - (Original):  android\app\build\outputs\bundle\hmsRelease\app-hms-release.aab"
Write-Host "`nNote: If you need to build local APKs instead of AABs, you can run:" -ForegroundColor Cyan
Write-Host "  .\gradlew.bat assembleHmsRelease"
