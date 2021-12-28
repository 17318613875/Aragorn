import { Uploader, UploaderOptions, UploadOptions, UploadOpts, UploadResponse } from 'aragorn-types';
import axios, { AxiosRequestConfig } from 'axios';
import FormData from 'form-data';
import { createReadStream } from 'fs';
import { options as defaultOptions } from './options';

interface Config {
  url: string;
  method: 'POST' | 'GET' | 'PUT' | 'PATCH' | 'DELETE';
  contentType: 'multipart/form-data' | 'application/x-www-form-urlencoded' | 'application/json';
  token?: string;
  fileFieldName: string;
  responseUrlFieldName: string;
  responseMessageName?: string;
  requestParams?: string;
  requestBody?: string;
  params?: string;
}

export class BigFishOssUploader implements Uploader {
  name = '大鱼存储';
  docUrl = 'https://wiki.imgo.tv/pages/viewpage.action?pageId=48228203';
  defaultOptions = defaultOptions;
  options = defaultOptions;

  changeOptions(newOptions: UploaderOptions) {
    this.options = newOptions;
  }

  async upload(options: UploadOptions, opts?: UploadOpts): Promise<UploadResponse> {
    try {
      const { file, fileName, md5, size } = options;
      const formData = new FormData();
      const uploaderOptions = this.getConfig();
      const fileStream = Buffer.isBuffer(file) ? file : createReadStream(file);
      formData.append(uploaderOptions.fileFieldName, fileStream, { filename: fileName });
      formData.append('fileSize', size);
      formData.append('fileMd5', md5);
      formData.append('cloud', 0);
      formData.append('transdata', { test: Date.now() });
      formData.append('isChunk', 0);
      // formData.append('chunkNo', 0)
      // formData.append('chunkSize', 0)
      // formData.append('chunkMd5', 0)
      const length = await new Promise((resolve, reject) => {
        formData.getLength(async (err, length) => {
          if (err) {
            reject(err);
          } else {
            resolve(length);
          }
        });
      });
      const requestOpetion: AxiosRequestConfig = {
        url: uploaderOptions.url,
        method: uploaderOptions.method,
        headers: {
          ...formData.getHeaders(),
          'Content-Length': length,
          Authorization: uploaderOptions.token || ''
        },
        params: uploaderOptions.requestParams ? JSON.parse(uploaderOptions.requestParams) : {},
        data: uploaderOptions.contentType === 'multipart/form-data' ? formData : uploaderOptions.requestBody,
        onUploadProgress: opts?.process
      };
      // 发起请求
      const result = await axios(requestOpetion);
      const { data: res } = result;
      console.log(result);
      let imageUrl = uploaderOptions.responseUrlFieldName?.split('.').reduce((pre, cur) => {
        try {
          return pre[cur];
        } catch (err: any) {
          return undefined;
        }
      }, res);
      if (imageUrl) {
        return {
          success: true,
          data: {
            url: imageUrl + uploaderOptions.params || ''
          }
        };
      } else {
        const message = uploaderOptions?.responseMessageName?.split('.').reduce((pre, cur) => {
          try {
            return pre[cur];
          } catch (err: any) {
            return undefined;
          }
        }, res);
        return {
          success: false,
          desc: message || '上传失败'
        };
      }
    } catch (err: any) {
      return {
        success: false,
        desc: err.message
      };
    }
  }

  async multipartUpload(options: UploadOptions, opts?: UploadOpts): Promise<UploadResponse> {
    try {
      const { file, fileName } = options;
      return {
        success: false,
        desc: '上传失败'
      };
    } catch (err: any) {
      return {
        success: false,
        desc: err.message
      };
    }
  }

  protected getConfig(): Config {
    const config = this.options.reduce((pre, cur) => {
      pre[cur.name] = cur.value;
      return pre;
    }, {});
    return config as Config;
  }
}
