import API from "@/lib/axios";
import { Task, TaskStatus } from "@/types";

/**
 * Fetch all tasks for a given project
 */
export const getTasks = async (projectId: string): Promise<Task[]> => {
  try {
    if (!projectId) {
      throw new Error("Project ID is required");
    }

    const res = await API.get(`/tasks/${projectId}`);

    // Adjust if your backend wraps response (e.g., { data: [...] })
    return res.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.message || "Failed to fetch tasks";
    throw new Error(message);
  }
};

/**
 * Update status of a specific task
 */
export const updateTaskStatus = async (
  projectId: string,
  taskId: string,
  status: TaskStatus
): Promise<Task> => {
  try {
    if (!taskId || !projectId) {
      throw new Error("Project ID and Task ID are required");
    }

    const res = await API.patch(`/tasks/${projectId}/${taskId}/status`, {
      status,
    });

    return res.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.message ||
      "Failed to update task status";
    throw new Error(message);
  }
};