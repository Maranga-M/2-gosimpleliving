

import React, { useState, useEffect } from 'react';
import { Save, Database, AlertCircle, CheckCircle, Lock, Sparkles, ShieldCheck, Wifi, WifiOff, Loader2, FileText, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from './Button';
import { dbService } from '../services/database';
import { User as UserType, Role } from '../types';
type AppUser = UserType;

const getEnv = (key: string): string | undefined => {
  try {
    // Try Vite's import.meta.env first
    if (import.meta.env) {
      return import.meta.env[key];
    }
    // Fallback to process.env
    if (typeof process !== 'undefined' && process.env) return process.env[key];
    if (typeof window !== 'undefined' && (window as any).process?.env) return (window as any).process.env[key];
  } catch (e) { }
  return undefined;
};

export const SettingsPage: React.FC<{ currentUser?: { uid: string; name: string; email: string } }> = ({ currentUser }) => {
  const [siteName, setSiteName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [userName, setUserName] = useState(currentUser?.name || '');
  const [isUpdatingName, setIsUpdatingName] = useState(false);

  const [areKeysSet, setAreKeysSet] = useState(false);
  const [, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'valid' | 'invalid'>('idle');
  const [connectionMessage, setConnectionMessage] = useState('');
  const [blogStatus, setBlogStatus] = useState<'idle' | 'testing' | 'valid' | 'invalid'>('idle');
  const [blogMessage, setBlogMessage] = useState('');
  const [userList, setUserList] = useState<AppUser[]>([]);
  const [usersStatus, setUsersStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [usersMessage, setUsersMessage] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserPass, setNewUserPass] = useState('');
  const [newUserRole, setNewUserRole] = useState<Role>('user');

  useEffect(() => {
    const url = getEnv('SUPABASE_URL') || getEnv('VITE_SUPABASE_URL');
    const key = getEnv('SUPABASE_ANON_KEY') || getEnv('VITE_SUPABASE_ANON_KEY');
    console.log('SettingsPage env check:', { url: !!url, key: !!key, urlValue: url, keyValue: key?.substring(0, 20) + '...' });
    setAreKeysSet(!!(url && key));

    setSiteName(localStorage.getItem('site_name') || '');
    setLogoUrl(localStorage.getItem('site_logo_url') || '');
    if (currentUser) {
      setUserName(currentUser.name);
    }
  }, [currentUser]);

  const handleUpdateUserName = async () => {
    if (!currentUser || !userName.trim()) {
      toast.error('Please enter a valid name');
      return;
    }
    setIsUpdatingName(true);
    try {
      await dbService.updateUserName(currentUser.uid, userName.trim());
      toast.success('Name updated successfully! Refreshing...');
      setTimeout(() => window.location.reload(), 1000);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to update name');
    } finally {
      setIsUpdatingName(false);
    }
  };

  const testConnection = async () => {
    if (!areKeysSet) {
      setConnectionStatus('invalid');
      setConnectionMessage('Cannot test connection. Please set your environment variables first.');
      return;
    }
    setConnectionStatus('testing');
    setConnectionMessage('Attempting to fetch products from database...');
    try {
      const prods = await dbService.getProducts();
      if (prods !== null) {
        setConnectionStatus('valid');
        setConnectionMessage(`Success! Connection established. Found ${prods.length} products.`);
      } else {
        setConnectionStatus('invalid');
        setConnectionMessage('Connection failed. Database returned null. Check your keys and network policies.');
      }
    } catch (e: any) {
      setConnectionStatus('invalid');
      setConnectionMessage(e.message || 'Fatal connection error.');
    }
  };

  const testBlogContent = async () => {
    if (!areKeysSet) {
      setBlogStatus('invalid');
      setBlogMessage('Cannot test blog/content. Please set your environment variables first.');
      return;
    }
    setBlogStatus('testing');
    setBlogMessage('Testing posts and site_content tables...');
    try {
      const posts = await dbService.getBlogPosts();
      const content = await dbService.getSiteContent();
      if (posts !== null || content !== null) {
        setBlogStatus('valid');
        setBlogMessage(`Blog OK: ${posts ? posts.length : 0} posts. Content ${content ? 'OK' : 'missing'}.`);
      } else {
        setBlogStatus('invalid');
        setBlogMessage('Failed: posts/content returned null. Check tables and RLS policies.');
      }
    } catch (e: any) {
      setBlogStatus('invalid');
      setBlogMessage(e.message || 'Fatal blog/content error.');
    }
  };

  const loadUsers = async () => {
    if (!areKeysSet) {
      setUsersStatus('error');
      setUsersMessage('Cannot load users. Please set your environment variables first.');
      return;
    }
    setUsersStatus('loading');
    setUsersMessage('Loading users from database...');
    try {
      const users = await dbService.getAllUsers();
      setUserList(users);
      setUsersStatus('ready');
      setUsersMessage(`Found ${users.length} users.`);
    } catch (e: any) {
      setUsersStatus('error');
      setUsersMessage(e?.message || 'Failed to load users.');
    }
  };

  const handleChangeRole = async (uid: string, role: Role) => {
    try {
      await dbService.updateUserRole(uid, role);
      setUserList(prev => prev.map(u => u.uid === uid ? { ...u, role } : u));
      setUsersMessage('Role updated successfully.');
    } catch (e: any) {
      setUsersMessage(e?.message || 'Failed to update role.');
    }
  };

  const handleCreateUser = async () => {
    if (!newUserEmail || !newUserPass || !newUserName) return;
    try {
      const user = await dbService.signUp(newUserEmail, newUserPass, newUserName);
      if (user?.id && newUserRole !== 'user') {
        await dbService.updateUserRole(user.id, newUserRole);
      }
      setUsersMessage('User created successfully.');
      setNewUserEmail('');
      setNewUserName('');
      setNewUserPass('');
      await loadUsers();
    } catch (e: any) {
      setUsersMessage(e?.message || 'Failed to create user.');
    }
  };

  const handleResetPassword = async (email: string) => {
    try {
      await dbService.requestPasswordReset(email);
      setUsersMessage('Password reset email sent.');
    } catch (e: any) {
      setUsersMessage(e?.message || 'Failed to send reset email.');
    }
  };

  const handleRemoveUser = async (uid: string) => {
    try {
      await dbService.deleteUser(uid);
      setUserList(prev => prev.filter(u => u.uid !== uid));
      setUsersMessage('User removed from profiles.');
    } catch (e: any) {
      setUsersMessage(e?.message || 'Failed to remove user.');
    }
  };

  const handleSaveBranding = () => {
    if (siteName.trim()) localStorage.setItem('site_name', siteName.trim());
    else localStorage.removeItem('site_name');
    if (logoUrl.trim()) localStorage.setItem('site_logo_url', logoUrl.trim());
    else localStorage.removeItem('site_logo_url');

    setSaveStatus('success');
    setTimeout(() => window.location.reload(), 1000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Settings</h2>
        <p className="text-slate-500 dark:text-slate-400">Manage your profile and system configuration.</p>
      </div>

      {/* Profile Settings */}
      {currentUser && (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden mb-8">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <User size={20} className="text-amber-500" /> Profile Settings
            </h3>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
              <input
                type="email"
                value={currentUser.email}
                disabled
                className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-500 dark:text-slate-400 cursor-not-allowed"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Email cannot be changed</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Display Name</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-amber-500 dark:text-white"
                placeholder="Your name"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">This name will appear as the author on blog posts you create</p>
            </div>
            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button
                onClick={handleUpdateUserName}
                disabled={isUpdatingName || !userName.trim() || userName === currentUser.name}
                className="gap-2"
              >
                {isUpdatingName ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                Update Profile
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* System Configuration */}
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">System Configuration</h3>
        <p className="text-slate-500 dark:text-slate-400">Manage your database connection and AI API keys.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden mb-8">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2"><Database size={20} className="text-amber-500" /> Supabase Connection</h3>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={testConnection} disabled={connectionStatus === 'testing'}>
              {connectionStatus === 'testing' ? <Loader2 size={14} className="animate-spin mr-2" /> : <Wifi size={14} className="mr-2" />}
              Test Connection
            </Button>
            <Button size="sm" variant="outline" onClick={testBlogContent} disabled={blogStatus === 'testing'}>
              {blogStatus === 'testing' ? <Loader2 size={14} className="animate-spin mr-2" /> : <FileText size={14} className="mr-2" />}
              Test Blog & Content
            </Button>
          </div>
        </div>
        <div className="p-6">
          {areKeysSet ? (
            <div className="p-4 rounded-xl border flex items-start gap-3 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300">
              <CheckCircle size={20} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Configuration Status: Ready</p>
                <p className="text-sm">Your Supabase credentials are correctly configured in your environment variables.</p>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl border flex items-start gap-3 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300">
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Action Required: Set Environment Variables</p>
                <p className="text-sm mb-3">Your Supabase URL and Key are missing. Create a <code className="font-mono text-xs bg-red-100 dark:bg-red-900/50 p-1 rounded">.env</code> file in your project root and add the following, then restart your application:</p>
                <pre className="bg-red-100 dark:bg-red-900/50 text-red-900 dark:text-red-200 p-3 rounded-lg text-xs font-mono whitespace-pre">{`VITE_SUPABASE_URL=https://qgeyubwcwusvqobbisyp.supabase.co\nVITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnZXl1Yndjd3VzdnFvYmJpc3lwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5NjM3MzgsImV4cCI6MjA4MDUzOTczOH0.viB1cGA4Nmv-Wy_iKoQw4IoSzNY1K_assLbOyRC6AwM`}</pre>
              </div>
            </div>
          )}

          {connectionStatus !== 'idle' && (
            <div className={`mt-4 p-4 rounded-xl border flex items-start gap-3 ${connectionStatus === 'valid' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300' : connectionStatus === 'invalid' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300' : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300'}`}>
              {connectionStatus === 'valid' ? <CheckCircle size={20} /> : connectionStatus === 'invalid' ? <WifiOff size={20} /> : <Loader2 size={20} className="animate-spin" />}
              <div><p className="font-bold">Connection Test</p><p className="text-sm">{connectionMessage}</p></div>
            </div>
          )}
          {blogStatus !== 'idle' && (
            <div className={`mt-4 p-4 rounded-xl border flex items-start gap-3 ${blogStatus === 'valid' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300' : blogStatus === 'invalid' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300' : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300'}`}>
              {blogStatus === 'valid' ? <CheckCircle size={20} /> : blogStatus === 'invalid' ? <WifiOff size={20} /> : <Loader2 size={20} className="animate-spin" />}
              <div><p className="font-bold">Blog & Content Test</p><p className="text-sm">{blogMessage}</p></div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden mb-8">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50"><h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2"><Lock size={20} className="text-amber-500" /> SQL & Storage Setup</h3></div>
        <div className="p-6">
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-300 rounded-lg text-sm border border-amber-200 dark:border-amber-800 mb-4 flex items-start gap-3">
            <AlertCircle size={20} className="shrink-0 mt-0.5" />
            <p><strong>Crucial:</strong> Run the SQL script in your Supabase SQL Editor to create the required tables. Then, create a public Storage bucket for images.</p>
          </div>
          <pre className="bg-slate-900 text-slate-50 p-4 rounded-lg text-xs overflow-x-auto font-mono mb-4 whitespace-pre">{`-- 1. Create database tables
CREATE TABLE IF NOT EXISTS public.profiles (id UUID REFERENCES auth.users(id) PRIMARY KEY, email TEXT, name TEXT, role TEXT DEFAULT 'user', wishlist JSONB DEFAULT '[]'::jsonb);
CREATE TABLE IF NOT EXISTS public.products (id TEXT PRIMARY KEY, title TEXT, category TEXT, price NUMERIC, "originalPrice" NUMERIC, rating NUMERIC, reviews NUMERIC, image TEXT, description TEXT, features TEXT[], "affiliateLink" TEXT, "isBestSeller" BOOLEAN, status TEXT, clicks NUMERIC DEFAULT 0, "localReviews" JSONB DEFAULT '[]'::jsonb);
CREATE TABLE IF NOT EXISTS public.posts (id TEXT PRIMARY KEY, title TEXT, excerpt TEXT, content TEXT, author TEXT, date TEXT, image TEXT, status TEXT, "linkedProductIds" TEXT[], "hero_image_url" TEXT, "comparison_tables" JSONB);
CREATE TABLE IF NOT EXISTS public.site_content (id TEXT PRIMARY KEY, content JSONB);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for data access
CREATE POLICY "Public Read" ON public.products FOR SELECT USING (true);
CREATE POLICY "Admin Write" ON public.products FOR ALL USING (true); -- Caution: Update for production
CREATE POLICY "Public Read Content" ON public.site_content FOR SELECT USING (true);
CREATE POLICY "Admin Write Content" ON public.site_content FOR ALL USING (true); -- Caution: Update for production
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');`}</pre>
          <pre className="bg-slate-900 text-slate-50 p-4 rounded-lg text-xs overflow-x-auto font-mono whitespace-pre">{`-- 2. Go to 'Storage' in your Supabase dashboard
-- 3. Click 'New Bucket'
-- 4. Name the bucket: media-assets
-- 5. IMPORTANT: Toggle 'Public bucket' to ON
-- 6. Click 'Create bucket'`}</pre>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden mb-8">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2"><ShieldCheck size={20} className="text-amber-500" /> User Manager</h3>
          <Button size="sm" variant="outline" onClick={loadUsers} disabled={usersStatus === 'loading'}>
            {usersStatus === 'loading' ? <Loader2 size={14} className="animate-spin mr-2" /> : <Database size={14} className="mr-2" />}
            Load Users
          </Button>
        </div>
        <div className="p-6">
          <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input value={newUserName} onChange={e => setNewUserName(e.target.value)} placeholder="Name" className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm dark:text-white" />
              <input value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} placeholder="Email" className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm dark:text-white" />
              <input type="password" value={newUserPass} onChange={e => setNewUserPass(e.target.value)} placeholder="Password" className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm dark:text-white" />
              <div className="flex gap-2">
                <select value={newUserRole} onChange={e => setNewUserRole(e.target.value as Role)} className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm dark:text-white">
                  <option value="user">User</option>
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                </select>
                <Button size="sm" onClick={handleCreateUser}>Create</Button>
              </div>
            </div>
          </div>
          {usersStatus !== 'idle' && (
            <div className={`mb-4 p-4 rounded-xl border flex items-start gap-3 ${usersStatus === 'ready' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300' : usersStatus === 'error' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300' : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300'}`}>
              {usersStatus === 'ready' ? <CheckCircle size={20} /> : usersStatus === 'error' ? <AlertCircle size={20} /> : <Loader2 size={20} className="animate-spin" />}
              <div><p className="font-bold">Users</p><p className="text-sm">{usersMessage}</p></div>
            </div>
          )}
          {userList.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">
                  <tr><th className="px-6 py-3">Name</th><th className="px-6 py-3">Email</th><th className="px-6 py-3">Role</th><th className="px-6 py-3 text-right">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {userList.map(u => (
                    <tr key={u.uid} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-3 font-medium text-slate-900 dark:text-white">{u.name}</td>
                      <td className="px-6 py-3 text-slate-600 dark:text-slate-300">{u.email}</td>
                      <td className="px-6 py-3">
                        <select value={u.role} onChange={e => handleChangeRole(u.uid, e.target.value as Role)} className="px-3 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-700 dark:text-slate-200">
                          <option value="user">User</option>
                          <option value="editor">Editor</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" onClick={() => handleChangeRole(u.uid, 'admin')} className="gap-2"><ShieldCheck size={16} /> Make Admin</Button>
                          <Button size="sm" variant="outline" onClick={() => handleResetPassword(u.email)}>Reset Password</Button>
                          <Button size="sm" variant="ghost" onClick={() => handleRemoveUser(u.uid)} className="text-red-600">Remove</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden mb-8">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center"><h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2"><Sparkles size={20} className="text-purple-500" /> Branding</h3></div>
        <div className="p-6 space-y-4">
          <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Site Logo Text</label><input type="text" value={siteName} onChange={(e) => setSiteName(e.target.value)} className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-amber-500 dark:text-white" placeholder="GoSimpleLiving" /></div>
          <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Custom Logo URL</label><input type="text" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-amber-500 dark:text-white" placeholder="https://..." /></div>
          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800"><Button onClick={handleSaveBranding} className="gap-2"><Save size={18} /> Save & Refresh App</Button></div>
        </div>
      </div>
    </div>
  );
};
