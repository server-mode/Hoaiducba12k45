import React from 'react';
import { useAuth } from '../context/AuthContext.jsx';

export function UsersSidebar(){
  const { listUsers } = useAuth();
  const [users, setUsers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(()=>{
    let alive = true;
    (async ()=>{
      try {
        const data = await listUsers();
        if(alive) setUsers((data||[]).filter(u=>!u.suspended));
      } finally { if(alive) setLoading(false); }
    })();
    return ()=>{ alive = false; };
  }, [listUsers]);

  return (
    <aside className="hidden lg:block lg:col-span-3">
      <div className="sticky top-6">
        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-3">Thành viên đã đăng ký</h3>
        <div className="bg-white dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 max-h-[70vh] overflow-auto custom-scrollbar">
          {loading ? (
            <div className="text-xs text-gray-500">Đang tải...</div>
          ) : users.length ? (
            <ul className="divide-y divide-gray-200/70 dark:divide-gray-700/70">
              {users.map(u => (
                <li key={u.id} className="py-2 flex items-center gap-3">
                  <a href={`/profile/${u.id}`} className="w-9 h-9 rounded-full bg-green-600 text-white flex items-center justify-center overflow-hidden flex-shrink-0">
                    {u.avatar ? <img src={u.avatar} alt="avatar" className="w-full h-full object-cover" /> : (u.name||u.email||'?').charAt(0).toUpperCase()}
                  </a>
                  <div className="min-w-0">
                    <a href={`/profile/${u.id}`} className="block text-sm font-medium text-gray-800 dark:text-gray-200 truncate hover:underline">{u.name || u.email}</a>
                    {u.email && <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{u.email}</div>}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-xs text-gray-500">Chưa có người dùng.</div>
          )}
        </div>
      </div>
    </aside>
  );
}
