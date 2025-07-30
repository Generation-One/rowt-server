import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { webcrypto } from 'crypto';
// import { GlobalExceptionFilter } from './utils/global-exception.filter';
// import { ValidationPipe } from './utils/validation.pipe';
if (!globalThis.crypto) {
  globalThis.crypto = webcrypto as any;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { abortOnError: false });
  app.enableCors({
    origin: true,
    credentials: true, // Allow cookies and credentials
  });

  // Needs testing and fixes - Apply global validation pipe
  // app.useGlobalPipes(
  //   new ValidationPipe({
  //     whitelist: true, // Strip properties not in DTO
  //     forbidNonWhitelisted: true, // Throw error if extra properties are sent
  //     transform: true, // Transform payloads to instances of DTO
  //     skipMissingProperties: true, // Missing properties are not validated
  //   }),
  // );

  // Needs testing and rewrites of all error handling - Apply global exception filter
  // app.useGlobalFilters(new GlobalExceptionFilter());

  const port = process.env.PORT || 8080;
  await app.listen(port, '0.0.0.0', () => {
    console.log(`Application is running on port: ${port}`);

    // Build and version information
    const buildDate = new Date().toISOString();
    const packageVersion = process.env.npm_package_version || '1.0.0';
    console.log(`🚀 Rowt Server v${packageVersion}`);
    console.log(`📅 Build timestamp: ${buildDate}`);
    console.log(`🔧 Database sync enabled: ${process.env.ROWT_DB_SYNC || 'false'}`);
    console.log(`🏢 Tenant mode: ${process.env.ROWT_TENANT_MODE || 'single-tenant'}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📦 Latest update: Database table creation fix (2025-07-30)`);
  });
}
bootstrap();
