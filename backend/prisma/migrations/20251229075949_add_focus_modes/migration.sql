-- CreateTable
CREATE TABLE "focus_modes" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "work_duration" INTEGER NOT NULL DEFAULT 25,
    "short_break_duration" INTEGER NOT NULL DEFAULT 5,
    "long_break_duration" INTEGER NOT NULL DEFAULT 15,
    "ambient_volume" INTEGER NOT NULL DEFAULT 50,
    "ambient_sound" TEXT NOT NULL DEFAULT 'ticking',
    "alarm_sound" TEXT NOT NULL DEFAULT 'classic',
    "is_default" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "focus_modes_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "focus_modes" ADD CONSTRAINT "focus_modes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
