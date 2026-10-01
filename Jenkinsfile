pipeline {

    agent any

    environment {

        // Docker Hub repository
        DOCKER_IMAGE = 'illuriganesh123/civicpulse-frontend'

        // Jenkins Docker Hub credential ID
        DOCKER_CREDENTIALS = 'dockerhub-civicpulse'

        // Frontend API URL
        API_BASE_URL = 'http://localhost:8089'

        // Trivy location on your Mac
        PATH = "/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
    }

    stages {

        stage('Checkout') {
            steps {
                echo 'Checking out frontend source code...'

                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                echo 'Installing frontend dependencies...'

                sh 'npm ci'
            }
        }

        stage('Lint') {
            steps {
                echo 'Running ESLint...'

                sh 'npm run lint'
            }
        }

        stage('Build React Application') {
            steps {
                echo 'Building React/Vite application...'

                sh 'npm run build'
            }
        }

        stage('Trivy Secret Scan') {
            steps {
                echo 'Scanning source code for secrets...'

                sh '''
                    trivy fs \
                    --scanners secret \
                    --exit-code 1 \
                    --severity HIGH,CRITICAL \
                    .
                '''
            }
        }

        stage('Docker Build') {
            steps {
                echo 'Building frontend Docker image...'

                sh """
                    docker build \
                    --build-arg VITE_API_BASE_URL=${API_BASE_URL} \
                    -t ${DOCKER_IMAGE}:${BUILD_NUMBER} .
                """
            }
        }

        stage('Trivy Image Scan') {
            steps {
                echo 'Scanning Docker image for vulnerabilities...'

                sh """
                    trivy image \
                    --timeout 15m \
                    --severity HIGH,CRITICAL \
                    ${DOCKER_IMAGE}:${BUILD_NUMBER}
                """
            }
        }

        stage('Push Docker Image') {
            steps {

                echo 'Pushing Docker image to Docker Hub...'

                withCredentials([
                    usernamePassword(
                        credentialsId: "${DOCKER_CREDENTIALS}",
                        usernameVariable: 'DOCKER_USERNAME',
                        passwordVariable: 'DOCKER_PASSWORD'
                    )
                ]) {

                    sh '''
                        echo "$DOCKER_PASSWORD" | \
                        docker login \
                        -u "$DOCKER_USERNAME" \
                        --password-stdin

                        docker push ${DOCKER_IMAGE}:${BUILD_NUMBER}

                        docker logout
                    '''
                }
            }
        }
    }

    post {

        success {
            echo """
            ==========================================
            FRONTEND CI PIPELINE SUCCESSFUL
            ==========================================

            Docker Image:
            ${DOCKER_IMAGE}:${BUILD_NUMBER}

            ==========================================
            """
        }

        failure {
            echo """
            ==========================================
            FRONTEND CI PIPELINE FAILED
            ==========================================
            """
        }

        always {
            sh '''
                docker image prune -f || true
            '''
        }
    }
}