import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { setCurrentUserId } from '../../current-user';

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private auth: AuthService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const sid = req.cookies?.sessionId;
    if (!sid) throw new UnauthorizedException('Нет сессии');
    const user = await this.auth.validateSession(sid);
    req.user = { id: user.id, email: user.email, username: user.username, role: user.role };
    // Прокидываем ID в singleton, чтобы HTML-страницы тоже видели пользователя
    setCurrentUserId(user.id);
    return true;
  }
}