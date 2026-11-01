# Aqsa Kitchen's - Node.js Website with an End-to-End DevOps Pipeline

A business website for **Aqsa Kitchen's**, a kitchen trolley and kitchen furniture maker. Visitors can browse products and send enquiries. The project is built and deployed through a fully automated CI/CD pipeline on AWS.

**Stack:** Node.js, Express, EJS | Docker | GitHub | Jenkins | Amazon ECR | Amazon EC2 + ALB | Terraform | CloudWatch + SNS

---

## Architecture

```
Developer
   |  git push
   v
GitHub  --->  Jenkins (Multibranch Pipeline)
                 1. Checkout
                 2. npm ci
                 3. Test (Jest + Supertest, coverage report)
                 4. Docker build (multi-stage)
                 5. Push image to Amazon ECR
                 6. (optional) Manual approval
                 7. Blue-green deploy to EC2 over SSH
                 8. Smoke test (/health)

AWS (provisioned with Terraform)

  Internet --> ALB (port 80) --> EC2 (nginx, port 80)
                                      |
                           +----------+----------+
                           |                     |
                  container :3000          container :3001
                  (blue or green)          (green or blue)

  ECR            private Docker registry (scan on push, keeps last 10 images)
  IAM            EC2 role: ECR read-only, SSM core, CloudWatch agent
  CloudWatch     alarms: CPU > 80%, unhealthy ALB targets
  SNS            email notifications for the alarms
  SSM            Parameter Store holds non-secret app config
```

## How the blue-green deployment works

Two ports alternate on the EC2 host: 3000 and 3001. Nginx on port 80 always proxies to the active one.

1. `scripts/deploy.sh` reads the nginx config to find the live port (blue).
2. It starts the new image on the idle port (green).
3. It polls `/health` on green for up to 30 seconds. If green never becomes healthy, the script removes it and exits with an error. Blue keeps serving, so a bad release never receives traffic.
4. If green is healthy, nginx is switched to green and reloaded.
5. After a short grace period the old container is removed.

---

## Project structure

```
aqsa-kitchens/
|-- src/
|   |-- app.js                Express app (helmet, compression, rate limiting, /health)
|   `-- routes/
|       |-- pages.js          Page routes and product data
|       `-- api.js            POST /api/enquiry, GET /api/products, GET /api/status
|-- views/                    EJS templates (home, products, about, contact, 404, partials)
|-- public/                   Static assets (css, js)
|-- __tests__/app.test.js     Jest + Supertest test suite (10 tests)
|-- scripts/deploy.sh         Blue-green deploy script, executed on the EC2 host
|-- terraform/                Infrastructure as code
|   |-- main.tf               VPC, EC2, ALB, ECR, IAM, CloudWatch, SNS, SSM
|   |-- variables.tf
|   |-- outputs.tf
|   `-- user_data.sh          EC2 bootstrap: Docker, AWS CLI, nginx
|-- Dockerfile                Multi-stage build, Node 18 Alpine, non-root user, healthcheck
|-- Jenkinsfile               Declarative CI/CD pipeline
`-- package.json
```

---

## Run locally

```bash
npm ci
cp .env.example .env
npm run dev          # http://localhost:3000
npm test             # run the test suite
```

With Docker:

```bash
docker build -t aqsa-kitchens .
docker run -d -p 3000:3000 --name aqsa-app aqsa-kitchens
curl http://localhost:3000/health
```

## Endpoints

| Method | Path            | Description                                 |
|--------|-----------------|---------------------------------------------|
| GET    | `/`             | Home page                                   |
| GET    | `/products`     | Product catalogue (`?category=trolley`)     |
| GET    | `/about`        | About page                                  |
| GET    | `/contact`      | Enquiry form                                |
| GET    | `/health`       | Health check used by Docker, ALB and Jenkins|
| GET    | `/api/products` | Products as JSON                            |
| POST   | `/api/enquiry`  | Submit an enquiry (validated and rate limited) |

---

## Deploy to AWS

### 1. Provision infrastructure with Terraform

Prerequisites: AWS CLI configured for `ap-south-1`, and an EC2 key pair.

```bash
cd terraform
cat > terraform.tfvars << 'TFVARS'
key_pair_name = "your-key-pair"
jenkins_ip    = "YOUR_PUBLIC_IP/32"
alert_email   = "you@example.com"
TFVARS

terraform init
terraform validate
terraform plan
terraform apply
terraform output
```

The S3 remote backend in `main.tf` is commented out so the first run works without extra setup. To enable it, create the S3 bucket and a DynamoDB lock table (partition key `LockID`), uncomment the block, then run `terraform init -migrate-state`.

### 2. Configure Jenkins

Plugins: Git, Pipeline, Docker Pipeline, AWS Credentials, SSH Agent, HTML Publisher.

Jenkins host requirements: Docker, Node.js 18, AWS CLI v2, and the `jenkins` user in the `docker` group.

Credentials (Manage Jenkins > Credentials):

| ID                | Type                          | Value                                   |
|-------------------|-------------------------------|-----------------------------------------|
| `aws-credentials` | AWS Credentials               | IAM user with ECR PowerUser permissions |
| `ec2-ssh-key`     | SSH Username with private key | user `ubuntu` and the `.pem` key        |
| `ec2-host`        | Secret text                   | EC2 public IP from `terraform output`   |

Global environment variable: `AWS_ACCOUNT_ID` (Manage Jenkins > System).

Create a **Multibranch Pipeline** job that points at this repository.

### 3. Release

Push to `main`. Jenkins builds, tests, publishes the image to ECR and performs the blue-green deploy. To require a human approval before production, run the job with **Build with Parameters** and tick `REQUIRE_APPROVAL`.

### 4. Clean up

The ALB is not covered by the AWS free tier. Remove everything when you are done experimenting:

```bash
cd terraform && terraform destroy
```

---

## Security notes

- No secrets are stored in the repository. Credentials live in the Jenkins credential store; `.env`, `*.tfstate` and `terraform.tfvars` are git-ignored.
- The container runs as a non-root user. Helmet sets secure HTTP headers and the API is rate limited.
- SSH access to the EC2 instance is restricted to a single CIDR (`jenkins_ip`).
- ECR image scanning on push is enabled.
- The Jenkins IAM user only has ECR push permissions.

## Possible next steps

- HTTPS with AWS Certificate Manager and an HTTPS listener on the ALB
- Custom domain with Route 53
- Terraform remote state in S3 with DynamoDB locking
- Read configuration from SSM Parameter Store at startup and store real secrets in Secrets Manager
- Send enquiries by email with Amazon SES instead of logging them
- Move from a single EC2 host to ECS or EKS for multi-instance deployments

---

## Author

Sakib Shaikh
