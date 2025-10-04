import React, { useState } from 'react';
import { HeroFrame } from '../components/HeroFrame';
import { MemberGrid } from '../components/MemberGrid';
import { DetailsPanel } from '../components/DetailsPanel';
import { classInfo, members } from '../data/classData';

export function GioiThieuPage(){
  const [selected, setSelected] = useState(null);
  return (
    <div className="min-h-screen flex flex-col">
      <div className="hero-block relative">
        <div className="container mx-auto px-6 py-24 text-center relative z-[1]">
          <HeroFrame text={classInfo.name} />
          <p className="mt-14 md:mt-20 text-2xl md:text-3xl font-semibold text-white drop-shadow-lg">Trường THPT Hoài Đức B</p>
          <p className="mt-8 md:mt-10 text-xl md:text-2xl text-white font-medium tracking-wide" id="classSlogan">{classInfo.slogan}</p>
        </div>
      </div>
      <main className="container mx-auto px-6 py-12 flex-1">
        <section className="mb-20">
          <div className="bg-white dark:bg-gray-800/50 rounded-2xl shadow-xl p-8 md:p-12 lg:flex lg:items-center lg:gap-12 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]">
            <div className="lg:w-1/3 mb-8 lg:mb-0 flex justify-center">
              <div className="teacher-portrait-wrapper parallelogram-shape mx-auto">
                <img src="/GVN.png" alt="Ảnh Giáo viên chủ nhiệm" className="teacher-portrait object-cover" />
              </div>
            </div>
            <div className="lg:w-2/3 text-center lg:text-left">
              <h2 className="text-3xl font-bold mb-2 text-green-600 dark:text-green-400">Giáo Viên Chủ Nhiệm</h2>
              <h3 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">Cô Phùng Thị Thanh Huyền</h3>
              <blockquote className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed border-l-4 border-green-200 dark:border-green-700 pl-4 italic">
                "Với tất cả tình yêu thương và tâm huyết, cô mong rằng A12K45 sẽ là một tập thể đoàn kết, luôn giúp đỡ nhau trong học tập và cùng nhau tạo nên những kỷ niệm đẹp đẽ nhất của tuổi học trò. Hãy luôn tự tin, vững bước trên con đường chinh phục tri thức và thực hiện ước mơ của mình nhé!"
              </blockquote>
              <span className="text-gray-500 dark:text-gray-400">— Lời nhắn từ cô chủ nhiệm</span>
            </div>
          </div>
        </section>
        <h2 className="text-3xl font-bold text-center mb-12">Gặp Gỡ Các Thành Viên</h2>
        <MemberGrid members={members} onSelect={m => setSelected(m)} />
      </main>
      <DetailsPanel member={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
