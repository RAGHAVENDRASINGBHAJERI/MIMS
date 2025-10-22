#!/bin/bash

# AssetFlow Deployment Script

echo "Starting AssetFlow deployment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js v18 or higher."
    exit 1
fi

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "Warning: MongoDB doesn't appear to be running. Please start MongoDB service."
fi

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
npm install --production

# Install frontend dependencies and build
echo "Installing frontend dependencies and building..."
cd ../frontend
npm install
npm run build

# Go back to root
cd ..

# Copy production environment file if it doesn't exist
if [ ! -f "backend/config.env" ]; then
    echo "Creating production environment file..."
    cp backend/config.env.production backend/config.env
    echo "Please edit backend/config.env with your production settings."
fi

# Seed database (optional)
read -p "Do you want to seed the database with initial data? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Seeding database..."
    cd backend
    node seedDepartments.js
    node seedUsers.js
    cd ..
fi

echo "Deployment completed!"
echo ""
echo "Next steps:"
echo "1. Edit backend/config.env with your production settings"
echo "2. Configure your web server to serve frontend/dist/ and proxy /api to backend"
echo "3. Start the backend server: cd backend && npm start"
echo ""
echo "Default admin credentials:"
echo "Email: admin@example.com"
echo "Password: admin123"
echo "Please change these credentials after first login!"