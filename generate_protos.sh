#!/bin/bash

# Set the root directory of the script to ensure paths are correct
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROTO_DIR="${SCRIPT_DIR}/proto-definitions/proto"
API_GATEWAY_PRODUCT_DIR="${SCRIPT_DIR}/api-gateway/product"
API_GATEWAY_ORDER_DIR="${SCRIPT_DIR}/api-gateway/order"
GENERATED_TS_DIR="${SCRIPT_DIR}/proto-definitions/generated"

# Step 1: Install Go dependencies for protobuf generation and ts-proto for TypeScript generation
echo "Installing Go protobuf dependencies and ts-proto..."
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest
npm install --save-dev ts-proto

# Step 2: Add $GOPATH/bin and node_modules/.bin to PATH
export PATH=$PATH:$(go env GOPATH)/bin:${SCRIPT_DIR}/node_modules/.bin

# Step 3: Generate Go files for product.proto
echo "Generating Go files for product.proto..."
protoc --proto_path="${PROTO_DIR}" \
  --go_out=paths=source_relative:"${API_GATEWAY_PRODUCT_DIR}" \
  --go-grpc_out=paths=source_relative:"${API_GATEWAY_PRODUCT_DIR}" \
  "${PROTO_DIR}/product.proto"

# Step 4: Generate Go files for order.proto
echo "Generating Go files for order.proto..."
protoc --proto_path="${PROTO_DIR}" \
  --go_out=paths=source_relative:"${API_GATEWAY_ORDER_DIR}" \
  --go-grpc_out=paths=source_relative:"${API_GATEWAY_ORDER_DIR}" \
  "${PROTO_DIR}/order.proto"

# Step 5: Generate pd.ts files for product.proto and order.proto
echo "Generating pd.ts files for product.proto and order.proto..."
protoc --plugin="${SCRIPT_DIR}/proto-definitions/node_modules/.bin/protoc-gen-ts_proto" \
  --ts_proto_out="${GENERATED_TS_DIR}" \
  --proto_path="${PROTO_DIR}" "${PROTO_DIR}"/*.proto

echo "Protobuf compilation completed successfully."
