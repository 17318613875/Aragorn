import { ApiProperty } from '@nestjs/swagger';

export class LoginDTO {
  @ApiProperty({ description: 'OA账户', required: false })
  username?: string;

  @ApiProperty({ description: 'OA密码', required: false })
  password?: string;

  @ApiProperty({ description: '验证码', required: false })
  code?: string;

  @ApiProperty({ description: 'token', required: false })
  token?: string;
}

export class RefreshTokenDTO {
  @ApiProperty({ description: '传入登录获取的refresh_token' })
  refresh_token: string = '';
}

export type UserInfo = {
  id: number;
  email: string;
  nickName: string;
  phone: string;
  token: string;
  userAccount: string;
};
