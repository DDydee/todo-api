import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthService } from 'src/module/auth/auth.service';
import { Role } from '@prisma/client';
import request from 'supertest';
describe('UserController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authService: AuthService;
  let adminToken: string;
  let userToken: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    prisma = module.get(PrismaService);
    authService = module.get(AuthService);

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
  });

  beforeEach(async () => {
    await prisma.user.deleteMany({
      where: {
        email: { notIn: ['admin@test.com', 'user@test.com'] },
      },
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
    // await prisma.$disconnect();
    await app.close();
  });

  describe('GET', () => {
    const newUser = {
      username: 'user',
      email: 'user-test@test.com',
      password: 'hashPassowrd',
    };
    it('/user should return all users', async () => {
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

    it('/user should return 403 error', async () => {
      const createdUser = await request(app.getHttpServer())
        .get('/user')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('/user/:id should return a user by id', async () => {
      const createdUser = await request(app.getHttpServer())
        .post('/user')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newUser)
        .expect(201);

      const user = await request(app.getHttpServer())
        .get(`/user/${createdUser.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(user.body).toEqual({
        id: expect.any(Number),
        username: 'user',
        email: 'user-test@test.com',
        password_hash: expect.any(String),
        role: expect.stringMatching(/USER|ADMIN/),
      });
    });
  });

  describe('POST', () => {
    const newUser = {
      username: 'user',
      email: 'user-test@test.com',
      password: 'hashPassowrd',
    };
    it('/user should create user', async () => {
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
    });
  });

  describe('PATCH', () => {
    const newUser = {
      username: 'user',
      email: 'user-test@test.com',
      password: 'hashPassowrd',
    };

    it('/user/:id should update user by id', async () => {
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

      const updatedUser = await request(app.getHttpServer())
        .patch(`/user/${createdUser.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ username: 'updated-user' })
        .expect(200);
      expect(updatedUser.body).toEqual(
        expect.objectContaining({ username: 'updated-user' })
      );
    });
  });

  describe('DELETE', () => {
    const newUser = {
      username: 'user',
      email: 'user-test@test.com',
      password: 'hashPassowrd',
    };
    it('/user/:id should delete user by id', async () => {
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

      const deletedUser = await request(app.getHttpServer())
        .delete(`/user/${createdUser.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(deletedUser.body).toEqual({
        username: newUser.username,
        email: newUser.email,
        role: expect.stringMatching(/USER|ADMIN/),
      });
    });
  });
});
