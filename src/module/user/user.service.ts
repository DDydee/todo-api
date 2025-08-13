import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async #isUserExist(params: {
    id?: number;
    email?: string;
  }): Promise<Boolean> {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          params.id ? { id: params.id } : undefined,
          params.email ? { email: params.email } : undefined,
        ].filter(Boolean) as any,
      },
      select: { id: true },
    });
    return !!user;
  }

  async create(userDto: CreateUserDto) {
    const isExist = await this.#isUserExist({ email: userDto.email });

    if (isExist) throw new Error('user already exist');

    try {
      const password_hash = await bcrypt.hash(userDto.password, 10);
      return this.prisma.user.create({
        data: {
          username: userDto.username,
          email: userDto.email,
          password_hash,
        },
        select: { id: true, username: true, email: true, role: true },
      });
    } catch (error) {
      console.error(error);
    }
  }

  async findAll() {
    return await this.prisma.user.findMany({
      select: { id: true, username: true, email: true },
    });
  }

  async findOne(email: string) {
    const isExist = await this.#isUserExist({ email });

    if (!isExist) throw Error('user does not exist');

    return this.prisma.user.findUnique({
      where: { email },
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
    const isExist = await this.#isUserExist({ id: id });

    if (!isExist) return 'user does not exist';

    const userData = { ...userDto };

    if (userDto?.password) {
      userData.password = await bcrypt.hash(userDto.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data: userData,
      select: { username: true, email: true, role: true },
    });
  }

  async remove(id: number) {
    const isExist = await this.#isUserExist({ id: id });

    if (!isExist) throw 'user does not exist';

    return this.prisma.user.delete({
      where: { id },
      select: { username: true, email: true, role: true },
    });
  }
}
