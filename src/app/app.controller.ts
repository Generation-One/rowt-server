import {
  Controller,
  Get,
  Ip,
  Param,
  Query,
  Req,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response as ExpressResponse } from 'express';
import { Request as ExpressRequest } from 'express';
import { AppService } from './app.service';
import { Public } from 'src/auth/public.guard';
import { Throttle } from '@nestjs/throttler';
import { readHtmlFile } from 'src/utils/readHtmlFile';
import { getCountry } from 'src/utils/getCountry';
import { generateMetaTags } from './app.model';
import { CreateLinkDTO } from 'src/links/dto/createLink.dto';
import { WellKnownService } from 'src/well-known/well-known.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly wellKnownService: WellKnownService,
  ) {}

  private escapeHtml(unsafe: string): string {
    if (!unsafe) return '';
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  @Public()
  @Get('health') // Health check endpoint for Docker and monitoring
  getHealth(): object {
    const packageJson = require('../../package.json');
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'rowt-server',
      version: packageJson.version || '1.0.1',
      buildInfo: {
        dbSyncEnabled: process.env.ROWT_DB_SYNC || 'false',
        tenantMode: process.env.ROWT_TENANT_MODE || 'single-tenant',
        nodeEnv: process.env.NODE_ENV || 'development',
        lastUpdate: 'Database table creation fix (2025-07-30)'
      }
    };
  }

  @Public()
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  @Get('.well-known/:filename')
  async getWellKnownFile(
    @Param('filename') filename: string,
    @Res() res: ExpressResponse,
  ): Promise<void> {
    try {
      const file = await this.wellKnownService.getPublicFile(filename);

      if (!file) {
        res.status(404).json({ message: 'Well-known file not found' });
        return;
      }

      // Set appropriate headers
      res.setHeader('Content-Type', file.contentType);
      res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
      res.setHeader('Access-Control-Allow-Origin', '*');

      res.send(file.content);
    } catch (error) {
      console.error('Error serving well-known file:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  @Public()
  @Get() // Base route returns a default help dialog
  getHello(@Res() res: ExpressResponse): void {
    const htmlContent = readHtmlFile('src/pages/help.html');

    // Send the HTML content as the response
    res.send(htmlContent);
  }

  @Public()
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  @Get('error')
  getError() {
    return readHtmlFile('src/pages/error.html');
  }

  @Public()
  @Get('link')
  async RejectGet() {
    return readHtmlFile('src/pages/rejectGet.html');
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Get(':shortCode') // Main redirection logic to the link
  async getLink(
    @Param('shortCode') shortCode: string,
    @Query() queryParams: Record<string, string>,
    @Req() request: Request,
    @Ip() ip: string,
    @Res() response: ExpressResponse,
  ) {
    try {
      console.log('Redirecting to:', shortCode);
      const link = await this.appService.findLinkByShortCode(shortCode);
      if (!link) {
        console.error('Link not found:', shortCode);
        return response.status(307).redirect('./error');
      }
      console.log('link project:', link.project);

      if (!link.project) {
        console.error('Link project not found:', shortCode);
        return response.status(307).redirect('./error');
      }

      console.log('All headers:', request.headers);
      console.log(`language code: ${request.headers['accept-language']}`);
      console.log(`request timezone: ${request.headers['timezone']}`);
      console.log(`x-timezone: ${request.headers['x-timezone']}`);
      const timezone =
        request.headers['timezone'] ||
        (request.headers['x-timezone'] as string) ||
        null;
      const languageCode = request.headers['accept-language'] || null;

      // Validate timezone before using it
      const country = getCountry(timezone, languageCode) || null;
      const isValidCountry =
        typeof country === 'string' && country.trim().length > 0;

      // Send interaction log to database asynchronously to avoid delaying the response
      this.appService
        .logInteraction({
          shortCode,
          country: isValidCountry ? country : null,
          referer:
            request.headers['referer'] ||
            request.headers['referrer'] ||
            request.headers['origin'] ||
            null,
          userAgent: request.headers['user-agent'],
        })
        .catch((err) => console.error('Error logging interaction:', err));

      // Detect platform (case-insensitive)
      const userAgent = (request.headers['user-agent'] || '').toLowerCase();
      const isIOS = /ipad|iphone|ipod/.test(userAgent);
      const isAndroid = /android/.test(userAgent);

      // Check if this is an HTTP(S) URL or a deep link
      const isHttpUrl = link.url.includes('http://') || link.url.includes('https://');

      // Get the final URL (with parameters substituted)
      const finalLink = this.appService.openAppOnUserDevice(
        link,
        request.headers['user-agent'],
        queryParams,
      );

      // Set up fallback URLs
      const regularFallback =
        link.fallbackUrlOverride || link.project.fallbackUrl || finalLink;

      // Determine store URLs if available
      let appStoreUrl: string | null = null;
      let playStoreUrl: string | null = null;

      if (isIOS && link.project.appstoreId) {
        appStoreUrl = `https://apps.apple.com/app/id${this.escapeHtml(link.project.appstoreId)}`;
      }

      if (isAndroid && link.project.playstoreId) {
        playStoreUrl = `https://play.google.com/store/apps/details?id=${this.escapeHtml(link.project.playstoreId)}`;
      }

      // Determine what to do based on URL type and platform
      let shouldUseDirectRedirect = false;
      let directRedirectUrl: string | null = null;

      // For HTTP(S) URLs on mobile with app stores configured, redirect directly to store
      // (Universal Links/App Links will handle opening the app if installed)
      if (isHttpUrl) {
        if (isIOS && appStoreUrl) {
          shouldUseDirectRedirect = true;
          directRedirectUrl = appStoreUrl;
        } else if (isAndroid && playStoreUrl) {
          shouldUseDirectRedirect = true;
          directRedirectUrl = playStoreUrl;
        }
      }

      // Generate metadata for the link - PROPERLY ESCAPED
      const metadata = {
        title: this.escapeHtml(link.title || 'Redirecting...'),
        description: this.escapeHtml(link.description || ''),
        imageUrl: this.escapeHtml(link.imageUrl || ''),
      };

      // Return a redirect page
      return response.status(200).set('Content-Type', 'text/html').send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta property="og:title" content="${metadata.title}" />
          <meta property="og:description" content="${metadata.description}" />
          <meta property="og:image" content="${metadata.imageUrl}" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="${metadata.title}" />
          <meta name="twitter:description" content="${metadata.description}" />
          <meta name="twitter:image" content="${metadata.imageUrl}" />
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>${metadata.title}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              text-align: center;
              padding: 20px;
              margin: 0;
              color: #333;
              background-color: #f9f9f9;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
            }
            .loader {
              width: 40px;
              height: 40px;
              border: 3px solid rgba(0,0,0,.1);
              border-radius: 50%;
              border-top-color: #3498db;
              animation: spin 1s ease-in-out infinite;
              margin: 0 auto 20px auto;
            }
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
            .redirect-message {
              font-size: 18px;
              opacity: 0.7;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="loader"></div>
            <div class="redirect-message">Redirecting...</div>
          </div>

          <script>
            // Check if we should do a direct redirect (for HTTPS URLs on mobile)
            const shouldDirectRedirect = ${shouldUseDirectRedirect};
            const directRedirectUrl = ${directRedirectUrl ? '"' + directRedirectUrl.replace(/"/g, '\\"') + '"' : 'null'};

            if (shouldDirectRedirect && directRedirectUrl) {
              // For HTTPS URLs on mobile: redirect directly to App Store/Play Store
              // This uses window.location.href so iOS/Android can intercept and open the store app
              window.location.href = directRedirectUrl;
            } else {
              // For custom deep links: use timeout-based detection

              // Variables to track app opening status
              let appOpened = false;
              let pageHidden = false;

              // Track page visibility changes
              document.addEventListener('visibilitychange', function() {
                if (document.hidden) {
                  pageHidden = true;
                  appOpened = true;
                }
              });

              // Track page blur
              window.addEventListener('blur', function() {
                appOpened = true;
              });

              // Platform detection
              const isIOS = ${isIOS};
              const isAndroid = ${isAndroid};

              // Deep link to try to open the app
              const deepLink = "${finalLink.replace(/"/g, '\\"')}";

              // Fallback URLs
              const regularFallback = "${regularFallback.replace(/"/g, '\\"')}";
              const appStoreUrl = ${appStoreUrl ? '"' + appStoreUrl.replace(/"/g, '\\"') + '"' : 'null'};
              const playStoreUrl = ${playStoreUrl ? '"' + playStoreUrl.replace(/"/g, '\\"') + '"' : 'null'};

              // Try to open the app
              function openApp() {
                window.location.href = deepLink;
              }

              // Function to handle fallback based on platform
              function handleFallback() {
                if (!appOpened && !pageHidden) {
                  // App didn't open, so use the appropriate fallback
                  if (isIOS && appStoreUrl) {
                    // Navigate to App Store if on iOS and app store ID is available
                    window.location.href = appStoreUrl;
                  } else if (isAndroid && playStoreUrl) {
                    // Navigate to Play Store if on Android and play store ID is available
                    window.location.href = playStoreUrl;
                  } else {
                    // Desktop/Windows or no store configured: redirect to the actual link URL
                    window.location.href = deepLink;
                  }
                }
              }

              // Open the app immediately
              openApp();

              // Set appropriate timeout based on platform
              if (isIOS) {
                setTimeout(handleFallback, 2000);
              } else if (isAndroid) {
                setTimeout(handleFallback, 1500);
              } else {
                setTimeout(handleFallback, 1000);
              }
            }
          </script>
        </body>
        </html>
      `);
    } catch (error) {
      console.error('Error in getLink:', error);
      return response.status(307).redirect('./error');
    }
  }
}
