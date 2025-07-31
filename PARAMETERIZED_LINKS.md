# Parameterized Links

Rowt supports **parameterized links** - a powerful feature that allows you to create dynamic links that can be customized with URL parameters at runtime. This eliminates the need to create thousands of individual links for similar use cases.

## 🎯 **Use Cases**

Perfect for scenarios where you need many similar links with slight variations:

- **Multi-merchant platforms**: One link for thousands of merchants
- **User-specific deep links**: Personalized app redirections  
- **Campaign tracking**: Dynamic UTM parameters
- **A/B testing**: Variable content based on parameters
- **White-label solutions**: Customizable branding per client

## 🔧 **How It Works**

### **Traditional Approach (Before)**
```
Create 1000 separate links:
- Link 1: merchant/ABC123@merchant1.com
- Link 2: merchant/DEF456@merchant2.com  
- Link 3: merchant/GHI789@merchant3.com
- ... (997 more links)
```

### **Parameterized Approach (Now)**
```
Create 1 template link:
- Template: merchant/{{publickey}}@{{domain}}

Use with parameters:
- https://rowt.yourdomain.com/merchant-redirect?publickey=ABC123&domain=merchant1.com
- https://rowt.yourdomain.com/merchant-redirect?publickey=DEF456&domain=merchant2.com
- https://rowt.yourdomain.com/merchant-redirect?publickey=GHI789&domain=merchant3.com
```

## 📝 **Template Syntax**

Use double curly braces `{{}}` to define parameters in your URLs:

### **Deep Link Examples**
```
merchant/{{publickey}}@{{domain}}
user/{{userId}}/profile/{{section}}
app/{{feature}}?token={{authToken}}
```

### **Website Examples**  
```
https://example.com/landing?user={{userId}}&campaign={{campaignId}}
https://api.service.com/webhook?key={{apiKey}}&event={{eventType}}
https://dashboard.app.com/{{tenantId}}/{{module}}
```

## 🚀 **Creating Parameterized Links**

### **Method 1: Auto-Detection**
Rowt automatically detects parameterized URLs when you create a link:

```bash
curl -X POST https://rowt.yourdomain.com/link \
  -H "Content-Type: application/json" \
  -d '{
    "url": "merchant/{{publickey}}@{{domain}}",
    "projectId": "your-project-id",
    "apiKey": "your-api-key",
    "title": "Merchant Redirect"
  }'
```

### **Method 2: Explicit Flag**
Explicitly mark a link as parameterized:

```bash
curl -X POST https://rowt.yourdomain.com/link \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com?key={{theKey}}",
    "isParameterized": true,
    "projectId": "your-project-id", 
    "apiKey": "your-api-key"
  }'
```

## 🔗 **Using Parameterized Links**

Once created, use your parameterized link by adding query parameters:

### **Basic Usage**
```
https://rowt.yourdomain.com/ABC123?publickey=USER123&domain=merchant1.com
```

### **Multiple Parameters**
```
https://rowt.yourdomain.com/XYZ789?userId=12345&campaign=summer2024&source=email
```

### **URL Encoding**
Remember to URL-encode parameter values:
```
https://rowt.yourdomain.com/ABC123?domain=merchant%2Bspecial.com&key=value%20with%20spaces
```

## ⚡ **Resolution Process**

Here's what happens when a user clicks a parameterized link:

1. **Parameter Extraction**: Rowt extracts query parameters from the URL
2. **Template Lookup**: Finds the template link by short code
3. **Validation**: Validates parameter values (length, characters)
4. **Substitution**: Replaces `{{placeholders}}` with actual values
5. **Platform Detection**: Determines user's device (iOS/Android/Web)
6. **Final Redirect**: Constructs and redirects to the final URL

### **Example Flow**
```
User clicks: https://rowt.yourdomain.com/ABC123?publickey=USER123&domain=merchant1.com
                                    ↓
Template found: merchant/{{publickey}}@{{domain}}
                                    ↓
Parameters substituted: merchant/USER123@merchant1.com
                                    ↓
Platform detected: iOS
                                    ↓
Final redirect: myapp://merchant/USER123@merchant1.com
```

## 🛡️ **Security & Validation**

Rowt includes built-in security measures for parameterized links:

