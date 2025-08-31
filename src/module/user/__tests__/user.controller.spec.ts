import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthService } from 'src/module/auth/auth.service';
import { Role } from '@prisma/client';
import Redis from 'ioredis';
import request from 'supertest';

describe('UserController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authService: AuthService;
  let adminToken: string;
  let userToken: string;
  // let redis: Redis;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    prisma = module.get(PrismaService);
    authService = module.get(AuthService);
    // redis = module.get(Redis);

    const admin = await prisma.user.create({
      data: {
        username: 'admin-test',
        email: 'admin@test.com',
        password_hash:
          '$2a$10$3ukcgRC8cfkr4oOPrj6JOeV5aNQ8SPhmKv7fONW0IvSX6b5JOArOq',
        role: Role.ADMIN,
      },
    });

    const user = await prisma.user.create({
      data: {
        username: 'user-test',
        email: 'user@test.com',
        password_hash:
          '$2a$10$3ukcgRC8cfkr4oOPrj6JOeV5aNQ8SPhmKv7fONW0IvSX6b5JOArOq',
        role: Role.USER,
      },
    });

    adminToken = (
      await authService.signIn({
        email: admin.email,
        password: 'hashedPassword',
      })
    ).access_token;
    userToken = (
      await authService.signIn({
        email: user.email,
        password: 'hashedPassword',
      })
    ).access_token;

    await prisma.user.deleteMany({
      where: {
        email: { notIn: ['admin@test.com', 'user@test.com'] },
      },
    });
  });

  afterAll(async () => {
    // if (redis) {
    //   await redis.off();
    // }
    await prisma.user.deleteMany();
    await app.close();
  });

  describe('GET /user', () => {
    const newUser = {
      username: 'user',
      email: 'user-test@test.com',
      password: 'hashPassowrd',
    };
    it('should return all users', async () => {
      const createdUser = await request(app.getHttpServer())
        .post('/user')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newUser)
        .expect(201);

      expect(createdUser.body).toMatchObject({
        id: expect.any(Number),
        username: 'user',
        email: 'user-test@test.com',
        role: Role.USER,
      });

      const users = await request(app.getHttpServer())
        .get('/user')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(users.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ email: 'user-test@test.com' }),
        ])
      );
    });

    it('should return 401 error', async () => {
      const newUser = {
        username: 'user',
        email: 'user-test@test.com',
        password: 'hashPassowrd',
      };
      const createdUser = await request(app.getHttpServer())
        .post('/user')
        .send(newUser)
        .expect(401);
    });
  });
});
