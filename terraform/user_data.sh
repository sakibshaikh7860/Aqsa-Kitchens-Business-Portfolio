#!/bin/bash
set -e

# -- Update system --------------------------------------------------------------
apt-get update -y
apt-get upgrade -y

# -- Install Docker -------------------------------------------------------------
apt-get install -y ca-certificates curl gnupg
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null
apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io
systemctl start docker
systemctl enable docker
usermod -aG docker ubuntu

# -- Install AWS CLI v2 --------------------------------------------------------
apt-get install -y unzip
curl -s "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip -q awscliv2.zip
./aws/install
rm -rf awscliv2.zip aws/

# -- Install Nginx (reverse proxy) ---------------------------------------------
apt-get install -y nginx
cat > /etc/nginx/sites-available/${app_name} << 'EOF'
server {
    listen 80;
    server_name _;
    client_max_body_size 10M;

    location / {
        proxy_pass         http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
    location /health { proxy_pass http://localhost:3000/health; }
}
EOF
ln -sf /etc/nginx/sites-available/${app_name} /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx
systemctl enable nginx

# -- Configure AWS region ------------------------------------------------------
mkdir -p /home/ubuntu/.aws
cat > /home/ubuntu/.aws/config << EOF
[default]
region = ${aws_region}
EOF
chown -R ubuntu:ubuntu /home/ubuntu/.aws

# -- Pull and run initial container (image may not exist yet on first boot) -----
aws ecr get-login-password --region ${aws_region} | \
    docker login --username AWS --password-stdin ${ecr_registry} || true
if docker pull ${ecr_registry}:latest; then
  docker run -d \
      --name aqsa-3000 \
      -p 3000:3000 \
      -e NODE_ENV=production \
      --restart unless-stopped \
      ${ecr_registry}:latest
else
  echo "No image in ECR yet - the first Jenkins deploy will start the container."
fi

echo "Aqsa Kitchen's server is ready!"
