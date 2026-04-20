import React from 'react';
import { Link } from 'react-router-dom';

function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-indigo-600 flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-5xl font-bold text-white mb-4">Welcome to Anita Traders</h1>
      <p className="text-lg text-white mb-8 max-w-xl">
        Your one-stop solution for trading, billing, and repair services.
        Manage orders, payments, and inventory all in one platform.
      </p>

      <div className="flex gap-4 flex-wrap justify-center">
        <Link to="/login">
          <button className="bg-white text-blue-600 font-semibold py-3 px-6 rounded-lg hover:bg-gray-100 transition">
            Sign In
          </button>
        </Link>
        <Link to="/dashboard">
          <button className="bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition">
            Dashboard
          </button>
        </Link>
      </div>

      <footer className="mt-12 text-white text-sm">
        &copy; {new Date().getFullYear()} Anita Traders. All rights reserved.
      </footer>
    </div>
  );
}

export default LandingPage;