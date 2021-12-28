import fs from 'fs';
import { Buffer } from 'buffer';

export function readChunkSync(filePath: fs.PathLike, { length, startPosition }) {
  let buffer = Buffer.alloc(length);
  const fileDescriptor = fs.openSync(filePath, 'r');

  try {
    const bytesRead = fs.readSync(fileDescriptor, buffer, {
      length,
      position: startPosition
    });

    if (bytesRead < length) {
      buffer = buffer.slice(0, bytesRead);
    }

    return buffer;
  } finally {
    fs.closeSync(fileDescriptor);
  }
}
