/* eslint-disable no-param-reassign */
import { Notification, clipboard, app } from 'electron';
import mime from 'mime-types';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import fs from 'fs';
import path from 'path';
import xlsx from 'xlsx';
import { Setting } from './setting';
import { History } from './history';
import { UploaderProfile, UploaderProfileManager } from './uploaderProfileManager';
import { AragornCore } from 'aragorn-core';
import { Ipc } from './ipc';

type Status = 0 | 1 | 2 | 3 | 4; // 初始化中 等待上传 上传中 上传完成 上传失败
/** 上传成功之后的文件信息 */
export interface UploadedFileInfo {
  id: string;
  name?: string;
  url?: string;
  md5?: string;
  plat?: number;
  uploader?: string;
  status?: number;
  process?: number;
  /** 文件类型 MimeType */
  type: string;
  /** 上传器配置 Id */
  uploaderProfileId: string;
  /** 文件路径 */
  path: string;
  /** 文件大小 */
  size?: number;
  /** 上传时间 */
  date: number;
  errorMessage?: string;
}

export interface FileFormData {
  originalname: string;
  mimetype: string;
  encoding?: string;
  buffer: Buffer;
  size?: number;
  fieldname?: string;
}

interface UploadOptions {
  files: (string | FileFormData)[];
  customUploaderProfileId?: string;
  directoryPath?: string;
  isFromFileManage?: boolean;
  testProfile?: UploaderProfile;
  isTest?: boolean;
}

export class UploaderManager {
  private static instance: UploaderManager;

  static getInstance() {
    if (!UploaderManager.instance) {
      UploaderManager.instance = new UploaderManager();
    }
    return UploaderManager.instance;
  }

  core: AragornCore;
  setting: Setting;
  history: History;
  uploaderProfileManager: UploaderProfileManager;

  protected constructor() {
    this.core = new AragornCore();

    this.setting = Setting.getInstance();
    this.history = History.getInstance();
    this.uploaderProfileManager = UploaderProfileManager.getInstance();
  }

  async uploadByDifferentUploaderProfileIds(data: { id: string; path: string }[]) {
    const uploaderProfileIds = [...new Set(data.map(item => item.id))];
    const newData = uploaderProfileIds.map(id => {
      const filesPath = data.filter(item => item.id === id).map(item => item.path);
      return {
        id,
        filesPath
      };
    });
    newData.forEach(item => {
      this.upload({ files: item.filesPath, customUploaderProfileId: item.id });
    });
  }

  async uploadFromClipboard() {
    // https://github.com/njzydark/electron-clipboard-demo
    console.log('upload from clipboard');
    let filePath: (string | FileFormData)[] = [];

    const clipboardImage = clipboard.readImage('clipboard');
    if (!clipboardImage.isEmpty()) {
      console.log('upload image from clipboard');
      const png = clipboardImage.toPNG();
      const fileInfo: FileFormData = {
        buffer: png,
        mimetype: 'image/png',
        originalname: uuidv4() + '.png'
      };
      filePath = [fileInfo];
    }

    if (process.platform === 'darwin') {
      // https://github.com/electron/electron/issues/9035#issuecomment-359554116
      if (clipboard.has('NSFilenamesPboardType')) {
        filePath =
          clipboard
            .read('NSFilenamesPboardType')
            .match(/<string>.*<\/string>/g)
            ?.map(item => item.replace(/<string>|<\/string>/g, '')) || [];
      } else {
        if (filePath.length === 0) {
          filePath = [clipboard.read('public.file-url').replace('file://', '')].filter(item => item);
        }
      }
    } else {
      // https://github.com/electron/electron/issues/9035#issuecomment-536135202
      // https://docs.microsoft.com/en-us/windows/win32/shell/clipboard#cf_hdrop
      // https://www.codeproject.com/Reference/1091137/Windows-Clipboard-Formats
      if (clipboard.has('CF_HDROP')) {
        const rawFilePathStr = clipboard.readBuffer('CF_HDROP').toString('ucs2');
        let formatFilePathStr = [...rawFilePathStr]
          .filter((_, index) => rawFilePathStr.charCodeAt(index) !== 0)
          .join('')
          .replace(/\\/g, '\\');

        const drivePrefix = formatFilePathStr.match(/[a-zA-Z]:\\/);

        if (drivePrefix) {
          const drivePrefixIndex = formatFilePathStr.indexOf(drivePrefix[0]);
          if (drivePrefixIndex !== 0) {
            formatFilePathStr = formatFilePathStr.substring(drivePrefixIndex);
          }
          filePath = formatFilePathStr
            .split(drivePrefix[0])
            .filter(item => item)
            .map(item => drivePrefix + item);
        }
      } else {
        if (filePath.length === 0) {
          filePath = [
            clipboard
              .readBuffer('FileNameW')
              .toString('ucs2')
              .replace(RegExp(String.fromCharCode(0), 'g'), '')
          ].filter(item => item);
        }
      }
    }
    console.log(`get file path from clipboard: ${filePath}`);
    if (filePath.length > 0) {
      this.upload({ files: filePath });
    }
  }

