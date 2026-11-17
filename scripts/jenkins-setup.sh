#!/bin/bash
# User data for the JENKINS server (Amazon Linux 2023, t3.small or larger -
# Jenkins needs ~2 GB RAM, so t2.micro / t3.micro is too small).
# Installs Java 17, Jenkins, Docker and Git, and lets Jenkins run Docker.
set -e

dnf update -y
dnf install -y java-17-amazon-corretto git docker

# Jenkins LTS repo
wget -O /etc/yum.repos.d/jenkins.repo https://pkg.jenkins.io/redhat-stable/jenkins.repo
rpm --import https://pkg.jenkins.io/redhat-stable/jenkins.io-2023.key
dnf install -y jenkins

systemctl enable --now docker
usermod -aG docker jenkins
systemctl enable --now jenkins

# Initial admin password is printed by:
#   sudo cat /var/lib/jenkins/secrets/initialAdminPassword
