import { Test, TestingModule } from '@nestjs/testing';
import { FocusModesController } from './focus-modes.controller';
import { FocusModesService } from './focus-modes.service';

describe('FocusModesController', () => {
  let controller: FocusModesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FocusModesController],
      providers: [{ provide: FocusModesService, useValue: {} }],
    }).compile();

    controller = module.get<FocusModesController>(FocusModesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
