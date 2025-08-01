# Custom Shortcode Implementation Guide

This guide provides step-by-step instructions to modify the Rowt server to accept custom shortcodes of any length when creating links.

## Overview

Currently, Rowt auto-generates 12-character shortcodes. This modification will allow users to specify their own custom shortcodes while maintaining backward compatibility with auto-generation.

## Required Changes

### 1. Update CreateLinkDTO

**File:** `src/links/dto/createLink.dto.ts`

Add the optional `customShortcode` field:

```typescript
@IsString()
@IsOptional()
@Length(1, 255) // Minimum 1 char, maximum 255 chars
@Matches(/^[a-zA-Z0-9_-]+$/, { message: 'Shortcode can only contain letters, numbers, hyphens, and underscores' })
customShortcode?: string;
```

### 2. Update Link Model

**File:** `src/links/link.model.ts`

Add `customShortcode` parameter to the constructor:

```typescript
export class Link {
  constructor(
    public readonly projectId: string,
    public readonly url: string,
    public readonly customShortcode?: string,
    public readonly title?: string,
    public readonly description?: string,
    public readonly imageUrl?: string,
    public readonly fallbackUrlOverride?: string,
    public readonly additionalMetadata?: Record<string, any>,
    public readonly properties?: Record<string, any>,
    public readonly expiration?: Date,
    public readonly isParameterized?: boolean
  ) {}
}
```

### 3. Update LinkEntity

**File:** `src/links/link.entity.ts`

Modify the primary column and generation logic:

```typescript
// Change the primary column to allow longer strings
@PrimaryColumn({ type: 'varchar', length: 255 })
id: string;

@BeforeInsert()
async generateCustomUid() {
  // Only generate if no custom shortcode was provided
  if (!this.id) {
    const entityManager = getManager();
    try {
      const result = await entityManager.query('SELECT generate_uid(12)');
      this.id = result[0].generate_uid;
    } catch (error) {
      // Fallback to UUID-based generation
      this.id = randomUUID().replace(/-/g, '').substring(0, 12);
    }
  }
}
```

### 4. Update Link Service

**File:** `src/links/link.service.ts`

Add validation for custom shortcodes in the `createLink` method:

```typescript
async createLink(createLinkDto: CreateLinkDTO): Promise<string> {
  // Validate custom shortcode if provided
  if (createLinkDto.customShortcode) {
    // Check if shortcode already exists
    const existingLink = await this.linkRepository.findOne({
      where: { id: createLinkDto.customShortcode }
    });
    
    if (existingLink) {
      throw new BadRequestException('Custom shortcode already exists. Please choose a different one.');
    }
    
    // Additional validation for reserved words/patterns
    const reservedWords = ['api', 'admin', 'www', 'link', 'health', 'static'];
    if (reservedWords.includes(createLinkDto.customShortcode.toLowerCase())) {
      throw new BadRequestException('Custom shortcode uses a reserved word. Please choose a different one.');
    }
  }

  // Create Link model with custom shortcode
  const link: Link = new Link(
    createLinkDto.projectId,
    createLinkDto.url,
    createLinkDto.customShortcode, // Pass custom shortcode
    createLinkDto.title,
    createLinkDto.description,
    createLinkDto.imageUrl,
    createLinkDto.fallbackUrlOverride,
    createLinkDto.additionalMetadata,
    createLinkDto.properties,
    createLinkDto.expiration,
    createLinkDto.isParameterized
  );

  // Rest of the existing logic...
  const savedEntity = await this.linkRepository.createLink(link);
  return savedEntity;
}
```

### 5. Update Link Repository Adapter

**File:** `src/links/link.repository.adapter.ts`

Modify the `createLink` method to handle custom shortcodes:

```typescript
async createLink(link: Link): Promise<string> {
  const linkEntity = this.linkRepository.create({
    // Set custom shortcode as ID if provided
    id: link.customShortcode,
    project: { id: link.projectId },
    url: link.url,
    title: link.title,
    description: link.description,
    imageUrl: link.imageUrl,
    fallbackUrlOverride: link.fallbackUrlOverride,
    additionalMetadata: link.additionalMetadata,
    properties: link.properties,
    expiration: link.expiration,
    isParameterized: link.isParameterized
  });

  const savedEntity = await this.linkRepository.save(linkEntity);
  return savedEntity.id;
}
```

### 6. Database Migration (Optional)

