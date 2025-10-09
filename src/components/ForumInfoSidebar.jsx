import React from 'react';

export function ForumInfoSidebar(){
  return (
    <aside className="hidden lg:block lg:col-span-3">
      <div className="sticky top-6">
        <div className="bg-white dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Giới thiệu</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              Đây là forum của lớp <span className="font-semibold text-green-600 dark:text-green-400 whitespace-nowrap">A12K45 THPT Hoài Đức B.</span>
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Kênh mạng xã hội</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" target="_blank" rel="noopener" className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline" title="Sẽ bổ sung link Facebook" aria-label="Facebook A12K45">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
                    <path d="M22.675 0h-21.35C.597 0 0 .597 0 1.326v21.348C0 23.403.597 24 1.326 24H12.82v-9.294H9.692V11.29h3.128V8.413c0-3.1 1.894-4.788 4.66-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.588l-.467 3.416h-3.121V24h6.116C23.403 24 24 23.403 24 22.674V1.326C24 .597 23.403 0 22.675 0z"/>
                  </svg>
                  <span>Facebook (A12K45)</span>
                </a>
              </li>
              <li>
                <a href="#" target="_blank" rel="noopener" className="inline-flex items-center gap-2 text-gray-900 dark:text-gray-100 hover:underline" title="Sẽ bổ sung link TikTok" aria-label="TikTok A12K45">
                  <svg viewBox="0 0 256 256" className="w-5 h-5 fill-current" aria-hidden="true">
                    <path d="M197.6 85.7c-20.4-12.3-33.3-32.5-35.4-55.7h-30.3v146.3c0 16.7-13.5 30.2-30.2 30.2-16.7 0-30.2-13.5-30.2-30.2s13.5-30.2 30.2-30.2c3.5 0 6.9.6 10.1 1.8V96.5c-3.3-.4-6.7-.7-10.1-.7-34.6 0-62.7 28.1-62.7 62.7s28.1 62.7 62.7 62.7 62.7-28.1 62.7-62.7V90.1c10 8.1 22.4 13.4 36.1 14.8V85.7z"/>
                  </svg>
                  <span>TikTok (A12K45)</span>
                </a>
              </li>
            </ul>
            <div className="mt-2 text-[11px] text-gray-500 dark:text-gray-400"></div>
          </div>
        </div>
      </div>
    </aside>
  );
}

