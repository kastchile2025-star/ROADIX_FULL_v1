#!/bin/bash
set -e

# Build React frontend
cd frontend
npm install --include=dev
npm run build
cd ..

# Prepare output directory
mkdir -p dist/app

# Copy frontend build to /app/
cp -r frontend/dist/* dist/app/

# Copy WEB landing page to root
cp -r web/* dist/