**File:** Create `src/database/migrations/UpdateLinkIdLength.ts`

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateLinkIdLength1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Increase the length of the id column to support longer custom shortcodes
    await queryRunner.query(`
      ALTER TABLE "link" ALTER COLUMN "id" TYPE VARCHAR(255);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert back to original length (this might fail if longer shortcodes exist)
    await queryRunner.query(`
      ALTER TABLE "link" ALTER COLUMN "id" TYPE VARCHAR(12);
    `);
  }
}
```

## API Usage Examples

### Create Link with Custom Shortcode

```bash
curl -X POST "https://your-domain.com/link" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "550e8400-e29b-41d4-a716-446655440000",
    "apiKey": "your-secret-api-key",
    "url": "https://example.com",
    "customShortcode": "my-custom-link",
    "title": "My Custom Link"
  }'
```

### Create Link with Auto-Generated Shortcode (Existing Behavior)

```bash
curl -X POST "https://your-domain.com/link" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "550e8400-e29b-41d4-a716-446655440000",
    "apiKey": "your-secret-api-key",
    "url": "https://example.com",
    "title": "Auto-Generated Link"
  }'
```

## Validation Rules

### Custom Shortcode Validation
- **Length**: 1-255 characters
- **Characters**: Only letters (a-z, A-Z), numbers (0-9), hyphens (-), and underscores (_)
- **Uniqueness**: Must be unique across all links
- **Reserved Words**: Cannot use reserved words like 'api', 'admin', 'www', 'link', 'health', 'static'

### Error Responses
- `400 Bad Request`: Invalid shortcode format, length, or reserved word usage
- `409 Conflict`: Shortcode already exists

## Testing

### Test Cases to Implement

1. **Valid Custom Shortcode**: Create link with valid custom shortcode
2. **Duplicate Shortcode**: Attempt to create link with existing shortcode (should fail)
3. **Invalid Characters**: Test with special characters (should fail)
4. **Reserved Words**: Test with reserved words (should fail)
5. **Length Limits**: Test with very long shortcodes (up to 255 chars)
6. **Auto-Generation**: Ensure existing behavior still works when no custom shortcode provided
7. **Parameterized Links**: Test custom shortcodes with parameterized URLs

### Sample Test

```typescript
describe('Custom Shortcode', () => {
  it('should create link with custom shortcode', async () => {
    const createLinkDto = {
      projectId: 'test-project-id',
      apiKey: 'test-api-key',
      url: 'https://example.com',
      customShortcode: 'my-custom-link'
    };
    
    const result = await linkService.createLink(createLinkDto);
    expect(result).toBe('my-custom-link');
  });
  
  it('should reject duplicate custom shortcode', async () => {
    // Create first link
    await linkService.createLink({
      projectId: 'test-project-id',
      apiKey: 'test-api-key',
      url: 'https://example.com',
      customShortcode: 'duplicate-test'
    });
    
    // Attempt to create second link with same shortcode
    await expect(linkService.createLink({
      projectId: 'test-project-id',
      apiKey: 'test-api-key',
      url: 'https://example2.com',
      customShortcode: 'duplicate-test'
    })).rejects.toThrow('Custom shortcode already exists');
  });
});
```

## Backward Compatibility

This implementation maintains full backward compatibility:
- Existing API calls without `customShortcode` will continue to work
- Auto-generation logic remains unchanged
- Existing links are unaffected
- All existing functionality is preserved

## Security Considerations

1. **Input Validation**: Strict regex validation prevents injection attacks
2. **Reserved Words**: Prevents conflicts with system endpoints
3. **Length Limits**: Prevents abuse and database issues
4. **Character Restrictions**: Only safe characters allowed
5. **Uniqueness**: Prevents shortcode collisions

## Performance Impact

- **Minimal**: Only adds one additional database lookup for duplicate checking
- **Indexing**: The existing primary key index on `id` column handles uniqueness efficiently
- **Memory**: Negligible increase in memory usage

## Documentation Updates

After implementation, update:
1. **API Documentation**: Add `customShortcode` parameter to link creation endpoint
2. **README.md**: Add examples of custom shortcode usage
3. **PARAMETERIZED_LINKS.md**: Show examples with custom shortcodes

## Implementation Checklist

- [ ] Update `CreateLinkDTO` with validation
- [ ] Modify `Link` model constructor
- [ ] Update `LinkEntity` primary column and generation logic
- [ ] Modify `LinkService` with validation and error handling
- [ ] Update `LinkRepository` to handle custom shortcodes
- [ ] Create database migration (if needed)
- [ ] Add comprehensive tests
- [ ] Update API documentation
- [ ] Test backward compatibility
- [ ] Deploy and verify functionality

## Rollback Plan

If issues arise:
1. Revert code changes
2. Run down migration to restore original column length
3. Restart services
4. Existing auto-generated links will continue to work normally