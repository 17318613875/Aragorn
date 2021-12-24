import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { SECRET } from '../../config/configuration';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserInfo } from '../app.dto';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: SECRET,
    });
  }

  async validate(userInfo: UserInfo) {
    return userInfo;
  }
}
