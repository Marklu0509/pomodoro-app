import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateAuthDto } from './create-auth.dto';

describe('CreateAuthDto', () => {
  // P0.2: name must be OPTIONAL so signup works without a name
  it('passes validation when name is omitted', async () => {
    const dto = plainToInstance(CreateAuthDto, {
      email: 'a@b.com',
      password: 'secret6',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('passes validation when name is provided', async () => {
    const dto = plainToInstance(CreateAuthDto, {
      email: 'a@b.com',
      password: 'secret6',
      name: 'Mark',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('fails when password is too short', async () => {
    const dto = plainToInstance(CreateAuthDto, {
      email: 'a@b.com',
      password: '123',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('fails when email is invalid', async () => {
    const dto = plainToInstance(CreateAuthDto, {
      email: 'not-an-email',
      password: 'secret6',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
