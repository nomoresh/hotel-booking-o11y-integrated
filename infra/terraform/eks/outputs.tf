output "cluster_name" {
  description = "EKS 클러스터 이름"
  value       = module.eks.cluster_name
}

output "cluster_endpoint" {
  description = "EKS API Endpoint"
  value       = module.eks.cluster_endpoint
}

output "vpc_id" {
  description = "기존 VPC ID"
  value       = local.selected_vpc_id
}

output "subnet_ids" {
  description = "노드 그룹에서 사용하는 기존 서브넷"
  value       = local.subnet_ids
}

output "node_group_name" {
  description = "관리형 노드 그룹 이름"

  value = split(
    ":",
    module.eks.eks_managed_node_groups["nomoresh_node_group"].node_group_id
  )[1]
}

output "update_kubeconfig_command" {
  description = "kubeconfig 갱신 명령어"

  value = "aws eks update-kubeconfig --region ${local.region} --name ${local.cluster_name} --profile ${local.aws_profile}"
}