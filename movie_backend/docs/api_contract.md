# Movie API Contract

**Version:** v1.0
**OpenAPI:** 3.1.0

---

# Base URL

```
http://localhost:8000
```

---

# Authentication

Most endpoints require a JWT access token.

**Header**

```http
Authorization: Bearer <access_token>
```

---

# Auth APIs

## 1. Register User

**Endpoint**

```http
POST /auth/signup
```

### Request Body

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Password@123"
}
```

### Success Response (200)

```json
{
  "name": "John Doe",
  "email": "john@example.com"
}
```

### Validation Error (422)

```json
{
  "detail": [
    {
      "loc": [
        "body",
        "email"
      ],
      "msg": "value is not a valid email address"
    }
  ]
}
```

---

## 2. Login

```http
POST /auth/login
```

### Request

```json
{
  "email": "john@example.com",
  "password": "Password@123"
}
```

### Success Response

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI...",
  "token_type": "bearer"
}
```

---

## 3. Get Current User

```http
GET /auth/me
```

### Header

```http
Authorization: Bearer eyJhbGc...
```

### Response

```json
{
  "name": "John Doe",
  "email": "john@example.com"
}
```

---

# Movies

## Get All Movies

```http
GET /movies/
```

### Response

```json
[
  {
    "id": 1,
    "title": "Inception",
    "release_year": 2010,
    "genre": "Sci-Fi",
    "rating": 8.8
  },
  {
    "id": 2,
    "title": "Interstellar",
    "release_year": 2014,
    "genre": "Sci-Fi",
    "rating": 8.7
  }
]
```

---

## Get Movie By ID

```http
GET /movies/1
```

### Response

```json
{
  "id": 1,
  "title": "Inception",
  "description": "A thief enters people's dreams to steal secrets.",
  "genre": "Sci-Fi",
  "rating": 8.8
}
```

---

# Reviews

## Create Review

```http
POST /reviews/1
```

### Request

```json
{
  "rating": 5,
  "review": "Amazing movie with an incredible storyline."
}
```

### Response

```json
{
  "message": "Review added successfully."
}
```

---

## AI Review Summary

```http
GET /reviews/ai_summary_review/1
```

### Response

```json
{
  "summary_message": "Inception is widely praised for its mind-bending story, outstanding visuals, and Christopher Nolan's direction. Most viewers recommend watching it more than once to fully appreciate its complex narrative."
}
```

---

# Favorites

## Add to Favorites

```http
POST /favorites/add/1
```

### Response

```json
{
  "message": "Movie added to favorites."
}
```

---

## Get Favorites

```http
GET /favorites/
```

### Response

```json
[
  {
    "id": 1,
    "movie_id": 5
  },
  {
    "id": 2,
    "movie_id": 9
  }
]
```

---

# Watchlist

## Add Movie

```http
POST /watchlist/add/3
```

### Response

```json
{
  "message": "Movie added to watchlist."
}
```

---

# Admin

## Create Movie

```http
POST /admin/movies
```

### Request

```json
{
  "title": "The Batman",
  "description": "Crime thriller",
  "release_year": 2022,
  "genre_id": 2
}
```

### Response

```json
{
  "message": "Movie created successfully."
}
```
