import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createCipheriv, createDecipheriv } from 'crypto';
import { omit } from 'lodash';
import { UserInfo } from '../app.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.usersService.findOne({ username, password });
    return user;
  }

  async login(user: UserInfo) {
    const refresh_token = genSign(user.token);
    return {
      access_token: this.jwtService.sign(user),
      refresh_token,
      userInfo: omit(user, ['token']),
    };
  }

  async menus(user: UserInfo) {
    const menus = await this.usersService.getMenus(user);
    return JSON.stringify(menus, (key, value) => {
      if (typeof value === 'function') {
        return value.toString();
      }
      return value;
    });
  }

  async refreshToken(accessToken: string) {
    const token = deSign(accessToken);
    const user = await this.usersService.findOne({
      token,
    });
    if (user) {
      return {
        access_token: this.jwtService.sign(user),
      };
    } else {
      throw new UnauthorizedException('Token不可用');
    }
  }
}

const key = Buffer.from('eTwKSiRrV7ldHi86', 'utf8');
const iv = Buffer.from('p0kTvOSoSXq56dO2', 'utf8');
// 加密
function genSign(src: string) {
  let sign = '';
  const cipher = createCipheriv('aes-128-cbc', key, iv);
  sign += cipher.update(src, 'utf8', 'hex');
  sign += cipher.final('hex');
  return sign;
}

// 解密
function deSign(sign: string) {
  let src = '';
  const cipher = createDecipheriv('aes-128-cbc', key, iv);
  src += cipher.update(sign, 'hex', 'utf8');
  src += cipher.final('utf8');
  return src;
}
