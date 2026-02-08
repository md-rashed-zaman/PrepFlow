# syntax=docker/dockerfile:1

FROM golang:1.25-alpine AS build
WORKDIR /src

RUN apk add --no-cache ca-certificates git

COPY go.mod go.sum ./
RUN go mod download

COPY services ./services
COPY openapi ./openapi

RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /out/prepflow-api ./services/api/cmd/api
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /out/prepflow-migrate ./services/api/cmd/migrate

FROM alpine:3.20
RUN apk add --no-cache ca-certificates
WORKDIR /app

COPY --from=build /out/prepflow-api /usr/local/bin/prepflow-api
COPY --from=build /out/prepflow-migrate /usr/local/bin/prepflow-migrate
COPY --from=build /src/services/api/migrations /app/services/api/migrations
COPY --from=build /src/openapi /app/openapi

ENV PORT=8080
EXPOSE 8080

CMD ["/usr/local/bin/prepflow-api"]

