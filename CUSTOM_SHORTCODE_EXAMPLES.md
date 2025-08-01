# Custom Shortcode Examples

This document provides examples of how to use the new custom shortcode feature in Rowt server.

## API Usage Examples

### 1. Create Link with Custom Shortcode

```bash
curl -X POST "http://localhost:3000/link" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "550e8400-e29b-41d4-a716-446655440000",
    "apiKey": "your-secret-api-key",
    "url": "https://example.com",
    "customShortcode": "my-custom-link",
    "title": "My Custom Link"
  }'
```

**Response:** `http://localhost:3000/my-custom-link`

### 2. Create Link with Auto-Generated Shortcode (Existing Behavior)

```bash
curl -X POST "http://localhost:3000/link" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "550e8400-e29b-41d4-a716-446655440000",
    "apiKey": "your-secret-api-key",
    "url": "https://example.com",
    "title": "Auto-Generated Link"
  }'
```

**Response:** `http://localhost:3000/abc123def456` (12-character auto-generated ID)

### 3. Custom Shortcode with Parameterized URL

```bash
curl -X POST "http://localhost:3000/link" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "550e8400-e29b-41d4-a716-446655440000",
    "apiKey": "your-secret-api-key",
    "url": "https://example.com/user/{userId}/profile",
    "customShortcode": "user-profile",
    "title": "User Profile Link",
    "isParameterized": true
  }'
```

**Response:** `http://localhost:3000/user-profile`

**Usage:** `http://localhost:3000/user-profile?userId=123` → redirects to `https://example.com/user/123/profile`

## Validation Rules

### Valid Custom Shortcodes
- `my-link` ✅
- `product_123` ✅
- `campaign-2024` ✅
- `user-profile-v2` ✅
- `ABC123` ✅

### Invalid Custom Shortcodes
- `my link` ❌ (contains space)
- `link@home` ❌ (contains special character)
- `api` ❌ (reserved word)
- `admin` ❌ (reserved word)
- `www` ❌ (reserved word)
- `health` ❌ (reserved word)
- `static` ❌ (reserved word)
- `` ❌ (empty string)
- `a`.repeat(13) ❌ (too long, max 12 characters)

## Error Responses

### Duplicate Shortcode
```json
{
  "statusCode": 400,
  "message": "Custom shortcode already exists. Please choose a different one.",
  "error": "Bad Request"
}
```

### Reserved Word
```json
{
  "statusCode": 400,
  "message": "Custom shortcode uses a reserved word. Please choose a different one.",
  "error": "Bad Request"
}
```

### Invalid Characters
```json
{
  "statusCode": 400,
  "message": ["Shortcode can only contain letters, numbers, hyphens, and underscores"],
  "error": "Bad Request"
}
```

### Length Validation
```json
{
  "statusCode": 400,
  "message": ["customShortcode must be longer than or equal to 1 characters", "customShortcode must be shorter than or equal to 12 characters"],
  "error": "Bad Request"
}
```

## Implementation Notes

- **Backward Compatibility**: Existing API calls without `customShortcode` continue to work exactly as before
- **Auto-Generation**: When no custom shortcode is provided, the system generates a 12-character UID as usual
- **Database**: The link ID column remains 12 characters for both auto-generated and custom shortcodes
- **Uniqueness**: Custom shortcodes must be unique across all links in the system
- **Case Sensitivity**: Custom shortcodes are case-sensitive (`MyLink` and `mylink` are different)

## Migration

No database migration is required. Custom shortcodes are limited to 12 characters, the same as auto-generated shortcodes, so the existing database schema supports this feature without changes.
