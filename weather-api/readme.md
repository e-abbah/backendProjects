# Weather API

A small Express API that fetches current weather conditions from [Visual Crossing](https://www.visualcrossing.com/weather-api), with Redis caching, environment-based configuration, layered error handling, and rate limiting.

This project was built as a learning exercise to practice working with 3rd-party APIs, caching strategies, and environment variables.

## Features

- `GET /weather?city={city}` — returns current weather conditions for a given city
- **Redis caching** — responses are cached for 12 hours, keyed by a normalized (lowercased) city name, to reduce redundant calls to the upstream API
- **Environment variables** — API key and configuration are kept out of source code via a `.env` file
- **Layered error handling** — distinguishes between invalid input, upstream provider errors, server misconfiguration, and network timeouts
- **Rate limiting** — protects the `/weather` endpoint from abuse using `express-rate-limit`

## Tech Stack

- [Express](https://expressjs.com/) — web server framework
- [Axios](https://axios-http.com/) — HTTP client for calling the Visual Crossing API
- [Redis](https://redis.io/) — in-memory cache
- [dotenv](https://www.npmjs.com/package/dotenv) — environment variable loading
- [express-rate-limit](https://www.npmjs.com/package/express-rate-limit) — rate limiting middleware

## Prerequisites

- Node.js
- A running Redis server (locally, via WSL, Docker, or a cloud provider)
- A free Visual Crossing API key ([sign up here](https://www.visualcrossing.com/weather-api))

## Setup

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file in the project root:
   ```
   WEATHER_API_KEY=your_visual_crossing_api_key
   ```

3. Make sure Redis is running and reachable at `localhost:6379` (the default the Redis client connects to).

4. Start the server:
   ```bash
   node server.js
   ```

   The server will run on `http://localhost:3000`.

## Usage

### Get weather for a city

```
GET /weather?city={city}
```

**Example:**
```
GET http://localhost:3000/weather?city=lagos
```

**Successful response (`200`):**
```json
{
  "message": {
    "city": "lagos",
    "temperature": 25.2,
    "condition": "Rain, Overcast",
    "humidity": 82.5,
    "wind_speed": 27.7
  }
}
```

### Error responses

| Status | Meaning | When it happens |
|--------|---------|------------------|
| `400`  | Bad request | No `city` query param provided, or the city name isn't recognized by the weather provider |
| `429`  | Too many requests | Rate limit exceeded for the `/weather` endpoint |
| `500`  | Internal server error | Server misconfiguration (e.g. invalid/missing API key) |
| `502`  | Bad gateway | The weather provider returned an unexpected error |
| `504`  | Gateway timeout | No response received from the weather provider (network/timeout issue) |

## How Caching Works

- On each request, the city name is normalized (lowercased) and used as the Redis cache key.
- If a cached entry exists, it's returned immediately without calling the weather API.
- If not, the weather API is called, the response is shaped into a clean object, cached with a **12-hour expiration** (`EX` flag), and then returned.
- This reduces load on the upstream API and speeds up repeated requests for the same city.

## Rate Limiting

The `/weather` route is protected by `express-rate-limit`, configured with a request limit per IP address within a rolling time window. Requests beyond the limit receive a `429` response instead of reaching the route handler.

## Possible Future Improvements

- Move rate limit values (`windowMs`, `max`) into environment variables
- Add automated tests (e.g. Jest + Supertest) covering validation and error branches
- Add an unthrottled `/health` endpoint
- Handle Redis connection failures separately from upstream API failures