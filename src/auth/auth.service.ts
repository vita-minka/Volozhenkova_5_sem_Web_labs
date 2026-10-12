import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../letters_evolution_stages/entities/user.entity';
import { SessionService } from '../session/session.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private usersRepo: Repository<UserEntity>,
    private sessions: SessionService,
  ) {}

  async register(email: string, password: string, username?: string) {
    const exists = await this.usersRepo.findOne({ where: { email } });
    if (exists) throw new BadRequestException('Email уже занят');
    const user = this.usersRepo.create({ email, password, username: username || email.split('@')[0], role: 'user' });
    const saved = await this.usersRepo.save(user);
    return { id: saved.id, email: saved.email, username: saved.username, role: saved.role };
  }

  async login(email: string, password: string) {
    const user = await this.usersRepo.findOne({ where: { email } });
    if (!user || user.password !== password) {
      throw new UnauthorizedException('Неверные данные');
    }
    const sessionId = uuidv4();
    await this.sessions.create(sessionId, user.id, 3600);
    return {
      sessionId,
      user: { id: user.id, email: user.email, username: user.username, role: user.role },
    };
  }

  async logout(sessionId: string) {
    await this.sessions.destroy(sessionId);
  }

  async validateSession(sessionId: string) {
    const userId = await this.sessions.getUserId(sessionId);
    if (!userId) throw new UnauthorizedException('Сессия истекла');
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Пользователь не найден');
    return user;
  }
}