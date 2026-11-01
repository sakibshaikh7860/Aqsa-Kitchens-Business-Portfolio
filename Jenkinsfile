pipeline {
    agent any

    environment {
        APP_NAME       = 'aqsa-kitchens'
        AWS_REGION     = 'ap-south-1'
        // AWS_ACCOUNT_ID is set in: Manage Jenkins > System > Global properties
        ECR_REGISTRY   = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
        ECR_REPO       = "${ECR_REGISTRY}/${APP_NAME}"
        IMAGE_TAG      = "${BUILD_NUMBER}"
        EC2_USER       = 'ubuntu'
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 30, unit: 'MINUTES')
        disableConcurrentBuilds()
    }

    parameters {
        booleanParam(name: 'REQUIRE_APPROVAL', defaultValue: false,
                     description: 'Pause for manual approval before production deploy')
    }

    triggers {
        // Fallback if no webhook: poll GitHub every 2 minutes
        pollSCM('H/2 * * * *')
    }

    stages {

        stage('Checkout') {
            steps {
                echo 'Checking out code from GitHub...'
                checkout scm
                sh 'git log --oneline -5'
            }
        }

        stage('Install Dependencies') {
            steps {
                sh '''
                    node --version
                    npm --version
                    npm ci
                '''
            }
        }

        stage('Test') {
            steps {
                sh 'npm run test:ci'
            }
            post {
                always {
                    publishHTML(target: [
                        allowMissing         : true,
                        alwaysLinkToLastBuild: true,
                        keepAll              : true,
                        reportDir            : 'coverage/lcov-report',
                        reportFiles          : 'index.html',
                        reportName           : 'Test Coverage Report'
                    ])
                }
            }
        }

        stage('Docker Build') {
            steps {
                sh """
                    docker build \
                        --build-arg APP_VERSION=${IMAGE_TAG} \
                        -t ${APP_NAME}:${IMAGE_TAG} .
                """
            }
        }

        stage('Push to ECR') {
            steps {
                withCredentials([[
                    $class           : 'AmazonWebServicesCredentialsBinding',
                    credentialsId    : 'aws-credentials',
                    accessKeyVariable: 'AWS_ACCESS_KEY_ID',
                    secretKeyVariable: 'AWS_SECRET_ACCESS_KEY'
                ]]) {
                    sh """
                        aws ecr get-login-password --region ${AWS_REGION} | \
                            docker login --username AWS --password-stdin ${ECR_REGISTRY}

                        docker tag ${APP_NAME}:${IMAGE_TAG} ${ECR_REPO}:${IMAGE_TAG}
                        docker tag ${APP_NAME}:${IMAGE_TAG} ${ECR_REPO}:latest
                        docker push ${ECR_REPO}:${IMAGE_TAG}
                        docker push ${ECR_REPO}:latest
                    """
                }
            }
        }

        // Works in BOTH a Multibranch job (BRANCH_NAME) and a plain Pipeline job (GIT_BRANCH)
        stage('Approve Production') {
            when {
                allOf {
                    expression { env.BRANCH_NAME == 'main' || env.GIT_BRANCH == 'origin/main' }
                    expression { params.REQUIRE_APPROVAL }
                }
            }
            steps {
                timeout(time: 15, unit: 'MINUTES') {
                    input message: 'Deploy this build to PRODUCTION?', ok: 'Deploy'
                }
            }
        }

        stage('Deploy to EC2 (Blue-Green)') {
            when {
                expression { env.BRANCH_NAME == 'main' || env.GIT_BRANCH == 'origin/main' }
            }
            steps {
                withCredentials([
                    sshUserPrivateKey(credentialsId: 'ec2-ssh-key', keyFileVariable: 'SSH_KEY'),
                    string(credentialsId: 'ec2-host', variable: 'EC2_HOST')
                ]) {
                    // deploy.sh is streamed over SSH, no scp and no Groovy-escaping headaches
                    sh '''
                        ssh -o StrictHostKeyChecking=no -i "$SSH_KEY" ${EC2_USER}@"$EC2_HOST" \
                            "bash -s -- '${ECR_REGISTRY}' '${ECR_REPO}' '${IMAGE_TAG}' '${AWS_REGION}'" \
                            < scripts/deploy.sh
                    '''
                }
            }
        }

        stage('Smoke Test') {
            when {
                expression { env.BRANCH_NAME == 'main' || env.GIT_BRANCH == 'origin/main' }
            }
            steps {
                withCredentials([string(credentialsId: 'ec2-host', variable: 'EC2_HOST')]) {
                    sh '''
                        sleep 5
                        curl -sf http://"$EC2_HOST"/health | grep -q '"status":"healthy"' \
                          && echo "Smoke test PASSED" \
                          || { echo "Smoke test FAILED"; exit 1; }
                    '''
                }
            }
        }
    }

    post {
        success { echo "Pipeline SUCCESS: ${APP_NAME} build #${BUILD_NUMBER}" }
        failure { echo "Pipeline FAILED: check the stage that turned red" }
        always  { sh "docker rmi ${APP_NAME}:${IMAGE_TAG} || true" }
    }
}
