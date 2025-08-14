import React from 'react';
import Dashboard from './components/Dashboard';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
                YouTube Stream Analyzer
            </h1>
            <p className="mt-4 text-lg text-indigo-300">
                Upload a channel screenshot to analyze stream data from the last year.
            </p>
        </header>
        <Dashboard />
      </main>
      <footer className="text-center py-6 mt-8">
          <p className="text-gray-500">&copy; 2024 Screenshot Analyzer. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default App;