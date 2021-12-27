import { BadRequestException, HttpService, Injectable } from '@nestjs/common';
import { ACL_URL, ACLAPPID } from '../../config/configuration';
import { merge, pick } from 'lodash';
import { LoginDTO, UserInfo } from '../app.dto';
import { MaterialCommonPageConfig } from '../../config/material/common';

export type User = any;
@Injectable()
export class UsersService {
  constructor(private http: HttpService) {}
  async findOne(body: LoginDTO): Promise<User | undefined> {
    try {
      const { status, data, statusText } = (await this.http
        .post(`${ACL_URL}media/auth/user/login`, {
          appId: ACLAPPID,
          data: Object.assign({}, body, {
            userAccount: body.username,
            userPassword: body.password,
            username: undefined,
            password: undefined,
          }),
        })
        .toPromise()) || {
        status: undefined,
        data: undefined,
        statusText: undefined,
      };
      if (status === 200) {
        const { code, msg, message } = data;
        if (code === 200) {
          const { userDo, token } = data.data;
          return pick(Object.assign({ token }, userDo), [
            'id',
            'email',
            'nickName',
            'phone',
            'token',
            'userAccount',
          ]);
        } else {
          throw new BadRequestException({
            message: `[${code}]${msg || message}`,
          });
        }
      } else {
        throw new BadRequestException({
          message: `[${status}]${statusText}`,
        });
      }
    } catch (error: any) {
      throw new BadRequestException({
        message: error.message,
      });
    }
  }
  async getMenus(user: UserInfo): Promise<User | undefined> {
    try {
      const result: any = await this.http
        .post(`${ACL_URL}media/auth/permission/getMenuByUser`, {
          data: {
            appId: ACLAPPID,
            userId: user.id,
          },
        })
        .toPromise();
      const { status, data, statusText } = result;
      if (status === 200) {
        const { code, msg, message } = data;
        if (code === 200) {
          return data.data.map(
            ({ id, menuName, parentId, orderNum, link, icon, actionList }) => {
              const menuObj = {
                id,
                menuName,
                parentId,
                orderNum,
                link,
                icon,
                actionList: actionList.map(
                  ({ actionCode, actionName, permission }) => ({
                    actionCode,
                    actionName,
                    permission,
                  }),
                ),
              };
              switch (link) {
                case '/material/common':
                  Object.assign(menuObj, {
                    type: 'page',
                    config: MaterialCommonPageConfig,
                  });
                  break;
                default:
                  break;
              }
              return menuObj;
            },
          );
        } else {
          throw new BadRequestException({
            message: `[${code}]${msg || message}`,
          });
        }
      } else {
        throw new BadRequestException({
          message: `[${status}]${statusText}`,
        });
      }
    } catch (error: any) {
      throw new BadRequestException({
        message: error.message,
      });
    }
  }
}
