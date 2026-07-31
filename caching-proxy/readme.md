# caching-proxy

A CLI tool that starts a caching proxy server. It forwards incoming requests to a given origin server, caches the responses in Redis, and serves cached responses on repeat requests instead of hitting the origin again.

Built as a learning project to understand caching, reverse proxying, and building CLI tools with Node.js.

## Features

- Start a proxy server on any port, forwarding to any origin server
- Responses are cached in Redis, keyed by HTTP method + path
- `X-Cache: HIT` / `X-Cache: MISS` header on every response, showing whether it was served from cache or fetched from the origin
- Clear the entire cache with a single command
- Passes through the original response status code and body
- Distinguishes between origin errors (e.g. 404) and an unreachable origin (502 Bad Gateway)

## Requirements

- Node.js
- npm
- Redis (running locally, default `localhost:6379`)

## Installation

Clone the repo and install dependencies:

```bash
git clone <repo-url>
cd caching-proxy
npm install
```

Link the CLI so the `caching-proxy` command is available globally:

```bash
npm link
```

Make sure Redis is running before starting the proxy:

```bash
redis-server
```

## Usage

### Start the proxy server

```bash
caching-proxy --port <number> --origin <url>
```

**Example:**

```bash
caching-proxy --port 3000 --origin http://dummyjson.com
```

This starts the proxy on `http://localhost:3000`. Any request made to it is forwarded to `http://dummyjson.com` with the same path, method, and body.

```bash
curl -i http://localhost:3000/products
```

- First request → forwarded to the origin, response cached, `X-Cache: MISS`
- Repeat requests to the same method + path → served from cache, `X-Cache: HIT`

### Clear the cache

```bash
caching-proxy --clear-cache
```

Flushes all cached entries from Redis.

## How it works

1. A request comes in to the proxy server.
2. The proxy builds a cache key from the request's method and path (e.g. `GET:/products`).
3. If a cached response exists for that key in Redis, it's returned immediately with `X-Cache: HIT`.
4. If not, the request is forwarded to the origin server. The response is stored in Redis and returned to the caller with `X-Cache: MISS`.
5. `--clear-cache` connects to Redis directly and flushes all cached entries.

## Notes / limitations

- Cache keys are based on method + path only — query strings and request bodies aren't factored in, so two different `POST` bodies to the same path would currently share a cache entry.
- Cached entries don't currently expire (no TTL) — clearing the cache is manual via `--clear-cache`.
- Built and tested against [dummyjson.com](https://dummyjson.com) as an example origin.

## Project origin

Based on the [roadmap.sh caching proxy project](https://roadmap.sh/projects/caching-server) idea.