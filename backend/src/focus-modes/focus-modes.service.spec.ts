import { Test, TestingModule } from '@nestjs/testing';
import { FocusModesService } from './focus-modes.service';
import { PrismaService } from '../prisma/prisma.service';

describe('FocusModesService', () => {
  let service: FocusModesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FocusModesService, { provide: PrismaService, useValue: {} }],
    }).compile();

    service = module.get<FocusModesService>(FocusModesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
