variable "aws_region"    { default = "ap-south-1" }
variable "environment"   { default = "production" }
variable "project_name"  { default = "aqsa-kitchens" }
variable "vpc_cidr"      { default = "10.0.0.0/16" }
variable "instance_type" { default = "t3.micro" }   # Free Tier eligible
variable "key_pair_name" { description = "EC2 Key Pair name for SSH" }
variable "jenkins_ip"    { description = "Jenkins server IP/CIDR for SSH access" }
variable "alert_email"   { description = "Email for CloudWatch alarm notifications" }
