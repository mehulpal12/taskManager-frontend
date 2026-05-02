"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getTasks, updateTaskStatus } from "@/services/task.service";
import { Task, TaskStatus } from "@/types";
import TaskCard from "@/components/TaskCard";
import Protected from "@/components/Protected";

export default function ProjectPage() {
  const { id } = useParams();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    try {
      const res = await getTasks(id as string);
      setTasks(res);
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (taskId: string, status: TaskStatus) => {
    try {
      await updateTaskStatus(id as string, taskId, status);
      setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status } : t));
    } catch (error) {
      console.error("Failed to update task:", error);
    }
  };

  useEffect(() => {
    if (id) fetchTasks();
  }, [id]);

  return (
    <Protected>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8">
        <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.back()}
              className="p-2 hover:bg-white dark:hover:bg-slate-900 rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-slate-800 transition-all text-slate-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Project Tasks</h1>
              <p className="text-slate-500 text-sm">Detailed view of all project requirements</p>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 animate-pulse" />
              ))}
            </div>
          ) : tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-sm">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-950 rounded-full flex items-center justify-center text-slate-300">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">No tasks found</h3>
              <p className="text-slate-500 max-w-xs mx-auto">This project doesn't have any tasks yet. Go to the dashboard to add some.</p>
              <button 
                onClick={() => router.push('/dashboard')}
                className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all"
              >
                Go to Dashboard
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {tasks.map((task) => (
                <TaskCard key={task._id} task={task} onUpdate={handleUpdate} />
              ))}
            </div>
          )}
        </div>
      </div>
    </Protected>
  );
}
