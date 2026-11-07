import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { BottomNav } from './BottomNav';

export const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-ambient-white text-slate-900 dark:text-white flex flex-col justify-between selection:bg-brand-rose selection:text-white transition-colors duration-200">
      <Header />
      <main 
        className="flex-1 w-full max-w-md mx-auto px-3 sm:px-4 pt-2.5 flex flex-col"
        style={{
          paddingBottom: 'max(5.5rem, calc(env(safe-area-inset-bottom, 0px) + 5rem))',
        }}
      >
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
};
