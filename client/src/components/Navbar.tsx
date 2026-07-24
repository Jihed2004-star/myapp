import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <nav className="border-b border-slate-800 bg-slate-900/95 px-4 py-3 sm:px-6">
      <div className="mx-auto flex flex-wrap items-center justify-between gap-3">
        <Link to="/Categories" className="text-sm font-semibold text-white transition-colors hover:text-blue-400">
          MyApp
        </Link>

        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Link to="/Categories" className="text-slate-400 transition-colors hover:text-white">
            Home
          </Link>
          

            {user && (
            <Link to="/my-bookings" className="text-slate-400 transition-colors hover:text-white">
              My Bookings
            </Link>
          )}
          {user && (user.role === 'Provider' || user.role === 'Admin') && (
            <Link to="/provider/dashboard" className="text-slate-400 transition-colors hover:text-white">
              Dashboard
            </Link>
          )}
          {user && user.role === 'Admin' && (
            <>
              <Link to="/admin/users" className="text-slate-400 transition-colors hover:text-white">
                Users
              </Link>
              <Link to="/admin/categories" className="text-slate-400 transition-colors hover:text-white">
                Categories
              </Link>
            </>
          )}

          {user ? (
            <>
              <span className="text-slate-400">
                Hi, <span className="text-white">{user.fullName}</span>
              </span>
              <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-xs text-blue-400">
                {user.role}
              </span>
              <button
                onClick={handleLogout}
                className="text-slate-400 transition-colors hover:text-white"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-slate-400 transition-colors hover:text-white">
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-500"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
