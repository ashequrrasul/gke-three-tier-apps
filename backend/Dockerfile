FROM golang:1.26-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -o server .

FROM alpine:3.20

WORKDIR /app

RUN addgroup -g 3000 appgroup && \
    adduser -D -u 1000 -G appgroup appuser

COPY --from=builder --chown=1000:3000 /app/server ./server

RUN chmod 755 ./server

USER 1000:3000

EXPOSE 8080

ENTRYPOINT ["./server"]