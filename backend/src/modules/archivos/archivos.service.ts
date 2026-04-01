import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

@Injectable()
export class ArchivosService {
  private readonly uploadDir: string;

  constructor(private config: ConfigService) {
    this.uploadDir = this.config.get<string>('UPLOAD_DIR', './uploads');
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  getUploadDir(): string {
    return this.uploadDir;
  }

  generateFilename(originalname: string): string {
    const ext = path.extname(originalname);
    const hash = crypto.randomBytes(16).toString('hex');
    return `${Date.now()}-${hash}${ext}`;
  }

  getFileUrl(filename: string): string {
    const baseUrl = this.config.get<string>('APP_BACKEND_URL', 'http://localhost:3000');
    return `${baseUrl}/api/archivos/${filename}`;
  }

  extractFilenameFromUrl(url: string): string | null {
    try {
      const parsed = new URL(url);
      if (!parsed.pathname.includes('/api/archivos/')) {
        return null;
      }
      return path.basename(parsed.pathname);
    } catch {
      if (!url.includes('/api/archivos/')) {
        return null;
      }
      return path.basename(url);
    }
  }

  deleteFileByUrl(url: string): void {
    const filename = this.extractFilenameFromUrl(url);
    if (!filename) {
      return;
    }
    this.deleteFile(filename);
  }

  deleteFile(filename: string): void {
    const filePath = path.join(this.uploadDir, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  saveBase64(base64DataUrl: string, prefix = 'firma'): string {
    const matches = base64DataUrl.match(/^data:image\/(png|jpeg|webp);base64,(.+)$/);
    if (!matches) {
      throw new Error('Formato base64 inválido');
    }
    const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
    const buffer = Buffer.from(matches[2], 'base64');
    const hash = crypto.randomBytes(8).toString('hex');
    const filename = `${prefix}-${Date.now()}-${hash}.${ext}`;
    fs.writeFileSync(path.join(this.uploadDir, filename), buffer);
    return this.getFileUrl(filename);
  }
}
