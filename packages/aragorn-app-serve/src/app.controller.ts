import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AppService } from './app.service';
import { LoginDTO, RefreshTokenDTO } from './app.dto';
import { AuthService } from './auth/auth.service';
import { ApiBearerAuth } from '@nestjs/swagger';
import { LocalAuthGuard } from './auth/local-auth.guard';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import * as svgCaptcha from 'svg-captcha';
import { IsDevelopment, SECRET_COOKIE } from '../config/configuration';
import { Response } from 'express';
import * as cookieParser from 'cookie-parser';

@Controller('api')
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly authService: AuthService,
  ) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('update/client/releases')
  getUpdateClientReleases() {
    return this.appService.getUpdateClientReleases();
  }

  @Get('config/client/setting')
  getConfigClientSetting() {
    return this.appService.getConfigClientSetting();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('config/client/uploader')
  getConfigClientUploader() {
    return this.appService.getConfigClientUploader();
  }

  @Get('auth/code')
  async code(@Res() res: Response) {
    var captcha = svgCaptcha.create({
      width: 105,
      height: 35,
      fontSize: 42,
      charPreset: IsDevelopment ? '1' : '0123456789',
    });
    res.cookie('code', captcha.text, {
      signed: true,
    });
    res.type('svg');
    res.status(200).send(captcha.data);
  }

  @UseGuards(LocalAuthGuard)
  @Post('auth/login/:code/:deCode')
  async login(
    @Request() req,
    @Body() body: LoginDTO,
    @Param() params: { code: string; deCode: string },
  ) {
    const { deCode } = cookieParser.signedCookies(params, SECRET_COOKIE);
    if (deCode === params.code || true) {
      return this.authService.login(req.user);
    } else {
      throw new BadRequestException('验证码错误');
    }
  }

  @Post('auth/refresh_token')
  async refreshToken(@Request() req, @Body() body: RefreshTokenDTO) {
    return this.authService.refreshToken(body.refresh_token);
  }

  @UseGuards(LocalAuthGuard)
  @Get('auth/logout')
  async logout(@Request() req) {
    return {};
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('auth/menus')
  async menus(@Request() req) {
    return this.authService.menus(req.user);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get()
  getHello(@Request() req): string {
    return req.user;
  }
}
