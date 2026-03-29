import { Module } from '@nestjs/common';
import { UserService } from './user.service.js';
import { UserController } from './user.controller.js';
import { PrismaModule } from 'src/prisma/prisma.module.js';

@Module({
  controllers: [UserController],
  providers: [UserService],
  imports: [PrismaModule],
  exports: [UserService],
})
export class UserModule {}
