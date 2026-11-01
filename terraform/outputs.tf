output "ec2_public_ip"   { value = aws_eip.app.public_ip }
output "alb_dns_name"    { value = aws_lb.app.dns_name }
output "ecr_repo_url"    { value = aws_ecr_repository.app.repository_url }
output "app_url"         { value = "http://${aws_lb.app.dns_name}" }
