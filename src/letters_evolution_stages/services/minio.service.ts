import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';

@Injectable()
export class MinioService implements OnModuleInit {
  private client: Minio.Client;
  private bucket: string;

  constructor(private config: ConfigService) {
    this.bucket = this.config.get('MINIO_BUCKET', 'media');
    this.client = new Minio.Client({
      endPoint: this.config.get('MINIO_ENDPOINT', 'localhost'),
      port: this.config.get<number>('MINIO_PORT', 9000),
      useSSL: this.config.get('MINIO_USE_SSL') === 'true',
      accessKey: this.config.get('MINIO_ACCESS_KEY'),
      secretKey: this.config.get('MINIO_SECRET_KEY'),
    });
  }

  async onModuleInit() {
    try {
      const exists = await this.client.bucketExists(this.bucket);
      if (!exists) {
        await this.client.makeBucket(this.bucket, 'us-east-1');
        await this.client.setBucketPolicy(this.bucket, JSON.stringify({
          Version: '2012-10-17',
          Statement: [{
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${this.bucket}/*`],
          }],
        }));
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn('MinIO init:', msg);
    }
  }

  async uploadFile(file: Express.Multer.File, prefix: string): Promise<string> {
    const ext = file.originalname.split('.').pop() || 'bin';
    const fileName = `${prefix}-${Date.now()}.${ext}`;
    await this.client.putObject(this.bucket, fileName, file.buffer, file.size, {
      'Content-Type': file.mimetype,
    });
    return fileName;
  }

  async deleteFile(fileName: string): Promise<void> {
    try {
      await this.client.removeObject(this.bucket, fileName);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn('MinIO delete:', msg);
    }
  }
}