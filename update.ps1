# Set project directory
$projectDir = "D:\Users\fkami\OneDrive\Documents\Projects\quran-potd"
Set-Location $projectDir

# Check status
Write-Host "Checking git status..." -ForegroundColor Cyan
git status

# Ask for commit message
$commitMsg = Read-Host "`nEnter commit message (press Enter for default 'Automated update')"
if ([string]::IsNullOrWhiteSpace($commitMsg)) {
    $commitMsg = "Automated update"
}

# Add, commit, and push
Write-Host "`nStaging changes..." -ForegroundColor Yellow
git add .

Write-Host "Committing changes..." -ForegroundColor Yellow
git commit -m "$commitMsg"

Write-Host "Pushing to GitHub..." -ForegroundColor Green
git push origin main