# PowerShell script to create and seed the MongoDB database using Node.js seed scripts

# Change to backend directory
Set-Location -Path ".\backend"

# Run seedDepartments.js
Write-Host "Seeding departments..."
node seedDepartments.js

# Run seedUsers.js
Write-Host "Seeding users..."
node seedUsers.js

# Run seedAssets.js
Write-Host "Seeding assets..."
node seedAssets.js

Write-Host "Database creation and seeding completed."
