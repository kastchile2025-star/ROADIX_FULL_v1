import {
  Delete,
  Controller,
  Post,
  Get,
  Param,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { ArchivosService } from './archivos.service.js';
import type { Response } from 'express';
import * as path from 'path';
import * as crypto from 'crypto';
import { diskStorage } from 'multer';

const ALLOWED_MIME = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

@Controller('archivos')
@UseGuards(JwtAuthGuard)
export class ArchivosController {
  constructor(private archivosService: ArchivosService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          cb(null, process.env.UPLOAD_DIR || './uploads');
        },
        filename: (_req, file, cb) => {
          const ext = path.extname(file.originalname);
          const hash = crypto.randomBytes(16).toString('hex');
          cb(null, `${Date.now()}-${hash}${ext}`);
        },
      }),
      limits: { fileSize: MAX_SIZE },
      fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIME.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Tipo de archivo no permitido'), false);
        }
      },
    }),
  )
  upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No se proporcionó un archivo');
    }
    return { url: this.archivosService.getFileUrl(file.filename), filename: file.filename };
  }

  @Get(':filename')
  serveFile(@Param('filename') filename: string, @Res() res: Response) {
    // Sanitize filename to prevent path traversal
    const sanitized = path.basename(filename);
    const filePath = path.join(this.archivosService.getUploadDir(), sanitized);
    return res.sendFile(path.resolve(filePath));
  }

  @Delete(':filename')
  remove(@Param('filename') filename: string) {
    const sanitized = path.basename(filename);
    this.archivosService.deleteFile(sanitized);
    return { ok: true };
  }
}
