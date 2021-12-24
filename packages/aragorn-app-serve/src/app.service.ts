import { Injectable } from '@nestjs/common';
import {
  ClientSetting,
  ClientUpdateInfo,
  ClientUploader,
} from '../config/clientUpdate';

@Injectable()
export class AppService {
  getUpdateClientReleases(): any[] {
    return ClientUpdateInfo;
  }
  getConfigClientSetting(): any[] {
    return ClientSetting;
  }
  getConfigClientUploader(): any[] {
    return ClientUploader;
  }
}