### **Parameter Validation**
- **Length Limit**: Maximum 150 characters per parameter
- **Character Filtering**: Blocks dangerous characters (`<>'"&\`)
- **Script Prevention**: Prevents JavaScript injection attempts
- **Required Parameters**: All template placeholders must be provided

### **Error Handling**
If validation fails, Rowt falls back to:
1. Original template URL (if safe)
2. Project fallback URL
3. Error page

### **Example Validation**
```javascript
// ✅ Valid parameters
publickey: "ABC123"
domain: "merchant1.com"

// ❌ Invalid parameters  
publickey: "<script>alert('xss')</script>"  // Contains dangerous characters
domain: "a".repeat(200)                     // Exceeds length limit
```

## 📊 **Analytics**

Parameterized links are tracked as **single entities** in analytics:

- **Link-level tracking**: All parameter combinations count toward one link
- **Interaction logging**: Individual clicks are still recorded with metadata
- **Lifetime clicks**: Aggregated across all parameter combinations
- **External analytics**: Your app can still track individual parameters via Google Analytics

### **Analytics Benefits**
- **Simplified reporting**: One link to monitor instead of thousands
- **Aggregate insights**: Total performance across all variations
- **Parameter analysis**: Track which parameter combinations perform best (via your app analytics)

## 🔄 **Updating Parameterized Links**

You can update parameterized links just like regular links:

```bash
curl -X PUT https://rowt.yourdomain.com/link/ABC123 \
  -H "Content-Type: application/json" \
  -d '{
    "url": "newpath/{{publickey}}@{{domain}}",
    "title": "Updated Merchant Redirect",
    "projectId": "your-project-id",
    "apiKey": "your-api-key"
  }'
```

## 💡 **Best Practices**

### **Template Design**
- Use descriptive parameter names: `{{userId}}` not `{{u}}`
- Keep templates simple and readable
- Document required parameters for your team
- Test templates with various parameter combinations

### **Parameter Naming**
- Use camelCase: `{{publicKey}}` not `{{public_key}}`
- Be consistent across your application
- Avoid reserved words or special characters
- Keep names short but descriptive

### **Security**
- Validate parameters on your app side too
- Use HTTPS for sensitive parameters
- Consider parameter encryption for highly sensitive data
- Monitor for unusual parameter patterns

### **Performance**
- Cache frequently used parameter combinations
- Use meaningful short codes for better debugging
- Monitor link resolution times
- Consider parameter complexity impact

## 🚨 **Limitations**

- **Parameter length**: 150 characters maximum per parameter
- **Template complexity**: Keep templates simple for better performance
- **Character restrictions**: Some characters are blocked for security
- **Required parameters**: All template placeholders must be provided

## 🔧 **Troubleshooting**

### **Common Issues**

**Link not resolving:**
- Check that all required parameters are provided
- Verify parameter values don't exceed length limits
- Ensure no dangerous characters in parameters

**Wrong redirect destination:**
- Verify template syntax uses `{{parameterName}}`
- Check parameter names match exactly (case-sensitive)
- Test with simple parameter values first

**Analytics not tracking:**
- Parameterized links track as single entities
- Individual parameter combinations don't create separate analytics entries
- Use your app's analytics for parameter-specific tracking

### **Testing**
```bash
# Test your parameterized link
curl -I "https://rowt.yourdomain.com/ABC123?publickey=TEST&domain=example.com"

# Should return 302 redirect with Location header
```

## 📚 **Examples**

### **E-commerce Platform**
```
Template: shop/{{storeId}}/product/{{productId}}
Usage: https://rowt.yourdomain.com/shop123?storeId=nike&productId=air-max-90
Result: myapp://shop/nike/product/air-max-90
```

### **SaaS Dashboard**
```
Template: https://dashboard.com/{{tenantId}}/{{module}}?token={{authToken}}
Usage: https://rowt.yourdomain.com/dash456?tenantId=acme&module=analytics&authToken=xyz789
Result: https://dashboard.com/acme/analytics?token=xyz789
```

### **Social Media**
```
Template: profile/{{username}}/post/{{postId}}
Usage: https://rowt.yourdomain.com/social789?username=johndoe&postId=12345
Result: socialapp://profile/johndoe/post/12345
```

---

**Ready to scale your link management?** Start using parameterized links today and reduce thousands of individual links down to just a few powerful templates! 🚀
