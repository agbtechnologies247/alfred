# Multi-stage build for A.L.F.R.E.D. API Gateway
FROM rust:1.85-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y pkg-config libssl-dev git && rm -rf /var/lib/apt/lists/*
COPY . .
RUN cargo build --release --bin api-gateway

FROM debian:bookworm-slim
WORKDIR /app
RUN apt-get update && apt-get install -y libssl3 ca-certificates curl && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/target/release/api-gateway /app/api-gateway
EXPOSE 3000
CMD ["/app/api-gateway"]
