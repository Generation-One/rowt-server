# 🔗 Link Management & Project API Endpoints

This document describes the API endpoints for link editing, deletion, and project editing in the Rowt application.

## 1. Update Link - `PUT /link/:id`

**Description:** Updates an existing link by ID. Only the link owner (verified via API key) can update their links.

**URL:** `PUT /link/{linkId}`

**Request Headers:**
```
Content-Type: application/json
```

**Path Parameters:**
- `linkId` (string, required): The unique identifier of the link to update

**Request Body (UpdateLinkDTO):**
```typescript
{
  "projectId": string,        // UUID, required - Project ID for authorization
  "apiKey": string,          // required - API key for authentication
  "url"?: string,            // optional - New URL (must be valid URL)
  "title"?: string,          // optional - New title
  "description"?: string,    // optional - New description
  "imageUrl"?: string,       // optional - New image URL (must be valid URL)
  "fallbackUrlOverride"?: string, // optional - New fallback URL (must be valid URL)
  "additionalMetadata"?: Record<string, any>, // optional - JSONB metadata (max 10KB)
  "properties"?: Record<string, any>,         // optional - JSONB properties (max 10KB)
  "active"?: boolean         // optional - Active/inactive status
}
```

**Success Response (200 OK):**
```json
{
  "message": "Link updated successfully",
  "link": {
    "id": "abc123def456",
    "url": "https://updated-example.com",
    "title": "Updated Title",
    "description": "Updated Description",
    "imageUrl": "https://example.com/new-image.jpg",
    "fallbackUrlOverride": "https://example.com/fallback",
    "additionalMetadata": {},
    "properties": {},
    "lifetimeClicks": 42,
    "createdAt": "2025-01-31T10:30:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid request body, missing link ID, project ID mismatch, or JSONB size limit exceeded
- `403 Forbidden`: Invalid API key or unauthorized access
- `404 Not Found`: Link not found
- `500 Internal Server Error`: Server error

---

## 2. Delete Link - `DELETE /link/:id`

**Description:** Deletes an existing link by ID. Only the link owner (verified via API key) can delete their links.

**URL:** `DELETE /link/{linkId}`

**Request Headers:**
```
Content-Type: application/json
```

**Path Parameters:**
- `linkId` (string, required): The unique identifier of the link to delete

**Request Body (DeleteLinkDTO):**
```typescript
{
  "projectId": string,  // UUID, required - Project ID for authorization
  "apiKey": string     // required - API key for authentication
}
```

**Success Response (200 OK):**
```json
{
  "message": "Link deleted successfully",
  "linkId": "abc123def456"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid request body, missing link ID, or project ID mismatch
- `403 Forbidden`: Invalid API key or unauthorized access
- `404 Not Found`: Link not found
- `500 Internal Server Error`: Server error

---

## 3. Edit Project - `PUT /projects/:id`

**Description:** Updates an existing project by ID. Only the project owner (verified via JWT authentication) can edit their projects.

**URL:** `PUT /projects/{projectId}`

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer {jwt_token}
```

**Path Parameters:**
- `projectId` (string, required): The unique identifier of the project to update

**Request Body (EditProjectDTO):**
```typescript
{
  "name"?: string,              // optional - New project name
  "baseUrl"?: string,           // optional - New base URL (must be valid URL)
  "fallbackUrl"?: string,       // optional - New fallback URL (must be valid URL)
  "appstoreId"?: string,        // optional - New App Store ID
  "playstoreId"?: string,       // optional - New Play Store ID
  "iosScheme"?: string,         // optional - New iOS URI scheme
  "androidScheme"?: string      // optional - New Android URI scheme
}
```

**Success Response (200 OK):**
```json
{
  "message": "Project updated successfully",
  "project": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Updated Project Name",
    "baseUrl": "https://updated-example.com",
    "fallbackUrl": "https://updated-example.com/fallback",
    "appstoreId": "newapp123",
    "playstoreId": "newplay456",
    "iosScheme": "updatedapp",
    "androidScheme": "updatedapp",
    "apiKey": "550e8400-e29b-41d4-a716-446655440001",
    "userId": "user-uuid-here"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid request body or missing project ID
- `401 Unauthorized`: Missing or invalid JWT token
- `404 Not Found`: Project not found or access denied
- `500 Internal Server Error`: Server error

---

## 🔒 Authorization & Security

### Link Endpoints (Update/Delete)
Link endpoints use API key authentication:

1. **API Key Validation**: The `apiKey` in the request body must match the project's API key
2. **Ownership Verification**: The link must belong to the project specified by `projectId`
3. **Project ID Matching**: If `projectId` is provided, it must match the link's actual project ID

### Project Endpoints (Edit)
Project endpoints use JWT authentication:

1. **JWT Token Validation**: Valid JWT token must be provided in the Authorization header
2. **User Ownership**: The project must belong to the authenticated user
3. **User ID Matching**: The project's userId must match the authenticated user's ID

## 📝 Validation Rules

### UpdateLinkDTO Validation:
- `projectId`: Must be a valid UUID string
- `apiKey`: Must be a non-empty string
- `url`: Must be a valid URL format (if provided)
- `imageUrl`: Must be a valid URL format (if provided)
- `fallbackUrlOverride`: Must be a valid URL format (if provided)
- `additionalMetadata`: JSONB object, max 10KB size
- `properties`: JSONB object, max 10KB size
- `active`: Must be a boolean (if provided)

### DeleteLinkDTO Validation:
- `projectId`: Must be a valid UUID string
- `apiKey`: Must be a non-empty string

### EditProjectDTO Validation:
- `name`: Must be a non-empty string (if provided)
- `baseUrl`: Must be a valid URL format (if provided)
- `fallbackUrl`: Must be a valid URL format (if provided)
- `appstoreId`: Must be a string (if provided)
- `playstoreId`: Must be a string (if provided)
- `iosScheme`: Must be a string (if provided)
- `androidScheme`: Must be a string (if provided)

## 🧪 Example Usage

### Update Link Example:
```bash
curl -X PUT "https://your-domain.com/link/abc123def456" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "550e8400-e29b-41d4-a716-446655440000",
    "apiKey": "your-secret-api-key",
    "url": "https://updated-example.com",
    "title": "My Updated Link",
    "description": "This link has been updated",
    "properties": {
      "campaign": "spring-2025",
      "source": "email"
    }
  }'
```

### Delete Link Example:
```bash
curl -X DELETE "https://your-domain.com/link/abc123def456" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "550e8400-e29b-41d4-a716-446655440000",
    "apiKey": "your-secret-api-key"
  }'
```

### Edit Project Example:
```bash
curl -X PUT "https://your-domain.com/projects/550e8400-e29b-41d4-a716-446655440000" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-jwt-token" \
  -d '{
    "name": "My Updated Project",
    "baseUrl": "https://updated-example.com",
    "fallbackUrl": "https://updated-example.com/fallback",
    "appstoreId": "newapp123",
    "playstoreId": "newplay456"
  }'
```

## 🚨 Important Notes

### Link Endpoints
1. **Rate Limiting**: Link endpoints are subject to the application's rate limiting (30 requests per minute by default)
2. **Public Endpoints**: Link endpoints are marked as `@Public()` but require API key authentication
3. **Partial Updates**: The update endpoint supports partial updates - only provided fields will be updated
4. **JSONB Limits**: `additionalMetadata` and `properties` fields have a 10KB size limit
5. **Cascading Deletes**: Deleting a link will also delete all associated interaction records
6. **Immutable Fields**: Link ID and creation timestamp cannot be modified via the update endpoint

### Project Endpoints
1. **Rate Limiting**: Project endpoints are subject to the application's rate limiting (30 requests per minute by default)
2. **JWT Authentication**: Project endpoints require valid JWT token in Authorization header
3. **Partial Updates**: The edit endpoint supports partial updates - only provided fields will be updated
4. **User Ownership**: Only project owners can edit their projects
5. **Immutable Fields**: Project ID, API key, user ID, and creation timestamp cannot be modified via the edit endpoint

These endpoints provide comprehensive CRUD operations for both link and project management while maintaining the security and validation patterns established in the existing codebase.
