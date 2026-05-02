import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filter/http-exception.filter.js';
// import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { TokenGuards } from './module/auth/guards/token.guard.js';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    snapshot: true,
  });

  app.use(cookieParser());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalGuards(
    new TokenGuards(app.get(Reflector), app.get(CACHE_MANAGER))
  );
  // const config = new DocumentBuilder()
  //   .setTitle('Todo API')
  //   .setDescription('Example API with validation and Swagger')
  //   .setVersion('1.0')
  //   .addBearerAuth()
  //   .build();
  // const document = SwaggerModule.createDocument(app, config);
  // SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
  console.log(`NestJS server is connecting on port ${process.env.PORT}`);
}
await bootstrap();
