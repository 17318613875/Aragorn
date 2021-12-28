import { basename } from 'path';
import { v4 as uuidv4 } from 'uuid';
import mime from 'mime-types';
import { AragornCore } from 'aragorn-core';
import { Ipc } from './ipc';
import { Setting } from './setting';
import { historyStore } from './store';
import { UploadedFileInfo } from './uploaderManager';
import { UploaderProfile, UploaderProfileManager } from './uploaderProfileManager';
import { GetFileType } from './fileType';

export class History {
  private static instance: History;
  core: AragornCore;
  setting: Setting;
  uploaderProfileManager: UploaderProfileManager;

  static getInstance() {
    if (!History.instance) {
      History.instance = new History();
    }
    return History.instance;
  }

  uploadedFiles: UploadedFileInfo[];

  private constructor() {
    this.core = new AragornCore();
    this.uploadedFiles = historyStore.get('history', []) as UploadedFileInfo[];
    this.setting = Setting.getInstance();
    this.uploaderProfileManager = UploaderProfileManager.getInstance();
  }

  add(uploadedFiles: UploadedFileInfo[]) {
    console.log('add uplpad history');
    this.uploadedFiles.unshift(...uploadedFiles);
    historyStore.set('history', this.uploadedFiles);
    // 添加后 异步加载文件信息
    this.updateFileInfoByIds(uploadedFiles.map(item => item.id));
    return this.uploadedFiles;
  }

  // 通过路径添加文件
  async addFileByFilesPath(filesPath: string[], mergeData: any = {}) {
    console.log('add uplpad history by filesPath');
    if (!(Array.isArray(filesPath) && filesPath.findIndex(id => id && typeof id !== 'string') < 0)) {
      console.error('addFileByFilesPath [filesPath type error]');
      return;
    }
    const {
      configuration: { defaultUploaderProfileId, rename, renameFormat }
    } = this.setting;
    const uploaderProfiles = this.uploaderProfileManager.getAll();
    let uploaderProfile: UploaderProfile | undefined;
    uploaderProfile = uploaderProfiles.find(
      uploaderProfile => uploaderProfile.id === (mergeData?.customUploaderProfileId || defaultUploaderProfileId)
    );
    const uploadedFiles = filesPath.map(file => {
      const fileName = this.core.getFileNameByFormat(file, rename, renameFormat, false);
      const fileType = mime.lookup(file);
      return {
        ...mergeData,
        id: uuidv4(),
        name: basename(fileName),
        type: fileType,
        path: typeof file === 'string' ? file : '',
        date: new Date().getTime(),
        uploaderProfileId: uploaderProfile?.id || '',
        status: 0
      };
    });
    this.uploadedFiles.unshift(...uploadedFiles);
    historyStore.set('history', this.uploadedFiles);
    // 添加后 异步加载文件信息
    this.updateFileInfoByIds(uploadedFiles.map(item => item.id));
    return this.uploadedFiles;
  }

  // 通过 文件IDs 写入/Merge文件信息
  async updateFileInfoByIds(ids: string[], mergeData?: any) {
    console.log('update upload history file info');
    if (!(Array.isArray(ids) && ids.findIndex(id => id && typeof id !== 'string') < 0)) {
      console.error('updateFileInfoByIds [ids type error]');
      return;
    }
    if (mergeData && typeof mergeData !== 'object') {
      console.error('updateFileInfoByIds [mergeData type error]');
      return;
    }
    try {
      ids.forEach(async id => {
        const target = this.uploadedFiles.find(item => item.id === id);
        if (!target) {
          console.error(`updateFileInfoByIds [not found ${id}]`);
          return;
        }
        if (mergeData) {
          Object.assign(target, mergeData);
          historyStore.set('history', this.uploadedFiles);
          Ipc.sendMessage('uploaded-files-get-reply', this.uploadedFiles);
        } else {
          const result = await GetFileType(target.path);
          // const result = { code: 'success', data: { md5: Date.now() } };
          if (result.code === 'success') {
            Object.assign(target, result.data, { status: 1 });
          } else {
            Object.assign(target, { status: 0 });
            console.error('updateFileInfoByIds md5 =>', target.path, result);
          }
          historyStore.set('history', this.uploadedFiles);
          Ipc.sendMessage('uploaded-files-get-reply', this.uploadedFiles);
        }
      });
    } catch (error) {
      console.error('updateFileInfoByIds handle =>', error);
    }
  }

  clear(ids: string[]) {
    console.log('clear upload history');
    ids.forEach(id => {
      const index = this.uploadedFiles.findIndex(item => item.id === id);
      if (index > -1) {
        this.uploadedFiles.splice(index, 1);
      }
    });
    historyStore.set('history', this.uploadedFiles);
    return this.uploadedFiles;
  }

  get() {
    console.log('get all upload history');
    return this.uploadedFiles;
  }
}
