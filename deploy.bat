@echo off
echo Starting AssetFlow deployment...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed. Please install Node.js v18 or higher.
    pause
    exit /b 1
)

REM Install backend dependencies
echo Installing backend dependencies...
cd backend
call npm install --production

REM Install frontend dependencies and build
echo Installing frontend dependencies and building...
cd ..\frontend
call npm install
call npm run build

REM Go back to root
cd ..

REM Copy production environment file if it doesn't exist
if not exist "backend\config.env" (
    echo Creating production environment file...
    copy "backend\config.env.production" "backend\config.env"
    echo Please edit backend\config.env with your production settings.
)

REM Ask about seeding database
set /p seed="Do you want to seed the database with initial data? (y/n): "
if /i "%seed%"=="y" (
    echo Seeding database...
    cd backend
    node seedDepartments.js
    node seedUsers.js
    cd ..
)

echo Deployment completed!
echo.
echo Next steps:
echo 1. Edit backend\config.env with your production settings
echo 2. Configure your web server to serve frontend\dist\ and proxy /api to backend
echo 3. Start the backend server: cd backend ^&^& npm start
echo.
echo Default admin credentials:
echo Email: admin@example.com
echo Password: admin123
echo Please change these credentials after first login!

pause