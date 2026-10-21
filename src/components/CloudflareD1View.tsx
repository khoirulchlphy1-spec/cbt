import React, { useState, useEffect } from 'react';
import { 
  Cloud, Database, ShieldCheck, CheckCircle, AlertTriangle, RefreshCw, 
  UploadCloud, DownloadCloud, Play, Code, Key, ExternalLink, Download, 
  Terminal, Check, Copy, Eye, EyeOff, Layers, Sparkles
} from 'lucide-react';
import { syncApi } from '../services/apiSync';

interface Props {
  showToast: (msg: string) => void;
  onRefreshData?: () => void;
}

export const CloudflareD1View: React.FC<Props> = ({ showToast, onRefreshData }) => {
  const [loading, setLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [migratingSchema, setMigratingSchema] = useState(false);
  const [pushingData, setPushingData] = useState(false);
  const [pullingData, setPullingData] = useState(false);

  // Config states
  const [accountId, setAccountId] = useState('');
  const [databaseId, setDatabaseId] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [isNativeBinding, setIsNativeBinding] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    success?: boolean;
    message?: string;
    latencyMs?: number;
  } | null>(null);

  // SQL Console states
  const [sqlQuery, setSqlQuery] = useState('SELECT count(*) as total_siswa FROM students;');
  const [queryRunning, setQueryRunning] = useState(false);
  const [queryResult, setQueryResult] = useState<any>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [queryMeta, setQueryMeta] = useState<any>(null);

  const fetchStatus = async (runTest = false) => {
    setLoading(true);
    try {
      const data = await syncApi.getCloudflareStatus(runTest);
      setIsConfigured(Boolean(data.isConfigured));
      setIsNativeBinding(Boolean(data.isNativeBinding));
      if (data.rawConfig) {
        setAccountId(data.rawConfig.accountId || '');
        setDatabaseId(data.rawConfig.databaseId || '');
        setApiToken(data.rawConfig.apiToken || '');
      }
      if (data.testResult) {
        setConnectionStatus(data.testResult);
      } else if (data.isNativeBinding) {
        setConnectionStatus({
          success: true,
          message: data.message || "Cloudflare D1 terhubung aktif secara native di Edge Pages Functions!",
          latencyMs: 1
        });
      }
    } catch (err) {
      console.warn("fetchStatus failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus(true);
  }, []);

  const cleanTokenInput = (val: string) => {
    let t = val.trim();
    const match = t.match(/Bearer\s+([A-Za-z0-9_\-]+)/i);
    if (match) return match[1].trim();
    if (t.toLowerCase().startsWith('bearer ')) {
      t = t.slice(7).trim();
    }
    return t.replace(/["']/g, '').trim();
  };

  const handleSaveConfig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanedToken = cleanTokenInput(apiToken);
    const cleanedAccountId = accountId.trim().replace(/["']/g, '');
    const cleanedDatabaseId = databaseId.trim().replace(/["']/g, '');

    if (!cleanedAccountId || !cleanedDatabaseId || !cleanedToken) {
      showToast("Harap isi Account ID, Database ID, dan API Token!");
      return;
    }

    setApiToken(cleanedToken);
    setAccountId(cleanedAccountId);
    setDatabaseId(cleanedDatabaseId);

    setTestingConnection(true);
    setConnectionStatus(null);
    try {
      const res = await syncApi.saveCloudflareConfig({
        accountId: cleanedAccountId,
        databaseId: cleanedDatabaseId,
        apiToken: cleanedToken
      });

      if (res.testResult?.success) {
        setIsConfigured(true);
        setConnectionStatus(res.testResult);
        showToast("✅ Berhasil terhubung ke Cloudflare D1!");
      } else {
        setConnectionStatus(res.testResult || { success: false, message: "Koneksi gagal" });
        showToast("❌ Gagal terhubung ke Cloudflare D1. Periksa kredensial Anda.");
      }
    } catch (err: any) {
      setConnectionStatus({ success: false, message: err.message });
      showToast("❌ Terjadi kesalahan saat menguji koneksi.");
    } finally {
      setTestingConnection(false);
    }
  };

  const handleInitSchema = async () => {
    if (!window.confirm("Jalankan inisialisasi tabel di Cloudflare D1? Skema tabel akan dibuat otomatis tanpa menghapus data yang sudah ada.")) {
      return;
    }

    setMigratingSchema(true);
    try {
      const res = await syncApi.initCloudflareSchema();
      if (res.success) {
        showToast(res.message);
      } else {
        showToast("Gagal inisialisasi: " + res.message);
      }
    } catch (err: any) {
      showToast("Kesalahan: " + err.message);
    } finally {
      setMigratingSchema(false);
    }
  };

  const handlePushData = async () => {
    if (!window.confirm("Unggah/Push seluruh data saat ini (Siswa, Soal, Ujian, Submisi, Mapel) ke Cloudflare D1?")) {
      return;
    }

    setPushingData(true);
    try {
      const res = await syncApi.pushToCloudflare();
      if (res.success) {
        showToast(res.message);
      } else {
        showToast("Gagal sync: " + res.message);
      }
    } catch (err: any) {
      showToast("Kesalahan: " + err.message);
    } finally {
      setPushingData(false);
    }
  };

  const handlePullData = async () => {
    if (!window.confirm("Tarik/Pull data dari Cloudflare D1 ke server CBT? Data di aplikasi akan diperbarui sesuai isi database Cloudflare.")) {
      return;
    }

    setPullingData(true);
    try {
      const res = await syncApi.pullFromCloudflare();
      if (res.success) {
        showToast(res.message);
        if (onRefreshData) onRefreshData();
      } else {
        showToast("Gagal pull data: " + res.message);
      }
    } catch (err: any) {
      showToast("Kesalahan: " + err.message);
    } finally {
      setPullingData(false);
    }
  };

  const handleExecuteQuery = async () => {
    if (!sqlQuery.trim()) return;
    setQueryRunning(true);
    setQueryError(null);
    setQueryResult(null);
    setQueryMeta(null);

    try {
      const res = await syncApi.runCloudflareQuery(sqlQuery.trim());
      if (res.success) {
        setQueryResult(res.results || []);
        setQueryMeta(res.meta);
        showToast(`Query berhasil dieksekusi (${res.results?.length || 0} baris)`);
      } else {
        setQueryError(res.error || "Gagal menjalankan query.");
      }
    } catch (err: any) {
      setQueryError(err.message || "Terjadi kesalahan saat memanggil API");
    } finally {
      setQueryRunning(false);
    }
  };

  const downloadFile = (filename: string, content: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`File ${filename} berhasil diunduh!`);
  };

  const [isDownloadingZip, setIsDownloadingZip] = useState(false);

  const handleDownloadZip = async () => {
    setIsDownloadingZip(true);
    showToast("Sedang menyiapkan & mengunduh file project ZIP...");
    try {
      const res = await fetch('/api/download-zip');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'cbt-sman1toili-siap-deploy.zip';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 500);
      showToast("Berhasil! File cbt-sman1toili-siap-deploy.zip telah terunduh.");
    } catch (err: any) {
      showToast("Gagal mengunduh file: " + (err.message || 'Coba lagi'));
    } finally {
      setIsDownloadingZip(false);
    }
  };

  const handleDownloadSchema = () => {
    fetch('/cloudflare_d1_schema.sql')
      .then(res => res.text())
      .then(text => downloadFile('cloudflare_d1_schema.sql', text, 'text/sql'))
      .catch(() => showToast("File skema tersedia di root project"));
  };

  const handleDownloadWrangler = () => {
    fetch('/wrangler.toml')
      .then(res => res.text())
      .then(text => downloadFile('wrangler.toml', text, 'text/plain'))
      .catch(() => showToast("File wrangler.toml tersedia di root project"));
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-indigo-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-6">
          <Cloud size={240} />
        </div>

        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-black tracking-wider uppercase flex items-center gap-1.5">
              <Cloud size={14} className="text-orange-300" />
              CLOUDFLARE D1 (SERVERLESS SQL)
            </span>
            <span className="px-2.5 py-0.5 bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 rounded-full text-[11px] font-bold">
              Global Edge Latency
            </span>
          </div>

          <h2 className="text-2xl font-black tracking-tight mb-2">
            Pusat Integrasi Database Cloudflare D1
          </h2>
          <p className="text-amber-100 text-xs sm:text-sm leading-relaxed">
            Hubungkan CBT SMAN 1 Toili ke <strong>Cloudflare D1</strong> (database SQL relasional berbasis SQLite di jaringan global Cloudflare). Data akun siswa, paket soal, ujian, dan submisi tersimpan permanen dan tersinkronisasi secara otomatis.
          </p>

          {/* Status Indicator */}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <div className={`px-4 py-2 rounded-2xl border text-xs font-bold flex items-center gap-2 shadow-xs ${
              connectionStatus?.success
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
                : isConfigured
                  ? 'bg-amber-950/80 text-amber-300 border-amber-500/50'
                  : 'bg-slate-900/80 text-slate-300 border-slate-700'
            }`}>
              {connectionStatus?.success ? (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Terhubung ke Cloudflare D1 {connectionStatus.latencyMs ? `(${connectionStatus.latencyMs} ms)` : ''}</span>
                </>
              ) : (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                  <span>{isConfigured ? 'Kredensial Tersedia (Perlu Tes Koneksi)' : 'Belum Terkonfigurasi'}</span>
                </>
              )}
            </div>

            <button
              onClick={() => fetchStatus(true)}
              disabled={loading || testingConnection}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={14} className={testingConnection || loading ? 'animate-spin' : ''} />
              Cek Ulang Status
            </button>
          </div>
        </div>
      </div>

      {/* Native Cloudflare Pages Alert Box */}
      {isNativeBinding && (
        <div className="bg-emerald-50 border-2 border-emerald-400 rounded-3xl p-5 text-emerald-950 shadow-sm flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md">
            <Sparkles size={24} />
          </div>
          <div className="flex-1">
            <h3 className="font-black text-sm md:text-base text-emerald-900 flex items-center gap-2">
              Status: Cloudflare D1 Terhubung Otomatis (Native Edge Binding)!
            </h3>
            <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
              Karena aplikasi CBT sudah di-host di Cloudflare Pages dengan binding internal <code className="font-mono bg-emerald-200/80 px-1.5 py-0.5 rounded font-bold text-emerald-950">env.DB</code>, Anda <strong>TIDAK PERLU</strong> mengisi kredensial (Account ID, API Token) dan <strong>TIDAK PERLU</strong> menekan tombol sinkronisasi manual. Seluruh data akun siswa, paket soal, ujian, dan jawaban tersimpan otomatis ke Cloudflare D1 secara real-time!
            </p>
          </div>
        </div>
      )}

      {/* Grid: Credentials Form & Action Center */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Credentials Form */}
        <div className="lg:col-span-6 bg-white p-6 rounded-3xl shadow-xs border border-slate-200">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                <Key size={18} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-800">Kredensial Cloudflare D1</h3>
                <p className="text-[11px] text-slate-400">
                  {isNativeBinding ? 'Otomatis dihandle via Pages Binding (Opsional untuk Localhost)' : 'Kunci akses untuk komunikasi dengan D1 REST API'}
                </p>
              </div>
            </div>
            {isNativeBinding && (
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-lg flex items-center gap-1">
                <CheckCircle size={12} /> Terhubung Native
              </span>
            )}
          </div>

          {isNativeBinding && (
            <div className="mb-4 p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-xs text-emerald-900">
              <div className="font-bold flex items-center gap-1.5 text-emerald-800 mb-1">
                <CheckCircle size={15} className="text-emerald-600" />
                Tidak Perlu Diisi Lagi
              </div>
              <p className="text-[11px] leading-relaxed text-slate-600">
                Form di bawah ini tidak perlu diisi karena Cloudflare Pages membaca database D1 langsung dari server internal. Form ini hanya digunakan jika Anda mengembangkan di komputer lokal (localhost).
              </p>
            </div>
          )}

          <form onSubmit={handleSaveConfig} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Cloudflare Account ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={accountId}
                onChange={e => setAccountId(e.target.value)}
                placeholder="Contoh: 7a8b9c1d2e3f4a5b6c7d8e9f0a1b2c3d"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Ditemukan di Dashboard Cloudflare &gt; klik domain apa saja atau URL &gt; sidebar kanan bagian "Account ID".
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                D1 Database ID (UUID) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={databaseId}
                onChange={e => setDatabaseId(e.target.value)}
                placeholder="Contoh: a1b2c3d4-e5f6-7890-abcd-ef1234567890"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Ditemukan di Cloudflare Dashboard &gt; <strong>Workers &amp; D1</strong> &gt; <strong>D1 SQL Database</strong> &gt; klik nama database Anda.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Cloudflare API Token <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showToken ? "text" : "password"}
                  value={apiToken}
                  onChange={e => setApiToken(e.target.value)}
                  placeholder="Contoh: vG4yZ7... (Token dengan izin D1 Edit)"
                  className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Dibuat di Cloudflare Dashboard &gt; <strong>My Profile</strong> &gt; <strong>API Tokens</strong> &gt; Create Token (Template: D1 Edit).
              </p>
            </div>

            {connectionStatus && (
              <div className={`p-3.5 rounded-xl border text-xs ${
                connectionStatus.success
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-red-50 text-red-800 border-red-200'
              }`}>
                <div className="font-bold flex items-center gap-1.5 mb-0.5">
                  {connectionStatus.success ? <CheckCircle size={15} className="text-emerald-600" /> : <AlertTriangle size={15} className="text-red-600" />}
                  <span>{connectionStatus.success ? 'Koneksi Berhasil' : 'Koneksi Gagal'}</span>
                </div>
                <p className="text-[11px] leading-relaxed">{connectionStatus.message}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={testingConnection}
              className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl text-xs transition-colors shadow-md shadow-orange-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <ShieldCheck size={16} className={testingConnection ? 'animate-spin' : ''} />
              {testingConnection ? 'Menguji & Menyimpan...' : 'Simpan & Tes Koneksi D1'}
            </button>
          </form>
        </div>

        {/* Right Column: Operations Center */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white p-6 rounded-3xl shadow-xs border border-slate-200">
            <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                <Database size={18} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-800">Operasi Sinkronisasi &amp; Migrasi</h3>
                <p className="text-[11px] text-slate-400">Eksekusi otomatis ke Cloudflare D1</p>
              </div>
            </div>

            {isNativeBinding && (
              <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-900 flex items-start gap-2.5">
                <Sparkles size={16} className="text-blue-600 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  <strong>Otomatis Real-time:</strong> Di Cloudflare Pages, Anda tidak perlu menekan tombol Push/Pull lagi. Setiap jawaban siswa atau perubahan data langsung tersimpan otomatis ke Cloudflare D1.
                </p>
              </div>
            )}

            <div className="space-y-3">
              {/* Action 1: Auto Migrate / Init Schema */}
              <div className="p-4 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-200 transition-all flex items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-700 font-black text-xs flex items-center justify-center">1</span>
                    <h4 className="text-xs font-bold text-slate-800">Inisialisasi Tabel (Auto Migrate)</h4>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Membuat tabel <code>students</code>, <code>subjects</code>, <code>question_packages</code>, <code>submissions</code>, dll. di Cloudflare D1 secara otomatis.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleInitSchema}
                  disabled={migratingSchema}
                  className="px-3.5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                >
                  <Sparkles size={14} className={migratingSchema ? 'animate-spin' : ''} />
                  {migratingSchema ? 'Membuat...' : 'Inisialisasi'}
                </button>
              </div>

              {/* Action 2: Push Data */}
              <div className="p-4 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-200 transition-all flex items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-black text-xs flex items-center justify-center">2</span>
                    <h4 className="text-xs font-bold text-slate-800">Push Seluruh Data ke Cloudflare D1</h4>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Mengunggah seluruh data siswa, paket soal, paket ujian, nilai, dan mata pelajaran yang ada di aplikasi saat ini ke D1.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handlePushData}
                  disabled={pushingData}
                  className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                >
                  <UploadCloud size={14} className={pushingData ? 'animate-spin' : ''} />
                  {pushingData ? 'Mengunggah...' : 'Push Data'}
                </button>
              </div>

              {/* Action 3: Pull Data */}
              <div className="p-4 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-200 transition-all flex items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-black text-xs flex items-center justify-center">3</span>
                    <h4 className="text-xs font-bold text-slate-800">Tarik Data dari Cloudflare D1</h4>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Menyinkronkan dan memuat data terbaru dari Cloudflare D1 ke memori server CBT.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handlePullData}
                  disabled={pullingData}
                  className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                >
                  <DownloadCloud size={14} className={pullingData ? 'animate-spin' : ''} />
                  {pullingData ? 'Menarik...' : 'Pull Data'}
                </button>
              </div>
            </div>

            {/* Quick Downloads & Deploy Package */}
            <div className="mt-5 pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Download size={14} className="text-indigo-600" />
                  Paket Deploy & Berkas Konfigurasi
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  Siap Deploy (Update Terbaru)
                </span>
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadZip}
                  disabled={isDownloadingZip}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-md shadow-indigo-600/30 cursor-pointer disabled:opacity-50"
                  title="Unduh seluruh source code CBT lengkap siap di-upload ke GitHub atau Cloudflare Pages (cbt-sman1toili-siap-deploy.zip)"
                >
                  <Download size={16} className={isDownloadingZip ? 'animate-bounce' : ''} />
                  <span>{isDownloadingZip ? 'Mengunduh ZIP...' : 'Unduh Paket Deploy ZIP (cbt-sman1toili-siap-deploy.zip)'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadSchema}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                  title="Unduh file skema SQL database Cloudflare D1"
                >
                  <Download size={14} /> Skema D1 (.sql)
                </button>
                <button
                  type="button"
                  onClick={handleDownloadWrangler}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                  title="Unduh file wrangler.toml konfigurasi D1"
                >
                  <Download size={14} /> wrangler.toml
                </button>
              </div>
              <p className="text-[11px] text-slate-500 italic">
                * File <strong>cbt-sman1toili-siap-deploy.zip</strong> sudah mencakup source code lengkap, fungsi Cloudflare D1, dan perbaikan perlindungan identitas siswa agar nama tidak hilang saat selesai ujian.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SQL Live Console */}
      <div className="bg-slate-900 rounded-3xl p-6 text-slate-100 shadow-xl border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold">
              <Terminal size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Konsol SQL Cloudflare D1 (Live Query)</h3>
              <p className="text-[11px] text-slate-400">Jalankan perintah SQL langsung ke Cloudflare D1 dan lihat hasilnya secara instan</p>
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-slate-400 mr-1">Preset:</span>
            <button
              onClick={() => setSqlQuery('SELECT count(*) as total_siswa FROM students;')}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-mono cursor-pointer"
            >
              Count Siswa
            </button>
            <button
              onClick={() => setSqlQuery('SELECT id, student_name, student_class, score, submitted_at FROM submissions ORDER BY submitted_at DESC LIMIT 5;')}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-mono cursor-pointer"
            >
              Hasil Terbaru
            </button>
            <button
              onClick={() => setSqlQuery('SELECT * FROM subjects;')}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-mono cursor-pointer"
            >
              Mata Pelajaran
            </button>
            <button
              onClick={() => setSqlQuery('SELECT id, title, token, target_class, is_active FROM exam_packages;')}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-mono cursor-pointer"
            >
              Paket Ujian
            </button>
          </div>
        </div>

        {/* SQL Input Area */}
        <div className="relative mb-3">
          <textarea
            value={sqlQuery}
            onChange={e => setSqlQuery(e.target.value)}
            rows={3}
            placeholder="Tulis query SQL di sini, misalnya: SELECT * FROM students WHERE class = 'X-1' LIMIT 10;"
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-mono text-emerald-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="text-[11px] text-slate-400">
            {queryMeta && (
              <span>
                Durasi: <strong className="text-emerald-400">{queryMeta.duration || 0} ms</strong> • Rows read: <strong className="text-white">{queryMeta.rows_read || 0}</strong> • Rows written: <strong className="text-white">{queryMeta.rows_written || 0}</strong>
              </span>
            )}
          </div>

          <button
            onClick={handleExecuteQuery}
            disabled={queryRunning || !sqlQuery.trim()}
            className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-orange-600/30 cursor-pointer disabled:opacity-50"
          >
            <Play size={14} className={queryRunning ? 'animate-spin' : ''} />
            {queryRunning ? 'Mengeksekusi...' : 'Jalankan Query (Execute)'}
          </button>
        </div>

        {/* Query Output */}
        {queryError && (
          <div className="mt-4 p-4 bg-red-950/60 border border-red-500/40 rounded-2xl text-xs text-red-300 font-mono">
            <strong>Error:</strong> {queryError}
          </div>
        )}

        {queryResult && (
          <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
            {queryResult.length === 0 ? (
              <div className="p-4 text-xs text-slate-400 italic">Query berhasil dieksekusi, tidak ada baris yang dikembalikan.</div>
            ) : (
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-800 text-slate-400">
                    {Object.keys(queryResult[0]).map((col) => (
                      <th key={col} className="p-3 font-bold whitespace-nowrap text-orange-400">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {queryResult.map((row: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-900/60 transition-colors">
                      {Object.keys(queryResult[0]).map((col) => (
                        <td key={col} className="p-3 text-slate-200 whitespace-nowrap max-w-xs truncate">
                          {typeof row[col] === 'object' ? JSON.stringify(row[col]) : String(row[col] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Step by step guide card */}
      <div className="bg-white p-6 rounded-3xl shadow-xs border border-slate-200">
        <h3 className="font-bold text-sm text-slate-800 mb-2 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">ℹ</span>
          Panduan 2 Menit Mendapatkan Kredensial di Cloudflare:
        </h3>
        <ol className="text-xs text-slate-600 space-y-2 list-decimal list-inside pl-1 leading-relaxed">
          <li>
            Buka <a href="https://dash.cloudflare.com" target="_blank" rel="noreferrer" className="text-blue-600 font-semibold underline inline-flex items-center gap-0.5">dash.cloudflare.com <ExternalLink size={11}/></a> dan login ke akun Cloudflare Anda.
          </li>
          <li>
            Masuk ke menu <strong>Storage &amp; Databases</strong> &gt; <strong>D1 SQL Database</strong> &gt; klik <strong>Create Database</strong> (contoh: <code>cbt-sman1toili-db</code>).
          </li>
          <li>
            Salin <strong>Database ID</strong> (berbentuk UUID) dari halaman detail database tersebut dan tempelkan ke kolom form di atas.
          </li>
          <li>
            Klik profil di kanan atas &gt; <strong>My Profile</strong> &gt; <strong>API Tokens</strong> &gt; klik <strong>Create Token</strong>.
          </li>
          <li>
            Pada bagian <strong>Custom token</strong> (paling atas), klik tombol biru <strong>Get started</strong>.
          </li>
          <li>
            Beri nama token (misal: <code>CBT D1 Token</code>), lalu pada bagian <strong>Permissions</strong> pilih:<br/>
            &bull; Kolom 1: <strong>Account</strong><br/>
            &bull; Kolom 2: <strong>D1</strong><br/>
            &bull; Kolom 3: <strong>Edit</strong><br/>
            Pada <strong>Account Resources</strong> pilih <strong>All accounts</strong> (atau akun Anda), lalu klik <strong>Continue to summary</strong> &gt; <strong>Create Token</strong>.
          </li>
          <li>
            Salin API Token tersebut dan tempelkan di formulir di atas bersama Account ID dan Database ID, lalu klik <strong>Simpan &amp; Tes Koneksi D1</strong>. Selesai!
          </li>
        </ol>
      </div>
    </div>
  );
};
