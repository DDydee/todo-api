import { PrismaService } from '../../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserService } from '../user.service';

jest.mock('../../../prisma/prisma.service');
jest.mock('bcrypt');

const prismaMock = {
  user: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findFirst: jest.fn(),
  },
};

(PrismaService as jest.Mock).mockImplementation(() => prismaMock);

describe('UserService', () => {
  let userService: UserService;

  beforeEach(() => {
    jest.clearAllMocks();
    userService = new UserService(new PrismaService());
  });
  describe('Create user', () => {
    it('Shoult create a user successfully', async () => {
      const userDto: CreateUserDto = {
        username: 'test',
        email: 'test@test.com',
        password: '123testing',
      };
      const hashedPassword = 'hash123testing';
      const result = {
        id: 1,
        username: 'test',
        email: 'test@test.com',
        role: 'USER',
      };

      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      prismaMock.user.create.mockResolvedValue(result);

      const createdUser = await userService.create(userDto);

      expect(bcrypt.hash).toHaveBeenCalledWith(userDto.password, 10);
      expect(prismaMock.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            username: userDto.username,
            email: userDto.email,
            password_hash: hashedPassword,
          },
        }) &&
          expect.not.objectContaining({ data: { password: expect.anything() } })
      );
      expect(createdUser).toEqual(result);
    });

    it('should handle errors gracefully', async () => {
      const userDto: CreateUserDto = {
        username: 'test',
        email: 'test@test.com',
        password: '123testing',
      };

      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      (bcrypt.hash as jest.Mock).mockRejectedValue(new Error('Hashig failed'));
      const result = await userService.create(userDto);

      expect(consoleError).toHaveBeenCalledWith(expect.any(Error));
      expect(result).toBeUndefined();
      expect(prismaMock.user.create).not.toHaveBeenCalled();

      consoleError.mockRestore();
    });
  });

  describe('Find all users', () => {
    it('Should return all users', async () => {
      const result = [
        { id: 1, username: 'test', email: 'test@test.com' },
        { id: 2, username: 'test2', email: 'test2@test.com' },
      ];

      prismaMock.user.findMany.mockResolvedValue(result);
      const findedUsers = await userService.findAll();
      expect(prismaMock.user.findMany).toHaveBeenCalledWith({
        select: { id: true, username: true, email: true },
      });
      expect(findedUsers).toEqual(result);
    });

    it('Should return null', async () => {
      prismaMock.user.findMany.mockResolvedValue(null);
      const unfindendUser = await userService.findAll();
      expect(unfindendUser).toBe(null);
    });
  });

  describe('Find user', () => {
    it('Shoult return a user by email', async () => {
      const result = {
        id: 1,
        username: 'test',
        email: 'test@test.com',
        password_hash: 'hashPassword',
        role: 'USER',
      };
      prismaMock.user.findUnique.mockResolvedValue(result);
      const findedUser = await userService.findOne('test@test.com');

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@test.com' },
        select: {
          id: true,
          username: true,
          email: true,
          password_hash: true,
          role: true,
        },
      });
      expect(findedUser).toEqual(result);
    });

    it('Should return null', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      const unfindendUser = await userService.findOne('test@test.com');
      expect(unfindendUser).toBe(null);
    });
  });

  describe('Update user', () => {
    const result = {
      username: 'admin',
      email: 'admin@test.com',
      role: 'USER',
    };
    const updateUser: UpdateUserDto = {
      username: 'admin',
      email: 'admin@test.com',
      password: '123testing',
    };

    it('Should return updated user', async () => {
      const hashedPassword = 'hash123testing';

      jest.spyOn(userService, 'isUserExist').mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      prismaMock.user.update.mockResolvedValue(result);
      const updatedUser = await userService.update(1, updateUser);

      expect(prismaMock.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data:
            expect.objectContaining({
              username: expect.any(Number),
              email: expect.any(String),
              password_hash: expect.any(String),
            }) && expect.not.objectContaining({ password: expect.any(String) }),
        })
      );
      expect(bcrypt.hash).toHaveBeenCalledWith('123testing', 10);
      expect(updatedUser).toEqual(result);
    });

    it('Should return error after failed isUserExist', async () => {
      jest.spyOn(userService, 'isUserExist').mockResolvedValue(false);
      await expect(userService.update(1, updateUser)).rejects.toThrow(
        'user does not exist'
      );
    });
  });

  describe('Remove user', () => {
    const result = {
      username: 'admin',
      email: 'admin@test.com',
      role: 'USER',
    };
    it('Should return a removed user', async () => {
      jest.spyOn(userService, 'isUserExist').mockResolvedValue(true);
      prismaMock.user.delete.mockResolvedValue(result);
      const deletedUser = await userService.remove(1);
      expect(prismaMock.user.delete).toHaveBeenCalledWith({
        where: { id: 1 },
        select: { username: true, email: true, role: true },
      });
      expect(deletedUser).toEqual(result);
    });
  });
});
