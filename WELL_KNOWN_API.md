# Well-Known Files API Documentation

This document describes the API endpoints for managing well-known files in the Rowt server. Well-known files are used for domain verification and app association according to RFC 8615.

## Overview

Well-known files are served at `/.well-known/{filename}` and can be used for:
- Android app verification (`assetlinks.json`)
- iOS universal links (`apple-app-site-association`)
- Other domain verification and app association purposes

## Authentication

All management endpoints require JWT authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 1. Create Well-Known File

**POST** `/well-known`

Creates a new well-known file.

#### Request Body

```json
{
  "filename": "assetlinks.json",
  "content": "[{\"relation\": [\"delegate_permission/common.handle_all_urls\"], \"target\": {\"namespace\": \"android_app\", \"package_name\": \"com.example.app\", \"sha256_cert_fingerprints\": [\"14:6D:E9:83:C5:73:06:50:D8:EE:B9:95:2F:34:FC:64:16:A0:83:42:E6:1D:BE:A8:8A:04:96:B2:3F:CF:44:E5\"]}}]",
  "contentType": "application/json",
  "enabled": true
}
```

#### Request Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| filename | string | Yes | The filename (alphanumeric, dots, hyphens, underscores only) |
| content | string | Yes | The file content (max 1MB) |
| contentType | string | No | MIME type (default: application/json) |
| enabled | boolean | No | Whether the file is enabled (default: true) |

#### Supported Content Types

- `application/json`
- `text/plain`
- `application/xml`
- `text/xml`
- `text/html`
- `application/octet-stream`

#### Response

**201 Created**
```json
{
  "id": "uuid",
  "filename": "assetlinks.json",
  "content": "[...]",
  "contentType": "application/json",
  "enabled": true,
  "userId": "user-uuid",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**400 Bad Request**
```json
{
  "message": "Invalid filename. Only alphanumeric characters, dots, hyphens, and underscores are allowed."
}
```

### 2. List Well-Known Files

**GET** `/well-known`

Returns all well-known files for the authenticated user.

#### Response

**200 OK**
```json
[
  {
    "id": "uuid",
    "filename": "assetlinks.json",
    "content": "[...]",
    "contentType": "application/json",
    "enabled": true,
    "userId": "user-uuid",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### 3. Get Well-Known File by ID

**GET** `/well-known/{id}`

Returns a specific well-known file by ID.

#### Response

**200 OK**
```json
{
  "id": "uuid",
  "filename": "assetlinks.json",
  "content": "[...]",
  "contentType": "application/json",
  "enabled": true,
  "userId": "user-uuid",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**404 Not Found**
```json
{
  "message": "Well-known file not found"
}
```

### 4. Update Well-Known File

**PUT** `/well-known/{id}`

Updates an existing well-known file.

#### Request Body

```json
{
  "content": "[{\"relation\": [\"delegate_permission/common.handle_all_urls\"], \"target\": {\"namespace\": \"android_app\", \"package_name\": \"com.example.updated\"}}]",
  "contentType": "application/json",
  "enabled": false
}
```

#### Request Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| content | string | No | Updated file content |
| contentType | string | No | Updated MIME type |
| enabled | boolean | No | Updated enabled status |

#### Response

**200 OK**
```json
{
  "id": "uuid",
  "filename": "assetlinks.json",
  "content": "[...]",
  "contentType": "application/json",
  "enabled": false,
  "userId": "user-uuid",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### 5. Delete Well-Known File

**DELETE** `/well-known/{id}`

Deletes a well-known file.

#### Response

**204 No Content**

**404 Not Found**
```json
{
  "message": "Well-known file not found"
}
```

### 6. Serve Well-Known File (Public)

**GET** `/.well-known/{filename}`

Serves a well-known file publicly. This endpoint does not require authentication.

#### Response

**200 OK**
```
Content-Type: application/json
Cache-Control: public, max-age=3600
Access-Control-Allow-Origin: *

[{"relation": ["delegate_permission/common.handle_all_urls"], ...}]
```

**404 Not Found**
```json
{
  "message": "Well-known file not found"
}
```

## Rate Limiting

The following rate limits apply:

- **Create**: 10 requests per minute
- **Update**: 20 requests per minute  
- **Delete**: 5 requests per minute
- **Public serving**: 100 requests per minute

## Validation Rules

### Filename Validation
- Only alphanumeric characters, dots, hyphens, and underscores allowed
- Maximum length: 255 characters
- Cannot contain path traversal sequences (`..`, `/`, `\`)
- Reserved filenames are not allowed: `security.txt`, `robots.txt`, `sitemap.xml`

### Content Validation
- Maximum size: 1MB
- Content is scanned for malicious patterns (scripts, event handlers, etc.)
- JSON content is validated for syntax if content type is `application/json`
- XML content is validated for balanced tags if content type is XML
- Maximum nesting level: 50 levels

### Security Features
- All content is sanitized to prevent XSS attacks
- Path traversal attempts are blocked
- Malicious script injection is prevented
- Content size limits prevent DoS attacks
- Rate limiting prevents abuse

## Examples

### Android App Links (assetlinks.json)

```bash
curl -X POST https://your-domain.com/well-known \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "assetlinks.json",
    "content": "[{\"relation\": [\"delegate_permission/common.handle_all_urls\"], \"target\": {\"namespace\": \"android_app\", \"package_name\": \"com.example.app\", \"sha256_cert_fingerprints\": [\"14:6D:E9:83:C5:73:06:50:D8:EE:B9:95:2F:34:FC:64:16:A0:83:42:E6:1D:BE:A8:8A:04:96:B2:3F:CF:44:E5\"]}}]",
    "contentType": "application/json",
    "enabled": true
  }'
```

### iOS Universal Links (apple-app-site-association)

```bash
curl -X POST https://your-domain.com/well-known \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "apple-app-site-association",
    "content": "{\"applinks\": {\"apps\": [], \"details\": [{\"appID\": \"TEAMID.com.example.app\", \"paths\": [\"*\"]}]}}",
    "contentType": "application/json",
    "enabled": true
  }'
```

## Admin Interface

A web-based admin interface is available at `/admin/well-known` for managing well-known files through a user-friendly interface.

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created successfully |
| 204 | Deleted successfully |
| 400 | Bad request (validation error) |
| 401 | Unauthorized (authentication required) |
| 404 | File not found |
| 409 | Conflict (filename already exists) |
| 429 | Too many requests (rate limit exceeded) |
| 500 | Internal server error |

## Best Practices

1. **Use appropriate content types** - Ensure the content type matches your file format
2. **Validate JSON/XML** - Test your content before uploading
3. **Enable caching** - Well-known files are cached for 1 hour by default
4. **Monitor file sizes** - Keep files as small as possible for better performance
5. **Use descriptive filenames** - Follow RFC 8615 naming conventions
6. **Test accessibility** - Verify files are accessible at `/.well-known/{filename}`
