"use client";

import { useEffect, useState, useContext } from "react";
import Navbar from "@/components/Navbar";
import Protected from "@/components/Protected";
import { AuthContext } from "@/context/AuthContext";
import API from "@/lib/axios";
import * as ProjectService from "@/services/project.service";
import { TaskStatus } from "@/types";

interface Project {
    _id: string;
    name: string;
}

interface Member {
    user: {
        _id: string;
        email: string;
    };
    role: "admin" | "member";
}

interface Task {
    _id: string;
    title: string;
    status: TaskStatus;
    assignedTo: {
        _id: string;
        email: string;
    };
}

export default function Dashboard() {
    const { logout } = useContext(AuthContext);
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProject, setSelectedProject] = useState("");

    const [members, setMembers] = useState<Member[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);

    const [projectName, setProjectName] = useState("");
    const [memberId, setMemberId] = useState("");

    const [taskForm, setTaskForm] = useState({
        title: "",
        assignedTo: "",
        dueDate: "",
    });

    const [stats, setStats] = useState({
        total: 0,
        done: 0,
        pending: 0,
    });

    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // ================= PROJECT =================
    const fetchProjects = async () => {
        try {
            const data = await ProjectService.getProjects();
            setProjects(data);
            if (data.length > 0 && !selectedProject) {
                setSelectedProject(data[0]._id);
            }
        } catch (error) {
            console.error("Failed to fetch projects:", error);
        }
    };

    const createProject = async () => {
        if (!projectName.trim()) return;
        try {
            const data = await ProjectService.createProject({ name: projectName });
            setProjects((prev) => [...prev, data]);
            setProjectName("");
            setSelectedProject(data._id);
        } catch (error) {
            console.error("Failed to create project:", error);
        }
    };

    // ================= MEMBERS =================
    const fetchMembers = async () => {
        if (!selectedProject) return;
        try {
            const res = await API.get(`/projects/${selectedProject}/members`);
            const rawData = res.data?.members || res.data || [];
            const data = Array.isArray(rawData) ? rawData.filter((m: any) => m.user) : [];
            setMembers(data);
        } catch (error) {
            console.error("Failed to fetch members:", error);
        }
    };

    const addMember = async () => {
        if (!memberId.trim()) return;
        try {
            await API.post(`/projects/${selectedProject}/add-member`, { userId: memberId, role: "member" });
            setMemberId("");
            fetchMembers();
        } catch (error) {
            console.error("Failed to add member:", error);
        }
    };

    const removeMember = async (userId: string) => {
        try {
            await API.delete(`/projects/${selectedProject}/remove-member/${userId}`);
            fetchMembers();
        } catch (error) {
            console.error("Failed to remove member:", error);
        }
    };

    const updateRole = async (userId: string, role: string) => {
        try {
            await API.patch(`/projects/${selectedProject}/update-role/${userId}`, { role });
            fetchMembers();
        } catch (error) {
            console.error("Failed to update role:", error);
        }
    };

    // ================= TASKS =================
    const fetchTasks = async () => {
        if (!selectedProject) return;
        try {
            const res = await API.get(`/tasks/${selectedProject}`);
            const data = Array.isArray(res.data) ? res.data : [];
            setTasks(data);
        } catch (error) {
            console.error("Failed to fetch tasks:", error);
        }
    };

    const createTask = async () => {
        if (!taskForm.title || !taskForm.assignedTo) return;
        try {
            await API.post(`/tasks/${selectedProject}`, taskForm);
            setTaskForm({ title: "", assignedTo: "", dueDate: "" });
            fetchTasks();
        } catch (error) {
            console.error("Failed to create task:", error);
        }
    };

    const updateStatus = async (taskId: string, status: TaskStatus) => {
        try {
            await API.patch(`/tasks/status/${taskId}`, { status });
            setTasks((prev) =>
                prev.map((t) => (t._id === taskId ? { ...t, status } : t))
            );
        } catch (error) {
            console.error("Failed to update status:", error);
        }
    };

    // ================= LOAD =================
    useEffect(() => {
        fetchProjects();
    }, []);

    useEffect(() => {
        if (selectedProject) {
            fetchMembers();
            fetchTasks();
        }
    }, [selectedProject]);

    // Re-calculate stats whenever tasks change
    useEffect(() => {
        const total = tasks.length;
        const done = tasks.filter((t) => t.status?.toLowerCase() === "done").length;
        const pending = tasks.filter((t) => t.status?.toLowerCase() !== "done").length;
        setStats({ total, done, pending });
    }, [tasks]);

    return (
        <Protected>
            <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden text-slate-900 dark:text-slate-100">
                {/* SIDEBAR */}
                <aside
                    className={`${isSidebarOpen ? "w-64" : "w-20"
                        } flex-shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 flex flex-col`}
                >
                    <div className="p-6 flex items-center justify-between">
                        {isSidebarOpen && (
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                                    <span className="text-white font-black">A</span>
                                </div>
                                <span className="font-black text-xl tracking-tighter">Task Manager</span>
                            </div>
                        )}
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><line x1="9" x2="9" y1="3" y2="21" /></svg>
                        </button>
                    </div>

                    <div className="px-4 mb-4">
                        <div className="flex gap-2">
                            {isSidebarOpen && (
                                <input
                                    placeholder="New Project..."
                                    value={projectName}
                                    onChange={(e) => setProjectName(e.target.value)}
                                    className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            )}
                            <button
                                onClick={createProject}
                                className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="5" y2="19" /><line x1="5" x2="19" y1="12" y2="12" /></svg>
                            </button>
                        </div>
                    </div>

                    <nav className="flex-1 overflow-y-auto px-3 space-y-1">
                        {projects.map((p) => (
                            <button
                                key={p._id}
                                onClick={() => setSelectedProject(p._id)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${selectedProject === p._id
                                    ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-bold"
                                    : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                    }`}
                            >
                                <div className={`w-2 h-2 rounded-full ${selectedProject === p._id ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-700"}`}></div>
                                {isSidebarOpen && <span className="truncate text-sm">{p.name}</span>}
                            </button>
                        ))}
                    </nav>

                    <div className="p-4">
                        <Navbar />
                    </div>
                </aside>

                {/* MAIN CONTENT */}
                <main className="flex-1 flex flex-col overflow-hidden">
                    <header className="h-20 flex-shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8">
                        <div>
                            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
                                {projects.find(p => p._id === selectedProject)?.name || "Select Project"}
                                <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] rounded uppercase">Active</span>
                            </h1>
                            <p className="text-xs text-slate-400 font-medium uppercase tracking-widest mt-1">Project Workspace</p>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex items-center -space-x-2">
                                {members.slice(0, 3).map((m, i) => (
                                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold ring-2 ring-transparent group-hover:ring-indigo-500 transition-all">
                                        {m.user.email.charAt(0).toUpperCase()}
                                    </div>
                                ))}
                                {members.length > 3 && (
                                    <div className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                                        +{members.length - 3}
                                    </div>
                                )}
                            </div>
                        </div>
                    </header>

                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                        <div className="max-w-6xl mx-auto space-y-8">
                            {/* STATS OVERVIEW */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white dark:bg-slate-900 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                                    <div>
                                        <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total Tasks</div>
                                        <div className="text-lg font-bold">{stats.total}</div>
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-slate-900 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                    <div>
                                        <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Done</div>
                                        <div className="text-lg font-bold">{stats.done}</div>
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-slate-900 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                    <div>
                                        <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Pending</div>
                                        <div className="text-lg font-bold">{stats.pending}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                                {/* LEFT: TASKS */}
                                <div className="xl:col-span-2 space-y-6">
                                    <section className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                        <div className="flex items-center justify-between mb-8">
                                            <h2 className="text-xl font-black">TASKS</h2>
                                            <div className="flex gap-2">
                                                <button className="px-3 py-1 text-xs font-bold bg-indigo-600 text-white rounded-full">All</button>
                                                <button className="px-3 py-1 text-xs font-medium text-slate-500">My Tasks</button>
                                            </div>
                                        </div>

                                        {/* CREATE TASK FORM */}
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 p-6 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
                                            <div className="md:col-span-2">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Task Title</label>
                                                <input
                                                    placeholder="What needs to be done?"
                                                    value={taskForm.title}
                                                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Assignee</label>
                                                <select
                                                    value={taskForm.assignedTo}
                                                    onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })}
                                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                                                >
                                                    <option value="">Assign To...</option>
                                                    {members.map((m) => (
                                                        <option key={m.user._id} value={m.user._id}>
                                                            {m.user.email}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="flex items-end">
                                                <button
                                                    onClick={createTask}
                                                    className="w-full h-[38px] bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20"
                                                >
                                                    Add Task
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            {tasks.length === 0 ? (
                                                <div className="flex flex-col items-center justify-center py-20 bg-slate-50 dark:bg-slate-950/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                                                    <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center mb-4 text-slate-400 shadow-sm">
                                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                        </svg>
                                                    </div>
                                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">No tasks yet</h3>
                                                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 text-center max-w-[250px]">Ready to boost your productivity? Create your first task above.</p>
                                                </div>
                                            ) : (
                                                tasks.map((task) => (
                                                    <div
                                                        key={task._id}
                                                        className="group bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex items-center justify-between"
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${task.status?.toLowerCase() === "done" ? "bg-green-100 dark:bg-green-900/30 text-green-600" : "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600"
                                                                }`}>
                                                                {task.title.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <h3 className={`font-semibold ${task.status?.toLowerCase() === "done" ? "line-through text-slate-400" : "text-slate-900 dark:text-white"}`}>
                                                                    {task.title}
                                                                </h3>
                                                                <p className="text-xs text-slate-500 flex items-center gap-1">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                                                    {task.assignedTo?.email || "Unassigned"}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <select
                                                            value={task.status}
                                                            onChange={(e) => updateStatus(task._id, e.target.value as TaskStatus)}
                                                            className="text-xs bg-slate-50 dark:bg-slate-800 border-none rounded-lg focus:ring-0 cursor-pointer"
                                                        >
                                                            <option value="todo">Todo</option>
                                                            <option value="in-progress">In Progress</option>
                                                            <option value="done">Done</option>
                                                        </select>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </section>
                                </div>

                                {/* RIGHT COLUMN: MEMBERS */}
                                <div className="space-y-8">
                                    <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm sticky top-8">
                                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-500"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                                            Team Members
                                        </h2>

                                        <div className="flex gap-2 mb-6">
                                            <input
                                                placeholder="User ID..."
                                                value={memberId}
                                                onChange={(e) => setMemberId(e.target.value)}
                                                className="flex-1 px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                            <button
                                                onClick={addMember}
                                                className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="5" y2="19" /><line x1="5" x2="19" y1="12" y2="12" /></svg>
                                            </button>
                                        </div>

                                        <div className="space-y-3">
                                            {members.map((m) => (
                                                <div key={m.user._id} className="group flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-800">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold">
                                                            {m.user.email.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="max-w-[120px]">
                                                            <div className="text-sm font-medium truncate" title={m.user.email}>{m.user.email}</div>
                                                            <select
                                                                value={m.role}
                                                                onChange={(e) => updateRole(m.user._id, e.target.value)}
                                                                className="text-[10px] bg-transparent border-none text-slate-500 uppercase tracking-wider font-bold cursor-pointer outline-none"
                                                            >
                                                                <option value="admin">Admin</option>
                                                                <option value="member">Member</option>
                                                            </select>
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={() => removeMember(m.user._id)}
                                                        className="p-1 text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </Protected>
    );
}