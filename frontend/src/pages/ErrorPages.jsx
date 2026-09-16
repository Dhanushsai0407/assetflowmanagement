import React from 'react';
import { Link } from 'react-router-dom';
import { FiAlertTriangle, FiAlertOctagon, FiArrowLeft } from 'react-icons/fi';

export const NotFound = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-md">
        <FiAlertTriangle className="w-8 h-8" />
      </div>
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold tracking-tight text-secondary-900 dark:text-white">Page Not Found</h1>
        <p className="text-sm text-secondary-400">The module page you are looking for does not exist or has been shifted.</p>
      </div>
      <Link
        to="/"
        className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-xs font-semibold shadow-md transition-all mt-4"
      >
        <FiArrowLeft />
        <span>Return to Dashboard</span>
      </Link>
    </div>
  );
};

export const Forbidden = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
      <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 shadow-md">
        <FiAlertOctagon className="w-8 h-8" />
      </div>
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold tracking-tight text-secondary-900 dark:text-white">Access Forbidden</h1>
        <p className="text-sm text-secondary-400">You do not possess the required security clearance level to view this ERP module.</p>
      </div>
      <Link
        to="/"
        className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-xs font-semibold shadow-md transition-all mt-4"
      >
        <FiArrowLeft />
        <span>Return to Dashboard</span>
      </Link>
    </div>
  );
};
