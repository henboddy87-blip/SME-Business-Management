import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Store, Lock, Mail, ArrowRight, AlertCircle, Sun, Moon, Globe } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to authenticate. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-slate-100 via-emerald-50/30 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors duration-200">
      {/* Top Bar with Mode & Language Switchers */}
      <div className="w-full max-w-md flex items-center justify-end gap-2 mb-3">
        <button
          type="button"
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-xs transition-colors"
          title="Toggle Language (English / ខ្មែរ)"
        >
          <Globe className="w-3.5 h-3.5 text-emerald-500" />
          <span>{language === 'en' ? 'EN' : 'ភាសាខ្មែរ'}</span>
        </button>
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-xs transition-colors"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>
      </div>

      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 transition-colors duration-200">
        {/* Brand */}
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Logo" className="w-16 h-16 object-contain mx-auto mb-3 drop-shadow-sm" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            {language === 'kh' ? 'វេទិកាគ្រប់គ្រងអាជីវកម្មកម្ពុជា' : 'Cambodia SME SaaS'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {language === 'kh'
              ? 'ប្រព័ន្ធពពកគ្រប់គ្រងការលក់ POS ស្តុកទំនិញ និងហិរញ្ញវត្ថុ'
              : 'Multi-Tenant Cambodian Business Management SaaS'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center gap-2.5 text-xs text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {t('emailAddress')}
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@khmerstyle.com"
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {t('password')}
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-60 cursor-pointer"
          >
            {loading ? t('loading') : (language === 'kh' ? 'ចូលប្រើប្រព័ន្ធ' : 'Sign In to Business')}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500">
          {t('dontHaveAccount')}{' '}
          <Link to="/register" className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
            {t('registerNow')}
          </Link>
        </div>

        {/* Demo Fast Logins Section */}
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2.5 text-center">
            {t('quickDemoLogin')} (Khmer Style Fashion)
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleQuickLogin('owner@khmerstyle.com', 'Password@123')}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-left transition-colors"
            >
              <div className="font-semibold text-[11px]">Business Owner</div>
              <div className="text-[10px] text-slate-400 truncate">owner@khmerstyle.com</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('sales@khmerstyle.com', 'Password@123')}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-left transition-colors"
            >
              <div className="font-semibold text-[11px]">Sales Staff</div>
              <div className="text-[10px] text-slate-400 truncate">sales@khmerstyle.com</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('inventory@khmerstyle.com', 'Password@123')}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-left transition-colors"
            >
              <div className="font-semibold text-[11px]">Inventory Staff</div>
              <div className="text-[10px] text-slate-400 truncate">inventory@khmerstyle.com</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('accountant@khmerstyle.com', 'Password@123')}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-left transition-colors"
            >
              <div className="font-semibold text-[11px]">Accountant</div>
              <div className="text-[10px] text-slate-400 truncate">accountant@khmerstyle.com</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('admin@example.com', 'Admin@123456')}
              className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-300 text-left transition-colors"
            >
              <div className="font-semibold text-[11px]">Super Admin</div>
              <div className="text-[10px] text-rose-400 truncate">admin@example.com</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('cafe_owner@angkorcafe.com', 'Password@123')}
              className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-left transition-colors"
            >
              <div className="font-semibold text-[11px]">Angkor Cafe (Tenant B)</div>
              <div className="text-[10px] text-amber-400 truncate">cafe_owner@...</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
