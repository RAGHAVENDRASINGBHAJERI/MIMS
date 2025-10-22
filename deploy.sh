#!/bin/bash

echo "🚀 Deploying AssetFlow Stream..."

# Build and start services
docker-compose up -d --build

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 30

# Seed database
echo "🌱 Seeding database..."
docker exec assetflow-backend node seedDepartments.js
docker exec assetflow-backend node seedUsers.js

echo "✅ Deployment complete!"
echo "🌐 Frontend: http://localhost"
echo "🔧 Backend API: http://localhost:5000/api"
echo "📊 Admin Login: admin@example.com / admin123"