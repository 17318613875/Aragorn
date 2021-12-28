import { BadRequestException, HttpService, Injectable } from '@nestjs/common';
import { GENERAL_URL, SECRETID, SECRETKEY } from 'config/configuration';
import GetSign from 'libs/getSign';
import { catchError, map } from 'rxjs';
import { BuildHeaders } from '../../libs/utils';

@Injectable()
export class GeneralService {
  secretId: string;
  secretKey: string;
  constructor(private http: HttpService) {
    this.secretId = SECRETID;
    this.secretKey = SECRETKEY;
  }

  getMatList(req: any, data: any, ip: string) {
    const url = `${GENERAL_URL}general/ls/mat/list`;
    const body = GetSign(
      Object.assign(
        {
          page: 1,
          size: 20,
          // returnFields: 'clipId,unitedClipId,materialName',
        },
        data,
      ),
      '68e6a325938dca6972a13a91e02147c3',
      'media_gen_library_upload_2021',
    );
    return this.http
      .post(url, body, {
        headers: BuildHeaders(req, ip),
      })
      .pipe(
        map(({ statusText, status, data }) => {
          if (status === 200) {
            const { code, msg } = data;
            if (code === 200) {
              return data.data;
            } else {
              throw new BadRequestException({
                message: `[${code}]${msg}`,
              });
            }
          } else {
            throw new BadRequestException({
              message: statusText,
            });
          }
        }),
        catchError((error) => {
          throw new BadRequestException({
            message: error.message,
          });
        }),
      );
  }

  getOption(req: any, data: any, ip: string) {
    const url = `${GENERAL_URL}general/ls/geOption/getAll`;
    const body = GetSign(
      data,
      '68e6a325938dca6972a13a91e02147c3',
      'media_gen_library_upload_2021',
    );
    return this.http
      .post(url, body, {
        headers: BuildHeaders(req, ip),
      })
      .pipe(
        map(({ statusText, status, data }) => {
          if (status === 200) {
            const { code, msg } = data;
            if (code === 200) {
              return ((Array.isArray(data.data) && data.data) || []).map(
                (item) => {
                  try {
                    item.option = JSON.parse(item.optionValue);
                  } catch (error) {}
                  return item;
                },
              );
            } else {
              throw new BadRequestException({
                message: `[${code}]${msg}`,
              });
            }
          } else {
            throw new BadRequestException({
              message: statusText,
            });
          }
        }),
        catchError((error) => {
          throw new BadRequestException({
            message: error.message,
          });
        }),
      );
  }
}
