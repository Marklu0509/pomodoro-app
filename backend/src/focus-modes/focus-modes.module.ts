import { Module } from '@nestjs/common';
import { FocusModesService } from './focus-modes.service';
import { FocusModesController } from './focus-modes.controller';

@Module({
  controllers: [FocusModesController],
  providers: [FocusModesService],
})
export class FocusModesModule {}
