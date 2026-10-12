import { Controller, Get, Render } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';

@ApiExcludeController()
@Controller()
export class AppController {
  @Get('login')
  @Render('login')
  login() {
    return { title: 'Вход' };
  }

  @Get('register')
  @Render('register')
  register() {
    return { title: 'Регистрация' };
  }
}