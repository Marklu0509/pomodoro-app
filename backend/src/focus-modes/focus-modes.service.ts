// backend/src/focus-modes/focus-modes.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FocusModesService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: number) {
    const modes = await this.prisma.focusMode.findMany({ where: { userId } });
    if (modes.length === 0) {
      const defaultMode = await this.prisma.focusMode.create({
        data: { userId, name: 'Default Focus', isDefault: true },
      });
      return [defaultMode];
    }
    return modes;
  }

  // ★ Update a specific mode
  async update(id: number, userId: number, dto: any) {
    const mode = await this.prisma.focusMode.findUnique({ where: { id } });
    if (!mode || mode.userId !== userId) throw new NotFoundException();

    return this.prisma.focusMode.update({
      where: { id },
      data: { ...dto },
    });
  }

  // ★ Delete a specific mode
  async remove(id: number, userId: number) {
    const mode = await this.prisma.focusMode.findUnique({ where: { id } });
    if (!mode || mode.userId !== userId) throw new NotFoundException();

    return this.prisma.focusMode.delete({ where: { id } });
  }
}