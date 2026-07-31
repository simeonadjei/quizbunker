import { useState } from 'react';
import { useAdminLogin, useGetAdminStats, useListAdminUsers, useListSongs, useUpdateSong, useDeleteSong, useListAdminActivity, useListAdminPayments, getGetAdminStatsQueryKey, getListSongsQueryKey, getListAdminUsersQueryKey, getListAdminActivityQueryKey, getListAdminPaymentsQueryKey } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, Trash2, CheckCircle, ShieldAlert, Activity, CreditCard, RefreshCw } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { format } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';

export default function AdminPortal() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  if (!isAuthenticated) {
    return <AdminLogin onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-[#0a0b10] text-gray-200 p-8 font-mono">
      <div className="max-w-6xl mx-auto space-y-12">
        <header className="border-b border-red-500/30 pb-4 mb-8">
          <h1 className="text-3xl font-bold text-red-500">SYSTEM.ADMIN_OVERRIDE</h1>
          <p className="text-gray-500 text-sm mt-1">UNAUTHORIZED ACCESS STRICTLY PROHIBITED</p>
        </header>
        
        <StatsPanel />
        
        <div className="grid md:grid-cols-2 gap-8">
          <QuestionUploader />
          <SongManager />
        </div>
        
        <UsersPanel />
        <ActivityPanel />
        <PaymentsPanel />
      </div>
    </div>
  );
}

function AdminLogin({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const login = useAdminLogin();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate({ data: { email, password } }, {
      onSuccess: () => onLogin(),
      onError: () => toast({ title: "Access Denied", description: "Invalid credentials.", variant: "destructive" })
    });
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="border border-red-500/50 p-8 bg-zinc-950 w-full max-w-sm rounded font-mono shadow-[0_0_30px_-5px_rgba(239,68,68,0.3)]">
        <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-6" />
        <h2 className="text-red-500 text-center mb-6 text-xl">AUTHENTICATION REQUIRED</h2>
        <Input 
          type="email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-black border-red-500/30 text-red-500 focus-visible:ring-red-500 rounded-none mb-3"
          placeholder="ADMIN EMAIL"
          autoComplete="email"
        />
        <Input 
          type="password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="bg-black border-red-500/30 text-red-500 focus-visible:ring-red-500 rounded-none mb-4"
          placeholder="ENTER PASSKEY"
          autoComplete="current-password"
        />
        <Button 
          type="submit" 
          className="w-full bg-red-950 hover:bg-red-900 text-red-500 border border-red-500 rounded-none"
          disabled={login.isPending}
        >
          {login.isPending ? "VERIFYING..." : "ACCESS"}
        </Button>
      </form>
    </div>
  );
}

function StatsPanel() {
  const { data: stats } = useGetAdminStats({ query: { enabled: true, queryKey: getGetAdminStatsQueryKey() } });
  
  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {[
        { label: "TOTAL USERS", val: stats.totalUsers },
        { label: "ACTIVE SUBS", val: stats.activeSubscribers, color: "text-green-400" },
        { label: "QUESTIONS", val: stats.totalQuestions },
        { label: "SUBJECTS", val: stats.totalSubjects },
        { label: "SONGS", val: stats.totalSongs },
        { label: "SESSIONS", val: stats.recentSessions },
      ].map(s => (
        <div key={s.label} className="bg-zinc-900 border border-zinc-800 p-4">
          <div className="text-zinc-500 text-xs mb-1">{s.label}</div>
          <div className={`text-2xl font-bold ${s.color || 'text-zinc-100'}`}>{s.val}</div>
        </div>
      ))}
    </div>
  );
}

