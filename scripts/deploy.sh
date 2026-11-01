#!/bin/bash
# Blue-green deploy on a single EC2 host.
# Two ports alternate: 3000 <-> 3001. Nginx (port 80) points to the ACTIVE one.
# Usage: bash -s -- <ECR_REGISTRY> <ECR_REPO> <IMAGE_TAG> <AWS_REGION>
set -euo pipefail

ECR_REGISTRY="$1"
ECR_REPO="$2"
IMAGE_TAG="$3"
AWS_REGION="$4"
NGINX_CONF="/etc/nginx/sites-available/aqsa-kitchens"

echo "=== Blue-Green deploy: ${ECR_REPO}:${IMAGE_TAG} ==="

# 1) Which port is live right now?
ACTIVE_PORT=$(grep -oE 'localhost:(3000|3001)' "$NGINX_CONF" | head -1 | cut -d: -f2 || true)
ACTIVE_PORT=${ACTIVE_PORT:-3000}
if [ "$ACTIVE_PORT" = "3000" ]; then NEW_PORT=3001; else NEW_PORT=3000; fi
echo "Active (blue) port: ${ACTIVE_PORT}  ->  New (green) port: ${NEW_PORT}"

# 2) Pull the new image
aws ecr get-login-password --region "$AWS_REGION" | \
  docker login --username AWS --password-stdin "$ECR_REGISTRY"
docker pull "${ECR_REPO}:${IMAGE_TAG}"

# 3) Start green on the idle port
docker rm -f "aqsa-${NEW_PORT}" 2>/dev/null || true
docker run -d \
  --name "aqsa-${NEW_PORT}" \
  -p "${NEW_PORT}:3000" \
  -e NODE_ENV=production \
  -e PORT=3000 \
  -e APP_VERSION="${IMAGE_TAG}" \
  --restart unless-stopped \
  "${ECR_REPO}:${IMAGE_TAG}"

# 4) Health-check green (up to ~30s). If it fails, blue keeps serving = automatic rollback.
HEALTHY=0
for i in $(seq 1 10); do
  if curl -sf "http://localhost:${NEW_PORT}/health" | grep -q '"status":"healthy"'; then
    HEALTHY=1; break
  fi
  echo "Waiting for green to become healthy (${i}/10)..."
  sleep 3
done
if [ "$HEALTHY" -ne 1 ]; then
  echo "ERROR: green failed health check. Rolling back (blue untouched)."
  docker logs --tail 50 "aqsa-${NEW_PORT}" || true
  docker rm -f "aqsa-${NEW_PORT}" || true
  exit 1
fi
echo "Green is healthy."

# 5) Switch nginx traffic to green
sudo sed -i "s/localhost:${ACTIVE_PORT}/localhost:${NEW_PORT}/g" "$NGINX_CONF"
sudo nginx -t
sudo systemctl reload nginx
echo "Traffic switched to port ${NEW_PORT}."

# 6) Retire blue (small grace period for in-flight requests)
sleep 5
docker rm -f "aqsa-${ACTIVE_PORT}" 2>/dev/null || true
docker rm -f aqsa-blue 2>/dev/null || true   # legacy name from first boot
docker image prune -f >/dev/null

echo "=== Deploy complete. Live on port ${NEW_PORT}, tag ${IMAGE_TAG} ==="
