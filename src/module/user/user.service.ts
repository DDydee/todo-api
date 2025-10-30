import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { User } from './interfaces/users.interface';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findUserByEmail(email: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        email,
      },
    });
    return user;
  }

  async create(userDto: CreateUserDto): Promise<User> {
    try {
      const password_hash = await bcrypt.hash(userDto.password, 10);
      const createdUser = await this.prisma.user.create({
        data: {
          username: userDto.username,
          email: userDto.email,
          password_hash,
        },
        select: { id: true, username: true, email: true, role: true },
      });
      return createdUser;
    } catch {
      throw new InternalServerErrorException('Failed to create user');
    }
  }

  async findAll() {
    return await this.prisma.user.findMany({
      select: { id: true, username: true, email: true },
    });
  }

  async findOne(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        password_hash: true,
        role: true,
      },
    });
  }

  async update(id: number, userDto: UpdateUserDto) {
    const isExist = await this.findOne(id);

    if (!isExist) throw new Error('user does not exist');

    const userData = { ...userDto };

    let password_hash: string | undefined;
    if (userDto?.password) {
      password_hash = await bcrypt.hash(userDto.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        username: userData.username,
        email: userData.email,
        password_hash: password_hash,
      },
      select: { username: true, email: true, role: true },
    });
  }

  async remove(id: number) {
    const isExist = await this.findOne(id);

    if (!isExist) throw new Error('user does not exist');

    return this.prisma.user.delete({
      where: { id },
      select: { username: true, email: true, role: true },
    });
  }
}
