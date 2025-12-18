// frontend/types/task.ts

// Define the structure of a Task object based on the Backend Prisma model
export interface Task {
  id: number;
  title: string;
  description?: string; // Optional field
  estimatedPomodoros: number;
  completedPomodoros: number;
  isCompleted: boolean;
  isArchived: boolean;
  createdAt: string; // JSON dates are strings
  updatedAt: string;
}