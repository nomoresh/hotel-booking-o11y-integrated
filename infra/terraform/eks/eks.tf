module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "21.24.0"

  name               = local.cluster_name
  kubernetes_version = local.kubernetes_version

  # Windows와 Mac에서 kubectl로 접근
  endpoint_public_access  = true
  endpoint_private_access = true

  endpoint_public_access_cidrs = [
    "0.0.0.0/0"
  ]

  # Terraform을 실행한 사용자가 클러스터 관리자로 등록
  enable_cluster_creator_admin_permissions = true

  # AmazonEKSAdminPolicy, AmazonEKSClusterAdminPolicy
  access_entries = {
    sujeong = {
      principal_arn = "arn:aws:iam::074467724762:user/sujeong"

      policy_associations = {
        cluster_admin = {
          policy_arn = "arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy"

          access_scope = {
            type = "cluster"
          }
        }
      }
    }
    jongyeon = {
      principal_arn = "arn:aws:iam::074467724762:user/jongyeon"

      policy_associations = {
        cluster_admin = {
          policy_arn = "arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy"

          access_scope = {
            type = "cluster"
          }
        }
      }
    }
  }

  # 현재는 서비스 계정용 IAM 연동을 사용하지 않음
  enable_irsa = false

  # terraform destroy 허용
  deletion_protection = false

  # 비용 절감을 위한 현재 단계 설정
  enabled_log_types           = []
  create_cloudwatch_log_group = false

  encryption_config        = null
  create_kms_key           = false
  attach_encryption_policy = false

  # 기존 VPC와 서브넷 사용
  vpc_id     = local.selected_vpc_id
  subnet_ids = local.subnet_ids

  addons = {
    coredns = {}

    kube-proxy = {}

    vpc-cni = {
      before_compute = true
    }
  }

  eks_managed_node_groups = {
    nomoresh_node_group = {
      name            = "nomoreshNodeGroup"
      use_name_prefix = false

      kubernetes_version = local.kubernetes_version
      subnet_ids         = local.subnet_ids

      # 화면의 Amazon Linux 2023 x86_64 Standard
      ami_type = "AL2023_x86_64_STANDARD"

      # 매번 생성할 때 사용 가능한 최신 1.36 호환 AMI 사용
      use_latest_ami_release_version = true

      # 화면의 On-Demand
      capacity_type = "ON_DEMAND"

      # 화면의 t3.medium
      instance_types = [
        "t3.medium"
      ]

      # 화면의 노드 크기
      desired_size = 3
      min_size     = 1
      max_size     = 4

      # EKS 기본 Launch Template을 사용해야 disk_size가 적용됨
      create_launch_template     = false
      use_custom_launch_template = false

      # 화면의 20 GiB
      disk_size = 20

      # 기존 nomoreshNodeRole 사용
      create_iam_role = false
      iam_role_arn    = local.node_role_arn

      # 한 번에 최대 노드 1개씩 업데이트
      update_config = {
        max_unavailable = 1
      }

      tags = local.common_tags
    }
  }

  tags = local.common_tags
}