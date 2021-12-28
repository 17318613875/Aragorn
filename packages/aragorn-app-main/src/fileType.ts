import { createReadStream, readdirSync, promises as fsPromises, stat, Stats, statSync } from 'fs';
import { extname, basename, join } from 'path';
import { readChunkSync } from './read-chunk';
// import { FileExtension, fileTypeFromBuffer, MimeType } from 'file-type';
import mime from 'mime-types';
import MediaInfoFactory, { MediaInfo } from 'mediainfo.js';
import { createHash } from 'crypto';

export type FileOpts = {
  mediaExt: any[];
};
export type FileInfo = {
  name: string;
  suffix: string;
  md5: string;
  detail: any;
  path: string;
  size: number;
  type: string;
};

export const sliceSize = 1024 * 1024 * 100;
const sliceLeng = 1024 * 16;
export const isBigSize = (size: number) => size >= 2 * sliceSize;
async function GetFileMd5(pathway: string, size: number): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      const hash = createHash('md5');
      if (isBigSize(size)) {
        // 起点
        const _buffer = readChunkSync(pathway, { startPosition: 0, length: sliceLeng });
        hash.push(_buffer);
        // 中点
        const buffer = readChunkSync(pathway, { startPosition: Math.floor(size / 2), length: sliceLeng });
        hash.push(buffer);
        // 终点
        const _buffer_ = readChunkSync(pathway, { startPosition: size - sliceLeng, length: sliceLeng });
        hash.push(_buffer_);
        resolve(hash.digest('hex'));
      } else {
        const stream = createReadStream(pathway);
        stream.on('end', () => {
          resolve(hash.digest('hex'));
        });
        stream.pipe(hash);
      }
    } catch (error) {
      reject(error);
    }
  });
}
const ReadDir = (pathway: string, deepLeve: number) => {
  let FileList: string[] = [];
  const dirInfo = readdirSync(pathway);
  dirInfo.forEach(item => {
    const location = join(pathway, item);
    const info = statSync(location);
    if (deepLeve > 1 && info.isDirectory()) {
      FileList = FileList.concat(ReadDir(location, deepLeve - 1));
    } else if (info.isFile()) {
      FileList.push(location);
    }
  });
  return FileList;
};
function GetFolderInfo(
  pathway: string,
  deepLeve: number,
  opts?: FileOpts,
  stats_?: Stats
): Promise<{
  code: string;
  data: any[] | FileInfo[];
}> {
  return new Promise((resolve, reject) => {
    let stats: Stats;
    if (stats_) {
      if (stats_.isDirectory && stats_.isDirectory()) {
        const FileList = ReadDir(pathway, deepLeve || 1);
        Promise.all(FileList.map(item => GetFileInfo(item, opts)))
          .then(fileInfos => {
            resolve({
              code: 'success',
              data: fileInfos.map(item => item.data)
            });
          })
          .catch(reject);
      } else if (stats_.isFile && stats_.isFile()) {
        GetFolderInfo(join(pathway, '..'), deepLeve, opts, stats_).then(resolve).catch(reject);
      } else {
        reject(new Error('调用错误,请检查参数类型是否正确'));
      }
    } else {
      stats = statSync(pathway);
      GetFolderInfo(pathway, deepLeve, opts, stats_).then(resolve).catch(reject);
    }
  });
}
export function GetFileInfo(
  pathway: string,
  opts?: FileOpts,
  stats_?: Stats
): Promise<{
  code: string;
  data: FileInfo;
}> {
  return new Promise(async (resolve, reject) => {
    try {
      let fileOpts = Object.assign(
        { mediaExt: ['video/mp4', 'video/mts', 'image/pdf', 'image/png', 'image/jpg', 'image/jpeg'] },
        opts || {}
      );
      let stats: Stats;
      if (stats_ && stats_.isFile && stats_.isFile()) {
        stats = stats_;
      } else {
        stats = statSync(pathway);
      }
      const { size } = stats;
      const md5 = await GetFileMd5(pathway, size);
      const type = mime.lookup(pathway) as string;
      let detail: any;
      if (type && fileOpts.mediaExt.includes(type)) {
        const mediainfo = (await MediaInfoFactory({ format: 'JSON', coverData: true })) as MediaInfo;
        const fileHandle = await fsPromises.open(pathway, 'r');
        detail = await mediainfo.analyzeData(
          () => size,
          async (size: number, offset: number) => {
            const buffer = new Uint8Array(size);
            await (fileHandle as fsPromises.FileHandle).read(buffer, 0, size, offset);
            return buffer;
          }
        );
      }
      console.log('detail =>', detail);
      resolve({
        code: 'success',
        data: {
          name: basename(pathway),
          suffix: extname(pathway),
          md5,
          type,
          detail,
          path: pathway,
          size
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}

export function GetFileType(
  pathway: string,
  deepLeve = 1,
  opts?
): Promise<{
  code: string;
  data: FileInfo | FileInfo[];
}> {
  return new Promise((resolve, reject) => {
    // 判断路径是否存在
    stat(pathway, (err, stats) => {
      if (err) {
        reject(err);
      } else {
        if (stats.isDirectory()) {
          // 为文件夹
          GetFolderInfo(pathway, deepLeve, opts, stats).then(resolve).catch(reject);
        }
        if (stats.isFile()) {
          // 为文件
          GetFileInfo(pathway, opts, stats).then(resolve).catch(reject);
        }
      }
    });
  });
}
