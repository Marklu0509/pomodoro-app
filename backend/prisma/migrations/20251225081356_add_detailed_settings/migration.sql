-- AlterTable
ALTER TABLE "settings" ADD COLUMN     "alert_at_25_percent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "background_sound" TEXT NOT NULL DEFAULT 'none',
ADD COLUMN     "lock_window" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mini_clock_mode" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notification_volume" INTEGER NOT NULL DEFAULT 70,
ADD COLUMN     "notifications_enabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "tick_volume" INTEGER NOT NULL DEFAULT 50,
ADD COLUMN     "ticking_sound" TEXT NOT NULL DEFAULT 'classic';
