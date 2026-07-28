import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogoMark } from './ui/LogoMark';

export default function Footer() {
  const { user } = useAuth();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-white px-4 py-10 sm:px-6">
      <div className="mx-auto grid max-w-7xl gap-8 sm:grid-cols-3">
        <div>
          <div className="flex items-center gap-2 text-base font-bold text-slate-900">
            <LogoMark />
            Reservo
          </div>
          <p className="mt-3 max-w-xs text-sm text-slate-500">
            Browse categories, pick a time, book it. Simple scheduling for any
            kind of service.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-slate-900">Navigate</h4>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link to="/Categories" className="text-slate-500 hover:text-indigo-600">
                Categories
              </Link>
            </li>
            {user ? (
              <li>
                <Link to="/my-bookings" className="text-slate-500 hover:text-indigo-600">
                  My Bookings
                </Link>
              </li>
            ) : (
              <>
                <li>
                  <Link to="/login" className="text-slate-500 hover:text-indigo-600">
                    Login
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="text-slate-500 hover:text-indigo-600">
                    Register
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-slate-900">Support</h4>
          <p className="mt-3 text-sm text-slate-500">
            <a href="mailto:support@reservo.app" className="hover:text-indigo-600">
              support@reservo.app
            </a>
          </p>
        </div>
      </div>

      <div className="mx-auto mt-8 max-w-7xl border-t border-slate-100 pt-6 text-center text-xs text-slate-400">
        © {year} Reservo. All rights reserved.
      </div>
    </footer>
  );
}
