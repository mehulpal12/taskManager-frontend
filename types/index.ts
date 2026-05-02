export interface User {
  _id: string;
  email: string;
}

export type TaskStatus = "todo" | "in-progress" | "done";

export interface Task {
  _id: string;
  title: string;
  status: TaskStatus;
  assignedTo: User;
}