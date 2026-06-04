import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: { user: { findUnique: jest.Mock; create: jest.Mock } };
  let jwt: { signAsync: jest.Mock };

  beforeEach(async () => {
    prisma = { user: { findUnique: jest.fn(), create: jest.fn() } };
    jwt = { signAsync: jest.fn().mockResolvedValue('signed.jwt.token') };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
  });

  describe('signup', () => {
    it('hashes the password, creates the user and returns an accessToken', async () => {
      prisma.user.create.mockResolvedValue({ id: 1, email: 'a@b.com' });

      const res = await service.signup({
        email: 'a@b.com',
        password: 'secret6',
        name: 'Mark',
      } as any);

      expect(prisma.user.create).toHaveBeenCalledTimes(1);
      const createArg = prisma.user.create.mock.calls[0][0];
      expect(createArg.data.passwordHash).not.toBe('secret6'); // stored hashed, never plaintext
      expect(res.accessToken).toBe('signed.jwt.token');
    });

    it('works when name is omitted (P0.2)', async () => {
      prisma.user.create.mockResolvedValue({ id: 2, email: 'c@d.com' });

      const res = await service.signup({
        email: 'c@d.com',
        password: 'secret6',
      } as any);

      expect(res.accessToken).toBe('signed.jwt.token');
    });

    it('does NOT pass a hardcoded secret to signAsync (P0.3 — secret comes from JwtModule/env)', async () => {
      prisma.user.create.mockResolvedValue({ id: 1, email: 'a@b.com' });

      await service.signup({ email: 'a@b.com', password: 'secret6' } as any);

      const signOptions = jwt.signAsync.mock.calls[0][1];
      // After refactor signToken must rely on globally-configured secret,
      // not pass `secret: 'super-secret-key'` inline.
      expect(signOptions?.secret).toBeUndefined();
    });
  });

  describe('login', () => {
    it('throws UnauthorizedException when the user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'x@y.com', password: 'whatever' } as any),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('throws UnauthorizedException when the password is wrong', async () => {
      const hash = await bcrypt.hash('correct-password', 10);
      prisma.user.findUnique.mockResolvedValue({
        id: 1,
        email: 'a@b.com',
        passwordHash: hash,
      });

      await expect(
        service.login({ email: 'a@b.com', password: 'wrong-password' } as any),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('returns an accessToken on valid credentials', async () => {
      const hash = await bcrypt.hash('secret6', 10);
      prisma.user.findUnique.mockResolvedValue({
        id: 1,
        email: 'a@b.com',
        passwordHash: hash,
      });

      const res = await service.login({
        email: 'a@b.com',
        password: 'secret6',
      } as any);

      expect(res.accessToken).toBe('signed.jwt.token');
    });
  });
});
