import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class SessionService implements OnModuleDestroy {
  private readonly redis: Redis;

  constructor(private config: ConfigService) {
    this.redis = new Redis({
      host: this.config.get('REDIS_HOST', 'localhost'),
      port: this.config.get<number>('REDIS_PORT', 6379),
    });
    this.redis.on('error', (err) => console.error('Redis error:', err));
  }

  async create(sessionId: string, userId: number, ttlSec = 3600): Promise<void> {
    await this.redis.setex(`session:${sessionId}`, ttlSec, String(userId));
  }

  async getUserId(sessionId: string): Promise<number | null> {
    const v = await this.redis.get(`session:${sessionId}`);
    return v ? parseInt(v, 10) : null;
  }

  async destroy(sessionId: string): Promise<void> {
    await this.redis.del(`session:${sessionId}`);
  }

  async exists(sessionId: string): Promise<boolean> {
    return (await this.redis.exists(`session:${sessionId}`)) === 1;
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }
}