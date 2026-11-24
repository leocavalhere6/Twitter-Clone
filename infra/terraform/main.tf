terraform {
  required_version = ">= 1.5.0"

  required_providers {
    docker = {
      source  = "kreuzwerker/docker"
      version = "~> 3.0"
    }
  }
}

provider "docker" {}

resource "docker_network" "twitter_clone" {
  name = var.network_name
}

resource "docker_image" "postgres" {
  name         = "pgvector/pgvector:pg16"
  keep_locally = true
}

resource "docker_container" "database" {
  name  = "tf-postgres-dev"
  image = docker_image.postgres.image_id

  env = [
    "POSTGRES_DB=${var.postgres_db}",
    "POSTGRES_USER=${var.postgres_user}",
    "POSTGRES_PASSWORD=${var.postgres_password}"
  ]

  ports {
    internal = 5432
    external = 5432
  }

  networks_advanced {
    name = docker_network.twitter_clone.name
  }
}

resource "docker_image" "redis" {
  name         = "redis:7-alpine"
  keep_locally = true
}

resource "docker_container" "cache" {
  name  = "tf-redis-dev"
  image = docker_image.redis.image_id

  ports {
    internal = 6379
    external = 6379
  }

  networks_advanced {
    name = docker_network.twitter_clone.name
  }
}

resource "docker_image" "mailpit" {
  name         = "axllent/mailpit:v1.21"
  keep_locally = true
}

resource "docker_container" "mail" {
  name  = "tf-mailpit-dev"
  image = docker_image.mailpit.image_id

  ports {
    internal = 1025
    external = 1025
  }

  ports {
    internal = 8025
    external = 8025
  }

  networks_advanced {
    name = docker_network.twitter_clone.name
  }
}

resource "docker_image" "rabbitmq" {
  name         = "rabbitmq:3.13-management-alpine"
  keep_locally = true
}

resource "docker_container" "messaging" {
  name  = "tf-rabbitmq-dev"
  image = docker_image.rabbitmq.image_id

  env = [
    "RABBITMQ_DEFAULT_USER=${var.rabbitmq_user}",
    "RABBITMQ_DEFAULT_PASS=${var.rabbitmq_password}"
  ]

  ports {
    internal = 5672
    external = 5672
  }

  ports {
    internal = 15672
    external = 15672
  }

  networks_advanced {
    name = docker_network.twitter_clone.name
  }
}

resource "docker_image" "mongodb" {
  name         = "mongo:7"
  keep_locally = true
}

resource "docker_container" "documentdb" {
  name  = "tf-mongodb-dev"
  image = docker_image.mongodb.image_id

  env = [
    "MONGO_INITDB_DATABASE=${var.mongodb_database}"
  ]

  ports {
    internal = 27017
    external = 27017
  }

  networks_advanced {
    name = docker_network.twitter_clone.name
  }
}