  async handleUploadTest(testProfile: UploaderProfile) {
    console.log('test uploader profile');
    const data: UploadOptions = {
      files: [path.resolve(__dirname, '../assets/icon.png')],
      directoryPath: 'aragorn-upload-test',
      testProfile,
      isTest: true
    };
    this.upload(data);
  }

  // 通过文件路径开始上传
  async fileUploadByFilesId(ids: string[], customUploaderProfileId?: string) {
    if (!(Array.isArray(ids) && ids.findIndex(id => id && typeof id !== 'string') < 0)) {
      console.error('fileUploadByFilesId [ids type error]');
      return;
    }
    try {
      // const { files, customUploaderProfileId, directoryPath, isFromFileManage } = uploadOptions;
      console.log('upload by filesPath start', ids);
      const {
        configuration: { defaultUploaderProfileId, proxy, rename, renameFormat }
      } = this.setting;
      const uploaderProfiles = this.uploaderProfileManager.getAll();
      let uploaderProfile = uploaderProfiles.find(
        uploaderProfile => uploaderProfile.id === (customUploaderProfileId || defaultUploaderProfileId)
      );

      let notification: Notification;
      if (!uploaderProfile) {
        if (customUploaderProfileId) {
          console.warn('upload failed: no uploader profile');
          notification = new Notification({ title: '上传操作异常', body: `上传器配置不存在` });
        } else {
          console.warn('upload failed: no default uploader profile');
          const message = uploaderProfiles.length > 0 ? '请配置默认的上传器' : '请添加上传器配置';
          notification = new Notification({ title: '上传操作异常', body: message });
        }
        notification.show();
        return false;
      }

      const uploader = this.core.getUploaderByName(uploaderProfile.uploaderName);

      if (!uploader) {
        console.warn('upload failed: not found uploader');
        const message = `没有找到${uploaderProfile.uploaderName}上传器`;
        const notification = new Notification({ title: '上传操作异常', body: message });
        notification.show();
        return false;
      }

      uploader.changeOptions(uploaderProfile.uploaderOptions, proxy);

      const successRes: UploadedFileInfo[] = [];
      const failRes: UploadedFileInfo[] = [];

      const uploadQuence = [] as any[];
      const allFiles = this.history.get();

      const toUpload = async (id: string, index: number, uploadQuence: any[]) => {
        const baseInfo = allFiles.find(file => file.id === id);
        if (!baseInfo) {
          console.warn('upload failed: not found file');
          const message = `没有找到上传文件`;
          const notification = new Notification({ title: '上传操作异常', body: message });
          notification.show();
          return false;
        }

        if (uploader.batchUploadMode === 'Sequence' && index > 0) {
          await uploadQuence[index - 1];
        }

        const res = await uploader.upload(
          {
            file: baseInfo.path,
            fileName: baseInfo.name || '',
            plat: baseInfo.plat || 1,
            uploader: baseInfo.uploader || 'binbin',
            md5: baseInfo.md5,
            size: baseInfo.size,
            directoryPath: '',
            isFromFileManage: false
          },
          {
            process: (process: number) => {
              console.log('process =>', baseInfo.path, process);
              this.history.updateFileInfoByIds([baseInfo.id], { status: 2, process });
            }
          }
        );
        if (res.success) {
          successRes.push({ ...baseInfo, ...res.data });
        } else {
          failRes.push({ ...baseInfo, errorMessage: res.desc });
        }
      };

      const promises = ids.map((id, index) => {
        const res = toUpload(id, index, uploadQuence);
        uploadQuence.push(res);
        return res;
      });

      this.history.updateFileInfoByIds(ids as string[], { status: 2 });
      await Promise.all(promises);
      this.history.updateFileInfoByIds(
        successRes.map(item => item.id),
        { status: 3, process: 100 }
      );
      this.history.updateFileInfoByIds(
        failRes.map(item => item.id),
        { status: 4, process: 0 }
      );
    } catch (err: any) {
      console.error(`upload error: ${err.message}`);
      const notification = new Notification({ title: '上传操作异常', body: err.message });
      notification.show();
    }
  }

