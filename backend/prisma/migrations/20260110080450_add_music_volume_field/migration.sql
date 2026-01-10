-- DropForeignKey
ALTER TABLE "pomodoro_sessions" DROP CONSTRAINT "pomodoro_sessions_task_id_fkey";

-- AlterTable
ALTER TABLE "focus_modes" ADD COLUMN     "musicVolume" INTEGER NOT NULL DEFAULT 50;

-- AddForeignKey
ALTER TABLE "pomodoro_sessions" ADD CONSTRAINT "pomodoro_sessions_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
