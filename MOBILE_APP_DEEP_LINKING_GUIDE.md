# Mobile App Deep Linking with Rowt

This guide explains how to use Rowt to create QR codes for brochures that intelligently redirect users to your mobile app or app stores based on their device and app installation status.

## 🎯 What This Achieves

When someone scans your QR code:
- **App Installed**: Opens your app directly with custom parameters
- **App Not Installed**: Redirects to the appropriate app store (iOS App Store or Google Play Store)
- **Desktop/Web**: Redirects to your website fallback

## 🚀 Quick Start

### Step 1: Set Up Your Project

First, create a project in Rowt with your app's configuration:

```bash
curl -X POST https://your-rowt-domain.com/project \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "My Mobile App",
    "baseUrl": "https://your-rowt-domain.com",
    "fallbackUrl": "https://yourwebsite.com",
    "appstoreId": "123456789",
    "playstoreId": "com.yourcompany.yourapp",
    "iosScheme": "yourapp://",
    "androidScheme": "yourapp://"
  }'
```

**Configuration Explained:**
- `appstoreId`: Your iOS App Store ID (found in App Store Connect)
- `playstoreId`: Your Android package name (e.g., com.yourcompany.yourapp)
- `iosScheme`: Your iOS URL scheme (defined in Info.plist)
- `androidScheme`: Your Android URL scheme (defined in AndroidManifest.xml)
- `fallbackUrl`: Where to redirect desktop users or if app stores aren't available

### Step 2: Create a Parameterized Deep Link

Create a template link that can be customized with parameters:

```bash
curl -X POST https://your-rowt-domain.com/link \
  -H "Content-Type: application/json" \
  -d '{
    "url": "product/{{productId}}?campaign={{campaign}}&source={{source}}&user={{userId}}",
    "projectId": "your-project-id",
    "apiKey": "your-api-key",
    "title": "Product Deep Link",
    "description": "Smart deep link for product pages"
  }'
```

**Response:** `https://your-rowt-domain.com/ABC123`

### Step 3: Generate QR Codes for Your Brochures

For each brochure, create a unique URL with specific parameters:

```
https://your-rowt-domain.com/ABC123?productId=12345&campaign=brochure2024&source=print&userId=guest
```

**Parameter Examples:**
- `productId`: Specific product featured in the brochure
- `campaign`: Marketing campaign identifier
- `source`: Where the QR code appears (print, digital, etc.)
- `userId`: User identifier (if known) or "guest"

## 📱 How It Works

### The Smart Redirection Flow

1. **User scans QR code** → Opens: `https://your-rowt-domain.com/ABC123?productId=12345&campaign=brochure2024`

2. **Rowt processes the request:**
   - Detects device type (iOS/Android/Desktop)
   - Substitutes parameters into template
   - Template: `product/{{productId}}?campaign={{campaign}}`
   - Result: `product/12345?campaign=brochure2024`

3. **Platform-specific redirection:**

   **iOS Device:**
   - Tries: `yourapp://product/12345?campaign=brochure2024&source=print&user=guest`
   - If app opens: ✅ Success!
   - If timeout (2 seconds): Redirects to `https://apps.apple.com/app/id123456789`

   **Android Device:**
   - Tries: `yourapp://product/12345?campaign=brochure2024&source=print&user=guest`
   - If app opens: ✅ Success!
   - If timeout (1.5 seconds): Redirects to `https://play.google.com/store/apps/details?id=com.yourcompany.yourapp`

   **Desktop/Other:**
   - Redirects to: `https://yourwebsite.com`

## 🛠️ Mobile App Configuration

### iOS App Setup

1. **Add URL Scheme to Info.plist:**
```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLName</key>
        <string>com.yourcompany.yourapp</string>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>yourapp</string>
        </array>
    </dict>
</array>
```

2. **Handle Deep Links in AppDelegate:**
```swift
func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey : Any] = [:]) -> Bool {
    // Parse URL: yourapp://product/12345?campaign=brochure2024&source=print&user=guest
    let components = URLComponents(url: url, resolvingAgainstBaseURL: false)
    let productId = url.pathComponents[1] // "12345"
    let campaign = components?.queryItems?.first(where: { $0.name == "campaign" })?.value
    
    // Navigate to product page with campaign context
    navigateToProduct(id: productId, campaign: campaign)
    return true
}
```

### Android App Setup

1. **Add Intent Filter to AndroidManifest.xml:**
```xml
<activity android:name=".MainActivity">
    <intent-filter>
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="yourapp" />
    </intent-filter>
</activity>
```

2. **Handle Deep Links in Activity:**
```java
@Override
protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    
    Intent intent = getIntent();
    Uri data = intent.getData();
    
    if (data != null) {
        // Parse URL: yourapp://product/12345?campaign=brochure2024&source=print&user=guest
        String productId = data.getPathSegments().get(1); // "12345"
        String campaign = data.getQueryParameter("campaign");
        
        // Navigate to product page with campaign context
        navigateToProduct(productId, campaign);
    }
}
```

## 📊 Analytics & Tracking

Rowt automatically tracks:
- **Click Analytics**: Total clicks, unique users, geographic data
- **Device Breakdown**: iOS vs Android vs Desktop usage
- **Conversion Tracking**: App opens vs store redirects
- **Campaign Performance**: Parameter-based segmentation

Access analytics via the Rowt API:
```bash
curl -X POST https://your-rowt-domain.com/project/getById \
  -H "Content-Type: application/json" \
  -d '{
    "id": "your-project-id",
    "options": {
      "includeInteractions": true,
      "startDate": "2024-01-01",
      "endDate": "2024-12-31"
    }
  }'
```

## 🔒 Security Features

- **Parameter Validation**: 150 character limit, no script injection
- **Rate Limiting**: 10 requests per minute per IP
- **API Key Authentication**: Secure link creation
- **HTTPS Enforcement**: All redirects use secure protocols

## 💡 Advanced Use Cases

### Multi-Product Brochures
```
Template: category/{{category}}/product/{{productId}}?page={{page}}
QR Code: https://your-rowt-domain.com/XYZ789?category=electronics&productId=12345&page=2
Result: yourapp://category/electronics/product/12345?page=2
```

### User-Specific Links
```
Template: user/{{userId}}/dashboard?welcome={{isNew}}
QR Code: https://your-rowt-domain.com/USER123?userId=67890&isNew=true
Result: yourapp://user/67890/dashboard?welcome=true
```

### Campaign Tracking
```
Template: promo/{{promoCode}}?source={{source}}&medium={{medium}}
QR Code: https://your-rowt-domain.com/PROMO24?promoCode=SAVE20&source=brochure&medium=print
Result: yourapp://promo/SAVE20?source=brochure&medium=print
```

## 🚨 Troubleshooting

**QR Code Not Working?**
- Verify your project configuration (app store IDs, URL schemes)
- Test the deep link URL directly in a browser
- Check mobile app URL scheme registration

**App Not Opening?**
- Confirm URL scheme matches exactly between Rowt and your app
- Test deep link handling in your mobile app
- Verify app is installed on test device

**Wrong Store Redirect?**
- Check `appstoreId` and `playstoreId` in project configuration
- Ensure IDs match your published apps

## 📞 Support

For additional help:
- Check the [Rowt Documentation](/)
- Review [Parameterized Links Guide](/PARAMETERIZED_LINKS.md)
- Test your setup with the provided examples

---

**Ready to create smart QR codes that boost your mobile app engagement!** 🚀
