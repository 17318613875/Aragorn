import { Controller, Get, Param, Request, Ip, UseGuards } from '@nestjs/common';
import { GeneralService } from './general.service';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('general')
export class GeneralController {
  constructor(private readonly generalService: GeneralService) {}

  // 素材包查询接口
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('/mat/list')
  getMatList(@Request() req, @Param() params: any, @Ip() ip: string) {
    return this.generalService.getMatList(req, params || {}, ip);
  }

  // 配置查询接口
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('/mat/options')
  getOption(@Request() req, @Param() params: any, @Ip() ip: string) {
    return this.generalService.getOption(req, params || {}, ip);
  }
}
