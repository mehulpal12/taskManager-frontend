"use client";
import { useContext } from "react";
import { AuthContext } from "@/context/AuthContext";

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);

  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-sm flex-shrink-0">
          {user?.email?.charAt(0).toUpperCase() || "U"}
        </div>
        <div className="flex flex-col overflow-hidden">
          <span className="text-sm font-semibold truncate dark:text-white">
            {user?.email?.split('@')[0] || "User"}
          </span>
          <span className="text-[10px] text-slate-500 truncate lowercase">
            {user?.email || "Guest"}
          </span>
        </div>
      </div>
      
      <button 
        onClick={logout}
        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all"
        title="Logout"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
      </button>
    </div>
  );
}