import { Test } from '@nestjs/testing';
import { SessionsService } from './sessions.service';
import { PrismaService } from '../prisma/prisma.service';

describe('SessionsService', () => {
  let service: SessionsService;
  let tx: {
    pomodoroSession: { create: jest.Mock };
    task: { update: jest.Mock };
  };
  let prisma: {
    task: { findUnique: jest.Mock };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    tx = {
      pomodoroSession: { create: jest.fn().mockImplementation((args) => args.data) },
      task: { update: jest.fn() },
    };
    prisma = {
      task: { findUnique: jest.fn() },
      $transaction: jest.fn((cb) => cb(tx)),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [SessionsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(SessionsService);
  });

  it('records real timestamps (start = end - duration) and defaults status to COMPLETED', async () => {
    await service.create(1, { durationSeconds: 1500 } as any);

    const data = tx.pomodoroSession.create.mock.calls[0][0].data;
    expect(data.status).toBe('COMPLETED');
    const span = data.endTime.getTime() - data.startTime.getTime();
    expect(span).toBe(1500 * 1000);
    expect(data.endTime.getTime()).toBeLessThanOrEqual(Date.now() + 1000);
  });

  it('passes through an ABANDONED status', async () => {
    await service.create(1, { durationSeconds: 600, status: 'ABANDONED' } as any);
    expect(tx.pomodoroSession.create.mock.calls[0][0].data.status).toBe('ABANDONED');
  });

  it('marks a linked task complete once it reaches its estimate', async () => {
    prisma.task.findUnique.mockResolvedValue({ id: 5, userId: 1 });
    tx.task.update.mockResolvedValueOnce({
      completedPomodoros: 2,
      estimatedPomodoros: 2,
      isCompleted: false,
    });

    await service.create(1, { durationSeconds: 1500, taskId: 5 } as any);

    // second update flips isCompleted -> true
    const secondCall = tx.task.update.mock.calls[1][0];
    expect(secondCall.data).toEqual({ isCompleted: true });
  });

  it('does not re-write isCompleted when it is already correct', async () => {
    prisma.task.findUnique.mockResolvedValue({ id: 5, userId: 1 });
    tx.task.update.mockResolvedValueOnce({
      completedPomodoros: 1,
      estimatedPomodoros: 3,
      isCompleted: false,
    });

    await service.create(1, { durationSeconds: 1500, taskId: 5 } as any);

    // only the increment update ran; no redundant isCompleted write
    expect(tx.task.update).toHaveBeenCalledTimes(1);
  });
});