  async upload(uploadOptions: UploadOptions) {
    try {
      console.log('upload start');
      const { files, customUploaderProfileId, directoryPath, isFromFileManage, testProfile, isTest } = uploadOptions;
      const {
        configuration: { defaultUploaderProfileId, proxy, rename, renameFormat }
      } = this.setting;
      const uploaderProfiles = this.uploaderProfileManager.getAll();
      let uploaderProfile: UploaderProfile | undefined;

      if (isTest) {
        uploaderProfile = testProfile;
      } else {
        uploaderProfile = uploaderProfiles.find(
          uploaderProfile => uploaderProfile.id === (customUploaderProfileId || defaultUploaderProfileId)
        );
      }

      if (!uploaderProfile) {
        let notification;
        if (customUploaderProfileId) {
          console.warn('upload failed: no uploader profile');
          notification = new Notification({ title: '上传操作异常', body: `上传器配置不存在` });
        } else {
          console.warn('upload failed: no default uploader profile');
          const message = uploaderProfiles.length > 0 ? '请配置默认的上传器' : '请添加上传器配置';
          notification = new Notification({ title: '上传操作异常', body: message });
        }
        notification.show();
        return false;
      }

      const uploader = this.core.getUploaderByName(uploaderProfile.uploaderName);

      if (!uploader) {
        console.warn('upload failed: not found uploader');
        const message = `没有找到${uploaderProfile.uploaderName}上传器`;
        const notification = new Notification({ title: '上传操作异常', body: message });
        notification.show();
        return false;
      }

      uploader.changeOptions(uploaderProfile.uploaderOptions, proxy);

      const successRes: UploadedFileInfo[] = [];
      const failRes: UploadedFileInfo[] = [];

      const uploadQuence = [] as any[];

      const toUpload = async (file: string | FileFormData, index: number, uploadQuence: any[]) => {
        const fileName = this.core.getFileNameByFormat(
          typeof file === 'string' ? file : file.originalname,
          rename,
          renameFormat,
          isFromFileManage
        );
        const fileType = typeof file === 'string' ? mime.lookup(file) || '-' : file.mimetype;
        const baseInfo = {
          id: uuidv4(),
          name: path.basename(fileName),
          type: fileType,
          path: typeof file === 'string' ? file : '',
          date: new Date().getTime(),
          uploaderProfileId: uploaderProfile?.id || ''
        };

        if (uploader.batchUploadMode === 'Sequence' && index > 0) {
          await uploadQuence[index - 1];
        }

        const res = await uploader.upload({
          file: typeof file === 'string' ? file : file.buffer,
          fileName,
          directoryPath,
          isFromFileManage
        });
        if (res.success) {
          successRes.push({ ...baseInfo, ...res.data });
        } else {
          failRes.push({ ...baseInfo, errorMessage: res.desc });
        }
      };

      const promises = files.map((file, index) => {
        const res = toUpload(file, index, uploadQuence);
        uploadQuence.push(res);
        return res;
      });

      await Promise.all(promises);

      this.handleAddHistory([...failRes, ...successRes]);

      if (isFromFileManage) {
        Ipc.sendMessage('file-upload-reply');
      }

      if (isTest) {
        Ipc.sendMessage('uploader-profile-test-reply', successRes.length > 0);
      }

      if (files.length > 1) {
        this.handleBatchUploaded(successRes.length, failRes.length);
      } else {
        this.handleSingleUploaded(successRes[0], failRes[0]);
      }

      console.log('upload finish');

      return successRes;
    } catch (err: any) {
      console.error(`upload error: ${err.message}`);
      if (uploadOptions.isTest) {
        Ipc.sendMessage('uploader-profile-test-reply', false);
      }
      const notification = new Notification({ title: '上传操作异常', body: err.message });
      notification.show();
    }
  }

