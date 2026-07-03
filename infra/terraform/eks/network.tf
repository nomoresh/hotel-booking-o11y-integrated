data "aws_subnet" "selected" {
  for_each = toset(local.subnet_ids)

  id = each.value
}

locals {
  selected_vpc_ids = distinct([
    for subnet in data.aws_subnet.selected : subnet.vpc_id
  ])

  selected_vpc_id = one(local.selected_vpc_ids)
}