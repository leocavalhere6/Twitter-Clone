variable "network_name" {
  description = "Rede Docker compartilhada da stack"
  type        = string
  default     = "twitter-clone-tf-net"
}

variable "postgres_db" {
  type    = string
  default = "local_db"
}

variable "postgres_user" {
  type    = string
  default = "local_user"
}

variable "postgres_password" {
  type      = string
  default   = "local_password"
  sensitive = true
}

variable "mongodb_database" {
  type    = string
  default = "twitter_clone"
}

variable "rabbitmq_user" {
  type    = string
  default = "guest"
}

variable "rabbitmq_password" {
  type      = string
  default   = "guest"
  sensitive = true
}