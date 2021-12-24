import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import * as pk from '../package.json';
import { SECRET_COOKIE } from '../config/configuration';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const options = new DocumentBuilder()
    .setTitle(pk.name)
    .setDescription(pk.description)
    .setVersion(pk.version)
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('apiDoc', app, document);
  app.use(cookieParser(SECRET_COOKIE));
  app.enableCors();
  await app.listen(parseInt(process.env.PORT || '3000', 10));
}
bootstrap();
