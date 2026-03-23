import * as bcrypt from 'bcrypt';
import { UserService } from '../user.service';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from '../dto/create-user.dto';

type MockPrisma = {
  user: {
    findFirst: jest.Mock;
    create: jest.Mock;
    findMany: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
};

jest.mock('bcrypt');

describe('User', () => {
  let service: UserService;
  let prisma: MockPrisma;

  const mockPrisma: MockPrisma = {
    user: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(UserService);
    prisma = module.get(PrismaService);

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('find user by email', () => {
    const findedUser = {
      id: 1,
      username: 'user',
      email: 'test@mail.com',
      password_hash: 'hashed-password',
      role: 'USER',
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    };
    it('should return finded user', async () => {
      const email = 'test@mail.com';
      prisma.user.findFirst.mockResolvedValue(findedUser);

      const res = await service.findUserByEmail(email);
      expect(res).toEqual(findedUser);
      // expect(service.findUserByEmail).toHaveBeenCalledWith(email);
    });
  });

  describe('find all users', () => {
    const findedUser = [
      {
        id: 1,
        username: 'user',
        email: 'test@mail.com',
      },
      {
        id: 2,
        username: 'user2',
        email: 'test2@mail.com',
      },
    ];
    it('should return finded users', async () => {
      prisma.user.findMany.mockResolvedValue(findedUser);

      const res = await service.findAll();
      expect(res).toEqual(findedUser);
    });
  });

  describe('find user by id', () => {
    const findedUser = {
      id: 1,
      username: 'user',
      email: 'test@mail.com',
      password_hash: 'hashed-password',
      role: 'USER',
    };
    it('should return finded user', async () => {
      prisma.user.findUnique.mockResolvedValue(findedUser);

      const res = await service.findOne(1);
      expect(res).toEqual(findedUser);
      // expect(service.findUserByEmail).toHaveBeenCalledWith(email);
    });
  });

  describe('create', () => {
    const userDto: CreateUserDto = {
      username: 'user',
      email: 'user@mail.com',
      password: 'password',
    };
    const findedUser = {
      id: 1,
      username: 'user',
      email: 'user@mail.com',
      role: 'USER',
    };

    it('should create user', async () => {
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hash-pass' as never);
      prisma.user.create.mockResolvedValue(findedUser);

      const res = await service.create(userDto);
      expect(res).toEqual(findedUser);
    });
  });

  describe('update', () => {
    const userDto: CreateUserDto = {
      username: 'user',
      email: 'user@mail.com',
      password: 'password',
    };
    const updatedUser = {
      username: 'user',
      email: 'user@mail.com',
      role: 'USER',
    };
    it('should update user', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(expect.any(Object));
      prisma.user.update.mockResolvedValue(updatedUser);

      const res = await service.update(1, userDto);

      expect(res).toEqual(updatedUser);
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 1 } })
      );
    });
  });

  describe('remove', () => {
    const removedUser = {
      username: 'user',
      email: 'user@mail.com',
      role: 'USER',
    };
    it('should update user', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(expect.any(Object));
      prisma.user.delete.mockResolvedValue(removedUser);

      const res = await service.remove(1);

      expect(res).toEqual(removedUser);
      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(prisma.user.delete).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 1 } })
      );
    });
  });
});
