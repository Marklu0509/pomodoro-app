// backend/src/focus-modes/focus-modes.service.ts
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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

  // ★ Create a new mode
  async create(userId: number, dto: any) {
    const { id: _id, userId: _userId, isDefault: _isDefault, ...data } = dto ?? {};
    return this.prisma.focusMode.create({
      data: {
        userId,
        ...data,
      },
    });
  }

  // ★ Update a specific mode
  async update(id: number, userId: number, dto: any) {
    const mode = await this.prisma.focusMode.findUnique({ where: { id } });
    if (!mode || mode.userId !== userId) throw new NotFoundException();

    const { id: _id, userId: _userId, isDefault: _isDefault, ...data } = dto ?? {};
    return this.prisma.focusMode.update({
      where: { id },
      data,
    });
  }

  // ★ Delete a specific mode
  async remove(id: number, userId: number) {
    const mode = await this.prisma.focusMode.findUnique({ where: { id } });
    if (!mode || mode.userId !== userId) throw new NotFoundException();

    const count = await this.prisma.focusMode.count({ where: { userId } });
    if (count <= 1) throw new BadRequestException('At least one profile must remain');

    return this.prisma.focusMode.delete({ where: { id } });
  }
}