  async getFileList(uploaderProfileId: string, directoryPath?: string) {
    console.log('get file list');
    const uploader = this.getUploader(uploaderProfileId);
    if (uploader?.getFileList) {
      const res = await uploader.getFileList(directoryPath);
      Ipc.sendMessage('file-list-get-reply', res);
    } else {
      Ipc.sendMessage('file-list-get-reply');
    }
  }

  async deleteFile(uploaderProfileId: string, fileNames: string[]) {
    console.log('delete file');
    const uploader = this.getUploader(uploaderProfileId);
    if (uploader?.deleteFile) {
      const res = await uploader.deleteFile(fileNames);
      Ipc.sendMessage('file-delete-reply', res);
    } else {
      Ipc.sendMessage('file-delete-reply');
    }
  }

  async createDirectory(uploaderProfileId: string, directoryPath: string) {
    console.log('create directory');
    const uploader = this.getUploader(uploaderProfileId);
    if (uploader?.createDirectory) {
      const res = await uploader.createDirectory(directoryPath);
      Ipc.sendMessage('directory-create-reply', res);
    } else {
      Ipc.sendMessage('directory-create-reply');
    }
  }

  async download(name: string, url: string) {
    try {
      console.log('download start');
      name = path.basename(name);
      const { proxy } = this.setting.configuration;
      await new Promise((resolve, reject) => {
        axios
          .get(url, { responseType: 'stream', httpsAgent: proxy ? new HttpsProxyAgent(proxy) : null })
          .then(res => {
            const totalLength = res.headers['content-length'] as number;
            const writer = fs.createWriteStream(`${app.getPath('downloads')}/${name}`);
            let error: Error | null = null;
            let curLength = 0;
            res.data.on('data', chunk => {
              curLength += chunk.length;
              const progress = curLength / totalLength;
              if (totalLength !== undefined) {
                Ipc.sendMessage('file-download-progress', { name, progress, key: name });
              }
            });
            res.data.pipe(writer);
            writer.on('error', err => {
              error = err;
              writer.close();
              reject(err);
            });
            writer.on('close', () => {
              if (!error) {
                console.log('download finish');
                totalLength === undefined && Ipc.sendMessage('file-download-reply');
                resolve(true);
              }
            });
          })
          .catch(reject);
      });
    } catch (err: any) {
      console.error(`download error: ${err.message}`);
      Ipc.sendMessage('file-download-reply', err.message || '下载失败');
    }
  }

