import { Body, Controller, Post, Req, Res, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import express from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from '../letters_evolution_stages/dto/register.dto';
import { LoginDto } from '../letters_evolution_stages/dto/login.dto';
import { SessionGuard } from './guards/session.guard';

@ApiTags('auth')
@Controller('api/auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Регистрация' })
  async register(@Body() dto: RegisterDto) {
    return this.auth.register(dto.email, dto.password, dto.username);
  }

  @Post('login')
  @ApiOperation({ summary: 'Вход (устанавливает cookie sessionId)' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const { sessionId, user } = await this.auth.login(dto.email, dto.password);
    res.cookie('sessionId', sessionId, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 3600_000,
    });
    return { user };
  }

  @Post('logout')
  @ApiOperation({ summary: 'Выход' })
  async logout(@Req() req: express.Request, @Res({ passthrough: true }) res: express.Response) {
    const sid = req.cookies?.sessionId;
    if (sid) await this.auth.logout(sid);
    res.clearCookie('sessionId');
    return { ok: true };
  }

  @Get('me')
  @UseGuards(SessionGuard)
  @ApiOperation({ summary: 'Информация о текущем пользователе' })
  async me(@Req() req: express.Request & { user?: any }) {
    return req.user;
  }
}