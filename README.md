# Microservice Demo

This project demonstrates a microservice architecture with two services: `product-service` and `order-service`. Each service is built using NestJS and communicates with a PostgreSQL database. The services are containerized using Docker and orchestrated with Docker Compose.

## Table of Contents

- [API Endpoints](#api-endpoints)
  - [Product Service](#product-service)
  - [Order Service](#order-service)
- [Setup](#setup)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running the Services](#running-the-services)
  - [Running Tests](#running-tests)
- [Environment Variables](#environment-variables)

## API Endpoints

### Product Service

- **GET /products/all**: Retrieve all products.
- **GET /products/:id**: Retrieve a single product by ID.
- **POST /products/new**: Create a new product.
- **PUT /products/:id**: Update an existing product.
- **DELETE /products/:id**: Delete a product.
- **POST /products/decrease-quantity**: Decrease the quantity of a product.

### Order Service

- **GET /orders/all**: Retrieve all orders.
- **GET /orders/:id**: Retrieve a single order by ID.
- **POST /orders/new**: Place a new order.

## Setup

### Prerequisites

- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/install/)

### Installation

1. Clone the repository:

   ```sh
   git clone https://github.com/MohsinGhani/microservices-demo.git
   cd microservices-demo

   ```

2. Build the Docker images:
   ```sh
   docker-compose up -d
   ```