  async export(data: { name: string; url: string }[]) {
    const nameLength = data.map(item => item.name.length);
    const urlLength = data.map(item => item.url.length);
    let jsonWorkSheet = xlsx.utils.json_to_sheet(data);
    jsonWorkSheet['!cols'] = [
      {
        wch: Math.max(...nameLength)
      },
      {
        wch: Math.max(...urlLength)
      }
    ];
    let workBook = {
      SheetNames: ['pic'],
      Sheets: {
        pic: jsonWorkSheet
      }
    };
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hour = date.getHours();
    const minute = date.getMinutes();
    const seconds = date.getSeconds();
    const filePath = `${app.getPath('downloads')}/pic_${year}${month}${day}${hour}${minute}${seconds}.xlsx`;
    xlsx.writeFile(workBook, filePath);
    Ipc.sendMessage('export-reply', filePath);
  }

  protected getUploader(id: string) {
    const { proxy } = this.setting.configuration;
    const uploaderProfiles = this.uploaderProfileManager.getAll();
    const uploaderProfile = uploaderProfiles.find(uploaderProfile => uploaderProfile.id === id);
    if (!uploaderProfile) {
      return;
    }
    const uploader = this.core.getUploaderByName(uploaderProfile.uploaderName);
    if (uploader) {
      uploader.changeOptions(uploaderProfile.uploaderOptions, proxy);
      return uploader;
    }
  }

  protected handleBatchUploaded(successFilesCount: number, failFilesCount: number) {
    if (failFilesCount === 0) {
      const notification = new Notification({ title: '批量上传成功', body: `总共${successFilesCount}个文件` });
      notification.show();
    } else if (successFilesCount === 0) {
      const notification = new Notification({ title: '批量上传失败', body: `总共${failFilesCount}个文件` });
      notification.show();
    } else {
      const notification = new Notification({
        title: '批量上传结束',
        body: `成功${successFilesCount}个，失败${failFilesCount}个`
      });
      notification.show();
    }
  }

  protected handleSingleUploaded(successFile: UploadedFileInfo, failFile: UploadedFileInfo) {
    if (successFile) {
      // 根据urlType转换图片链接格式
      let clipboardUrl = successFile.url;
      switch (this.setting.configuration.urlType) {
        case 'URL':
          break;
        case 'HTML':
          clipboardUrl = `<img src="${successFile.url}" />`;
          break;
        case 'Markdown':
          clipboardUrl = `![${successFile.url}](${successFile.url})`;
          break;
        default:
          return successFile.url;
      }
      if (this.setting.configuration.autoCopy) {
        let preClipBoardText = '';
        if (this.setting.configuration.autoRecover) {
          preClipBoardText = clipboard.readText();
        }
        // 开启自动复制
        clipboard.writeText(clipboardUrl || '');
        const notification = new Notification({
          title: '上传成功',
          body: '链接已自动复制到粘贴板',
          silent: !this.setting.configuration.sound
        });
        this.setting.configuration.showNotifaction && notification.show();
        this.setting.configuration.autoRecover &&
          setTimeout(() => {
            clipboard.writeText(preClipBoardText);
            const notification = new Notification({
              title: '粘贴板已恢复',
              body: '已自动恢复上次粘贴板中的内容',
              silent: !this.setting.configuration.sound
            });
            notification.show();
          }, 5000);
      } else {
        const notification = new Notification({
          title: '上传成功',
          body: clipboardUrl || '',
          silent: !this.setting.configuration.sound
        });
        this.setting.configuration.showNotifaction && notification.show();
      }
    } else {
      const notification = new Notification({ title: '上传失败', body: failFile.errorMessage || '错误未捕获' });
      notification.show();
    }
  }

  protected handleAddHistory(uploadedData: UploadedFileInfo[]) {
    const uploadedFiles = this.history.add(uploadedData);
    if (!Ipc.win.isDestroyed()) {
      Ipc.sendMessage('uploaded-files-get-reply', uploadedFiles);
    }
  }
}
