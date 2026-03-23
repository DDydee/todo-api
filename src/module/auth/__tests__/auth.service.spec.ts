import * as bcrypt from 'bcrypt';
import { AuthService } from '../auth.service';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserService } from 'src/module/user/user.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';

type MockPrisma = {
  refreshToken: {
    findUnique: jest.Mock;
    deleteMany: jest.Mock;
    upsert: jest.Mock;
  };
};
type MockUser = {
  findOne: jest.Mock;
  findUserByEmail: jest.Mock;
  create: jest.Mock;
};

type MockJwt = {
  signAsync: jest.Mock;
  verify: jest.Mock;
};

jest.mock('bcrypt');

describe('Auth', () => {
  let service: AuthService;
  let prisma: MockPrisma;
  let userService: MockUser;
  let jwtService: MockJwt;
  let configService: { get: jest.Mock };

  const mockPrisma: MockPrisma = {
    refreshToken: {
      findUnique: jest.fn(),
      deleteMany: jest.fn(),
      upsert: jest.fn(),
    },
  };
  const mockUserService: MockUser = {
    findOne: jest.fn(),
    findUserByEmail: jest.fn(),
    create: jest.fn(),
  };
  const mockJwtService: MockJwt = {
    signAsync: jest.fn(),
    verify: jest.fn(),
  };
  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: UserService, useValue: mockUserService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();
    service = module.get(AuthService);
    prisma = module.get(PrismaService);
    userService = module.get(UserService);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('refresh token', () => {
    const userPayload = {
      sub: 1,
      email: 'test@mail.com',
      role: 'USER',
      iat: 124,
      exp: 1243,
    };
    const findedUser = {
      id: 1,
      username: 'user',
      email: 'test@mail.com',
      password_hash: 'hashed-password',
      role: 'USER',
    };
    const oldTokenMock = {
      token: 'jwt-oldRefresh-token',
    };
    const token = 'jwt-oldRefresh-token';
    const mockGenToken = {
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      user: {
        id: 1,
        email: 'test@mail.com',
        role: 'USER',
      },
    };

    it('should return access/refresh token and user object', async () => {
      userService.findOne.mockResolvedValue(findedUser);
      prisma.refreshToken.findUnique.mockResolvedValue(oldTokenMock);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      jest.spyOn(service, 'generateToken').mockResolvedValue(mockGenToken);

      const result = await service.refreshToken(userPayload, token);

      expect(result).toEqual(mockGenToken);
      expect(userService.findOne).toHaveBeenCalledWith(userPayload.sub);
      expect(service.generateToken).toHaveBeenCalledWith(findedUser);
      expect(prisma.refreshToken.findUnique).toHaveBeenCalledWith({
        where: { userId: userPayload.sub },
        select: { token: true },
      });
    });

    it("should return exception 'user not found'", async () => {
      userService.findOne.mockResolvedValue(null);

      await expect(service.refreshToken(userPayload, token)).rejects.toThrow(
        new UnauthorizedException('User not found')
      );
    });

    it('should return UnauthorizedException if refresh_token not compare', async () => {
      userService.findOne.mockResolvedValue(findedUser);
      prisma.refreshToken.findUnique.mockResolvedValue(oldTokenMock);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(service.refreshToken(userPayload, token)).rejects.toThrow(
        UnauthorizedException
      );
      expect(userService.findOne).toHaveBeenCalledWith(userPayload.sub);
      expect(prisma.refreshToken.findUnique).toHaveBeenCalledWith({
        where: { userId: userPayload.sub },
        select: { token: true },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(token, oldTokenMock.token);
    });

    it('should return UnauthorizedException if db token not found', async () => {
      userService.findOne.mockResolvedValue(findedUser);
      prisma.refreshToken.findUnique.mockResolvedValue(null);

      await expect(service.refreshToken(userPayload, token)).rejects.toThrow(
        UnauthorizedException
      );
      expect(userService.findOne).toHaveBeenCalledWith(userPayload.sub);
      expect(prisma.refreshToken.findUnique).toHaveBeenCalledWith({
        where: { userId: userPayload.sub },
        select: { token: true },
      });
    });
  });

  describe('generate token', () => {
    const user = {
      id: 1,
      username: 'user',
      email: 'test@mail.com',
      role: 'USER',
    };
    const access = 'jwt-access-token';
    const refresh = 'jwt-refresh-token';

    it('should return access/refresh token and user', async () => {
      jwtService.signAsync
        .mockResolvedValueOnce(access)
        .mockResolvedValueOnce(refresh);
      jest
        .spyOn(bcrypt, 'hash')
        .mockResolvedValue('hashed-refresh-token' as never);
      prisma.refreshToken.upsert.mockResolvedValue(undefined);

      const result = await service.generateToken(user);

      expect(result).toEqual({
        access_token: access,
        refresh_token: refresh,
        user: { id: user.id, email: user.email, role: user.role },
      });
      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(bcrypt.hash).toHaveBeenCalledWith('jwt-refresh-token', 10);
      expect(prisma.refreshToken.upsert).toHaveBeenCalledWith({
        where: { userId: user.id },
        create: expect.objectContaining({
          token: 'hashed-refresh-token',
          userId: user.id,
          expiresAt: expect.any(Date),
        }),
        update: expect.objectContaining({
          token: 'hashed-refresh-token',
          expiresAt: expect.any(Date),
        }),
      });
    });
  });

  describe('sign in', () => {
    const signInMock = {
      email: 'test@mail.com',
      password: 'mock-password',
    };
    const mockGenToken = {
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      user: {
        id: 1,
        email: 'test@mail.com',
        role: 'USER',
      },
    };

    it('should return access/refresh token and user', async () => {
      const findedUser = {
        id: 1,
        username: 'user',
        email: signInMock.email,
        password_hash: 'hash-password',
        role: 'USER',
        createdAt: Date,
        updatedAt: Date,
      };

      userService.findUserByEmail.mockResolvedValue(findedUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      jest.spyOn(service, 'generateToken').mockResolvedValue(mockGenToken);

      const result = await service.signIn(signInMock);

      expect(result).toEqual(mockGenToken);
      expect(userService.findUserByEmail).toHaveBeenCalledWith(
        signInMock.email
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(
        signInMock.password,
        findedUser.password_hash
      );
    });
  });
});