function QuestionUploader() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [year, setYear] = useState('');
  const [subject, setSubject] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);
    if (year) formData.append("year", year);
    if (subject) formData.append("subject", subject);

    try {
      const res = await fetch('/api/admin/questions/upload', {
        method: 'POST',
        body: formData,
        credentials: "include"
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      
      setResult(data);
      toast({ title: "Upload Complete" });
      setFile(null);
    } catch (e: any) {
      toast({ title: "Upload Failed", description: e.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 p-6">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Upload className="w-5 h-5" /> BULK INGEST QUESTIONS</h3>
      
      <div className="space-y-4">
        <div>
          <label className="text-xs text-zinc-500">FILE (.docx, .txt)</label>
          <Input type="file" accept=".docx,.txt" onChange={(e) => setFile(e.target.files?.[0] || null)} className="bg-black border-zinc-700 mt-1" />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-zinc-500">YEAR OVERRIDE (OPTIONAL)</label>
            <Input value={year} onChange={(e) => setYear(e.target.value)} className="bg-black border-zinc-700 mt-1" placeholder="e.g. 2023" />
          </div>
          <div>
            <label className="text-xs text-zinc-500">SUBJECT OVERRIDE (OPTIONAL)</label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} className="bg-black border-zinc-700 mt-1" placeholder="e.g. MATH" />
          </div>
        </div>

        <Button 
          onClick={handleUpload} 
          disabled={!file || isUploading}
          className="w-full bg-blue-900 hover:bg-blue-800 text-blue-400 border border-blue-500 rounded-none"
        >
          {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : "EXECUTE INGEST"}
        </Button>

        {result && (
          <div className="mt-4 p-4 bg-black border border-green-500/30 text-green-400 text-sm space-y-1">
            <div><CheckCircle className="w-4 h-4 inline mr-2" /> SUCCESS</div>
            <div>INSERTED: {result.inserted}</div>
            <div>SKIPPED: {result.skipped}</div>
            {result.errors?.length > 0 && (
              <div className="text-red-400 mt-2 text-xs">ERRORS: {result.errors.length} (See console)</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SongManager() {
  const { data: songs = [], refetch } = useListSongs({ query: { enabled: true, queryKey: getListSongsQueryKey() } });
  const updateSong = useUpdateSong();
  const deleteSong = useDeleteSong();
  const { toast } = useToast();
  
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async () => {
    if (files.length === 0) return;
    setIsUploading(true);

    const formData = new FormData();
    for (const f of files) {
      formData.append("files", f);
    }

    try {
      const res = await fetch('/api/admin/songs', {
        method: 'POST',
        body: formData,
        credentials: "include"
      });
      if (!res.ok) throw new Error('Upload failed');
      
      toast({ title: `${files.length} Track${files.length > 1 ? 's' : ''} Added` });
      setFiles([]);
      refetch();
    } catch (e: any) {
      toast({ title: "Upload Failed", description: e.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 p-6 flex flex-col h-full">
      <h3 className="text-xl font-bold mb-4">AUDIO SUBSYSTEM</h3>
      
      <div className="space-y-4 mb-8">
        <div>
          <label className="text-xs text-zinc-500">AUDIO FILES (select multiple)</label>
          <Input 
            type="file" 
            accept="audio/*" 
            multiple
            onChange={(e) => setFiles(Array.from(e.target.files || []))} 
            className="bg-black border-zinc-700 mt-1 p-1 text-sm" 
          />
          {files.length > 0 && (
            <div className="mt-2 space-y-1">
              {files.map((f, i) => (
                <div key={i} className="text-xs text-zinc-400 flex items-center gap-2">
                  <span className="text-zinc-600">▶</span>
                  <span className="truncate">{f.name}</span>
                  <span className="text-zinc-600 shrink-0">({(f.size / 1024 / 1024).toFixed(1)} MB)</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <Button 
          onClick={handleUpload} 
          disabled={files.length === 0 || isUploading}
          className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-none border border-zinc-600"
        >
          {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : `UPLOAD ${files.length > 1 ? `${files.length} TRACKS` : 'TRACK'}`}
        </Button>
      </div>

      <div className="flex-1 overflow-auto bg-black border border-zinc-800 p-2">
        {songs.map(song => (
          <div key={song.id} className="flex items-center justify-between p-2 border-b border-zinc-900 hover:bg-zinc-900/50">
            <span className="text-sm truncate mr-4">{song.title}</span>
            <div className="flex items-center gap-4 shrink-0">
              <Switch 
                checked={song.isActive} 
                onCheckedChange={(v) => updateSong.mutate({ id: song.id, data: { isActive: v } }, { onSuccess: () => refetch() })} 
              />
              <button 
                onClick={() => deleteSong.mutate({ id: song.id }, { onSuccess: () => refetch() })}
                className="text-red-500 hover:text-red-400"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function UsersPanel() {
  const { data: users = [] } = useListAdminUsers({ query: { enabled: true, queryKey: getListAdminUsersQueryKey() } });

  return (
    <div className="bg-zinc-900 border border-zinc-800 p-6">
      <h3 className="text-xl font-bold mb-4">USER DATABASE</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-zinc-500 bg-black">
            <tr>
              <th className="px-4 py-3 font-normal">ID</th>
              <th className="px-4 py-3 font-normal">NAME</th>
              <th className="px-4 py-3 font-normal">EMAIL</th>
              <th className="px-4 py-3 font-normal">PLAN</th>
              <th className="px-4 py-3 font-normal">EXPIRES</th>
              <th className="px-4 py-3 font-normal">CREATED</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-zinc-800/50">
                <td className="px-4 py-3 text-zinc-500">{u.id}</td>
                <td className="px-4 py-3 text-zinc-300">{u.name}</td>
                <td className="px-4 py-3 text-zinc-400">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs ${u.subscriptionPlan !== 'none' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'text-zinc-500'}`}>
                    {u.subscriptionPlan.toUpperCase()}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-500">
                  {u.subscriptionEnd ? format(new Date(u.subscriptionEnd), 'yyyy-MM-dd') : '-'}
                </td>
                <td className="px-4 py-3 text-zinc-500">
                  {format(new Date(u.createdAt), 'yyyy-MM-dd')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
