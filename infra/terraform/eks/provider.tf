locals {
  cluster_name       = "nomoresh"
  kubernetes_version = "1.36"
  region             = "ap-northeast-2"
  aws_profile        = "nomoresh"

  node_role_arn = "arn:aws:iam::074467724762:role/nomoreshNodeRole"

  subnet_ids = [
    "subnet-0eb0c6b613b655798",
    "subnet-00e60ea646d68276b",
    "subnet-0525c8030ab3d3d23",
    "subnet-029d6e22a11ad9916"
  ]

  common_tags = {
    Project     = "nomoresh"
    ManagedBy   = "terraform"
    Environment = "prod"
  }
}

provider "aws" {
  region  = local.region
  profile = local.aws_profile

  default_tags {
    tags = local.common_tags
  }
}