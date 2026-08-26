pipeline {

    environment {
        registry = "jed.ocir.io/axakezgoe8qp/pm-portal-ui-app"
        registryCredential = 'OCIR'
        dockerImage = ''
    }
    agent any
    triggers { pollSCM '* * * * *' }
    stages {
        stage('Building image') {
            steps{
                script {
                    dockerImage = docker.build(registry + ":${BUILD_NUMBER}","--build-arg VERSION=${BUILD_NUMBER} .")
                }
            }
        }
        stage('Push to OCIR') {
            steps {
                script {
                    docker.withRegistry( 'https://jed.ocir.io', registryCredential ) {
                    dockerImage.push()
                    }
                }
            }
        }
        stage('Cleanup') {
            steps{
                sh "docker rmi $registry:$BUILD_NUMBER"
            }
        }
        stage ('UpdateTagJob') {
            steps{
                build job: 'wisla-update-tag-job', parameters: [string(name: 'PROJECT', value: 'pm-portal-ui-app'), string(name: 'IMAGE', value: 'pm-portal-ui-app'), string(name: 'TAG', value: "${env.BUILD_NUMBER}")]
            }
        }
    }
}
