#!/bin/bash

# Test script to verify standalone deployment configuration

echo "Testing standalone deployment configuration..."

# Set the port
export ROWT_PORT=3000

echo "ROWT_PORT is set to: $ROWT_PORT"

# Show what the merged configuration would look like
echo ""
echo "=== Merged Docker Compose Configuration ==="
docker-compose -f docker-compose.yml -f docker-compose.standalone.yml config

echo ""
echo "=== Checking port configuration for rowt-server ==="
docker-compose -f docker-compose.yml -f docker-compose.standalone.yml config | grep -A 10 -B 5 "ports:"

echo ""
echo "=== To deploy with this configuration, run: ==="
echo "ROWT_PORT=$ROWT_PORT docker-compose -f docker-compose.yml -f docker-compose.standalone.yml up -d"
