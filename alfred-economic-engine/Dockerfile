# Multi-stage build for A.L.F.R.E.D. Enterprise Economics Engine (E³)
FROM rust:slim-bookworm AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y pkg-config libssl-dev git && rm -rf /var/lib/apt/lists/*
COPY . .
RUN cargo build --release --bin enterprise-api

FROM debian:bookworm-slim
WORKDIR /app
RUN apt-get update && apt-get install -y libssl3 ca-certificates curl && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/target/release/enterprise-api /app/enterprise-api
EXPOSE 3005
CMD ["/app/enterprise-api"]
