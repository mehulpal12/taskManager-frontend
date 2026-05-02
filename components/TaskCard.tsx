"use client";
import { Task, TaskStatus } from "@/types";

interface TaskCardProps {
  task: Task;
  onUpdate: (id: string, status: TaskStatus) => void;
}

export default function TaskCard({ task, onUpdate }: TaskCardProps) {
  const getStatusStyles = (status: TaskStatus) => {
    switch (status) {
      case "todo":
        return "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400";
      case "in-progress":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400";
      case "done":
        return "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400";
      default:
        return "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400";
    }
  };

  return (
    <div className="group bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold ${
            task.status?.toLowerCase() === "done" ? "bg-green-100 dark:bg-green-900/30 text-green-600" : "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600"
          }`}>
            {task.title.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className={`font-bold text-lg ${task.status?.toLowerCase() === "done" ? "line-through text-slate-400" : "text-slate-900 dark:text-white"}`}>
              {task.title}
            </h3>
            <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-0.5">
               <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
               {task.assignedTo?.email || "Unassigned"}
            </p>
          </div>
        </div>

        <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${getStatusStyles(task.status)}`}>
          {task.status}
        </span>
      </div>

      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
          No due date
        </div>

        <select
          value={task.status}
          onChange={(e) => onUpdate(task._id, e.target.value as TaskStatus)}
          className="text-xs font-semibold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
        >
          <option value="todo">Todo</option>
          <option value="in-progress">In Progress</option>
          <option value="done">Done</option>
        </select>
      </div>
    </div>
  );
}