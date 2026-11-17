// Declarative pipeline: test -> build Docker image -> push to Docker Hub -> deploy to EC2
//
// Jenkins credentials needed (Manage Jenkins -> Credentials):
//   dockerhub-creds : Username with password  (Docker Hub username + access token)
//   ec2-ssh-key     : SSH Username with private key (username: ec2-user, key: your .pem)
//
// Plugins needed: Pipeline, Git, Docker Pipeline, SSH Agent

pipeline {
    agent any

    environment {
        DOCKERHUB_USER = 'your-dockerhub-username'      // <-- change this
        IMAGE_NAME     = "${DOCKERHUB_USER}/aws-devops-demo"
        IMAGE_TAG      = "${env.BUILD_NUMBER}"
        EC2_HOST       = 'your-app-server-public-ip'    // <-- change this
        EC2_USER       = 'ec2-user'
    }

    options {
        timestamps()
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 20, unit: 'MINUTES')
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install & Test') {
            // Run tests inside a Node container so the Jenkins server needs no Node install
            agent {
                docker {
                    image 'node:20-alpine'
                    reuseNode true
                }
            }
            steps {
                sh 'npm ci'
                sh 'npm test'
            }
        }

        stage('Build Image') {
            steps {
                sh "docker build -t ${IMAGE_NAME}:${IMAGE_TAG} -t ${IMAGE_NAME}:latest ."
            }
        }

        stage('Push Image') {
            when { branch 'main' }
            steps {
                withCredentials([usernamePassword(credentialsId: 'dockerhub-creds',
                                                  usernameVariable: 'DH_USER',
                                                  passwordVariable: 'DH_TOKEN')]) {
                    sh '''
                        echo "$DH_TOKEN" | docker login -u "$DH_USER" --password-stdin
                        docker push ${IMAGE_NAME}:${IMAGE_TAG}
                        docker push ${IMAGE_NAME}:latest
                        docker logout
                    '''
                }
            }
        }

        stage('Deploy to EC2') {
            when { branch 'main' }
            steps {
                sshagent(credentials: ['ec2-ssh-key']) {
                    sh """
                        ssh -o StrictHostKeyChecking=no ${EC2_USER}@${EC2_HOST} '
                            docker pull ${IMAGE_NAME}:${IMAGE_TAG} &&
                            docker rm -f web || true &&
                            docker run -d --name web --restart unless-stopped \
                                -p 80:3000 -e APP_VERSION=build-${IMAGE_TAG} \
                                ${IMAGE_NAME}:${IMAGE_TAG} &&
                            docker image prune -af --filter "until=72h"
                        '
                    """
                }
            }
        }

        stage('Smoke Test') {
            when { branch 'main' }
            steps {
                retry(10) {
                    sleep 5
                    sh "curl -fsS http://${EC2_HOST}/health"
                }
            }
        }
    }

    post {
        always {
            sh "docker rmi ${IMAGE_NAME}:${IMAGE_TAG} ${IMAGE_NAME}:latest || true"
        }
        success {
            echo "Deployed build ${IMAGE_TAG} to http://${EC2_HOST}"
        }
        failure {
            echo 'Pipeline failed - check the stage logs above.'
        }
    }
}
