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
    const [allUsers, setAllUsers] = useState<any[]>([]);

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

    const fetchAllUsers = async () => {
        try {
            const res = await API.get("/auth/users");
            setAllUsers(res.data);
        } catch (error) {
            console.error("Failed to fetch all users:", error);
        }
    };

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
        fetchAllUsers();
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
                                    <span className="text-white font-black">M</span>
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
                    <header className="h-20 shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8">
                        <div className="min-w-0">
                            <h1 className="text-xl md:text-2xl font-black tracking-tight truncate flex items-center gap-2">
                                {projects.find(p => p._id === selectedProject)?.name || "Select Project"}
                                <span className="hidden sm:inline-block px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] rounded uppercase">Active</span>
                            </h1>
                        </div>

                        <div className="flex items-center gap-4 shrink-0">
                            <button onClick={logout} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
                            </button>
                        </div>
                    </header>

                    <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
                        <div className="max-w-7xl mx-auto space-y-8">
                            {/* STATS OVERVIEW */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                    <div className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Total Tasks</div>
                                    <div className="text-3xl font-black text-indigo-600">{stats.total}</div>
                                </div>
                                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                    <div className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">In Progress</div>
                                    <div className="text-3xl font-black text-amber-500">{stats.pending}</div>
                                </div>
                                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                    <div className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Completed</div>
                                    <div className="text-3xl font-black text-green-500">{stats.done}</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-12">
                                {/* LEFT: TASKS (8/12 cols) */}
                                <div className="lg:col-span-8 space-y-6">
                                    <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                <h2 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tighter">Tasks</h2>
                                                <div className="flex flex-col sm:flex-row gap-3 flex-1 sm:max-w-xl">
                                                    <input
                                                        placeholder="New task..."
                                                        value={taskForm.title}
                                                        onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                                                        className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                                                    />
                                                    <select
                                                        value={taskForm.assignedTo}
                                                        onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })}
                                                        className="sm:w-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                                                    >
                                                        <option value="">Assignee</option>
                                                        {members.map((m) => (
                                                            <option key={m.user?._id} value={m.user?._id}>
                                                                {m.user?.email}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <button onClick={createTask} className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all">Create</button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-6 space-y-4">
                                            {tasks.length === 0 ? (
                                                <div className="text-center py-20">
                                                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                                                    </div>
                                                    <h3 className="text-lg font-bold">No Tasks</h3>
                                                </div>
                                            ) : (
                                                tasks.map((task) => (
                                                    <div key={task._id} className="group bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:shadow-md">
                                                        <div className="flex items-center gap-4 min-w-0">
                                                            <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-lg font-bold ${task.status?.toLowerCase() === "done" ? "bg-green-100 dark:bg-green-900/30 text-green-600" : "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600"}`}>
                                                                {task.title?.charAt(0).toUpperCase() || "?"}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <h3 className={`font-semibold truncate ${task.status?.toLowerCase() === "done" ? "line-through text-slate-400" : ""}`}>{task.title}</h3>
                                                                <p className="text-xs text-slate-500 truncate">{task.assignedTo?.email || "Unassigned"}</p>
                                                            </div>
                                                        </div>
                                                        <select
                                                            value={task.status}
                                                            onChange={(e) => updateStatus(task._id, e.target.value as TaskStatus)}
                                                            className="text-xs font-bold bg-slate-50 dark:bg-slate-800 border-none rounded-lg py-1.5 px-3 cursor-pointer"
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

                                {/* RIGHT: SIDEBAR (4/12 cols) */}
                                <div className="lg:col-span-4 space-y-6">
                                    <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2 uppercase tracking-tighter">Team</h2>
                                        <div className="flex gap-2 mb-6">
                                            <input
                                                placeholder="User ID..."
                                                value={memberId}
                                                onChange={(e) => setMemberId(e.target.value)}
                                                className="flex-1 px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                            <button onClick={addMember} className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="5" y2="19" /><line x1="5" x2="19" y1="12" y2="12" /></svg>
                                            </button>
                                        </div>
                                        <div className="space-y-3">
                                            {members.map((m) => (
                                                <div key={m.user?._id} className="group flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                                            {m.user?.email.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="text-sm font-medium truncate">{m.user?.email}</div>
                                                            <div className="text-[10px] text-slate-400 font-bold uppercase">{m.role}</div>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => removeMember(m.user?._id)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </section>

                                    <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2 uppercase tracking-tighter">Directory</h2>
                                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                            {allUsers.map((u: any) => (
                                                <div key={u._id} className="p-3 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-100 dark:border-slate-800/50">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-xs font-bold truncate pr-2">{u.fullName || u.userName}</span>
                                                        <span className="text-[9px] bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 px-1.5 py-0.5 rounded uppercase font-black">ID</span>
                                                    </div>
                                                    <div className="flex items-center justify-between gap-2">
                                                        <code className="text-[10px] text-slate-400 truncate select-all font-mono flex-1">{u._id}</code>
                                                        <button onClick={() => navigator.clipboard.writeText(u._id)} className="p-1 hover:bg-white dark:hover:bg-slate-800 rounded transition-colors text-slate-400 hover:text-indigo-600 flex-shrink-0">
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>
                                                        </button>
                                                    </div>
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