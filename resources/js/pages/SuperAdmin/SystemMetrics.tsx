import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    RefreshCw,
    Server,
    Database,
    HardDrive,
    Cpu,
    Activity,
    AlertTriangle,
    CheckCircle,
    Zap,
    Clock,
    BarChart3,
    XCircle,
    Info,
    Gauge
} from 'lucide-react';
import AdminBaseLayout from '@/components/base/AdminBaseLayout';
import axios from 'axios';

// ─── Types ──────────────────────────────────────────────────────

interface MetricsData {
    server: {
        memory: {
            current: number;
            current_formatted: string;
            peak: number;
            peak_formatted: string;
            limit: number;
            limit_formatted: string;
            usage_percentage: number;
        };
        cpu: {
            usage_percent: number;
            cores: number;
            load_1min: number;
            load_5min: number;
            load_15min: number;
        };
        php: {
            version: string;
            os: string;
            sapi: string;
            max_execution_time: string;
            upload_max_filesize: string;
            post_max_size: string;
            memory_limit: string;
            opcache_enabled: boolean;
        };
        uptime: string;
    };
    database: {
        database_name: string;
        total_size_mb: number;
        table_count: number;
        top_tables: Array<{ name: string; size_mb: number; rows: number; index_size_mb: number }>;
        connections: {
            max: number;
            current: number;
            usage_percent: number;
        };
        query_stats: {
            slow_queries: number;
            total_questions: number;
            queries_per_sec: number;
            uptime_hours: number;
        };
    };
    application: {
        cache: { driver: string; session: string; queue: string };
        records: Record<string, number>;
        activity_24h: Record<string, number>;
        config: { debug_mode: boolean; app_env: string; log_channel: string };
    };
    storage: {
        disk: {
            total: number;
            total_formatted: string;
            used: number;
            used_formatted: string;
            free: number;
            free_formatted: string;
            usage_percentage: number;
        };
        storage_folders: Record<string, { size: number; size_formatted: string; files: number }>;
    };
    performance: {
        db_ping_ms: number;
        cache_ping_ms: number;
        fs_ping_ms: number;
    };
    request_time_ms: number;
    timestamp: string;
}

interface BenchmarkResult {
    db_read_ms: number;
    db_write_ms: number;
    cache_rw_ms: number;
    filesystem_ms: number;
    php_compute_ms: number;
    json_codec_ms: number;
    db_aggregate_ms: number;
    total_ms: number;
    grade: string;
    timestamp: string;
}

interface MetricsSnapshot {
    cpuPercent: number;
    memoryPercent: number;
    dbPingMs: number;
    timestamp: number;
}

interface Props {
    auth: { user: { id: number; email: string; role: string; status: string } };
}

// ─── Helpers ────────────────────────────────────────────────────

function healthColor(pct: number): string {
    if (pct < 50) return 'text-green-600 dark:text-green-400';
    if (pct < 75) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
}

function healthBg(pct: number): string {
    if (pct < 50) return 'bg-green-500';
    if (pct < 75) return 'bg-yellow-500';
    return 'bg-red-500';
}

function gradeColor(grade: string): string {
    if (grade.startsWith('A')) return 'text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400';
    if (grade === 'B') return 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400';
    if (grade === 'C') return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30 dark:text-yellow-400';
    return 'text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400';
}

function latencyBadge(ms: number): React.ReactNode {
    const cls = ms < 5 ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
        : ms < 20 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300'
            : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300';
    return <Badge className={cls}>{ms} ms</Badge>;
}

// Sparkline mini-chart (pure SVG, no library)
function Sparkline({ data, color = '#991b1b', height = 32, width = 120 }: {
    data: number[];
    color?: string;
    height?: number;
    width?: number;
}) {
    if (data.length < 2) return <div style={{ width, height }} />;
    const max = Math.max(...data, 1);
    const min = Math.min(...data, 0);
    const range = max - min || 1;
    const points = data.map((v, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((v - min) / range) * (height - 4) - 2;
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg width={width} height={height} className="inline-block">
            <polyline fill="none" stroke={color} strokeWidth="1.5" points={points} />
        </svg>
    );
}

// Circular gauge
function CircularGauge({ percentage, size = 80, strokeWidth = 8, label }: {
    percentage: number;
    size?: number;
    strokeWidth?: number;
    label: string;
}) {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (Math.min(percentage, 100) / 100) * circumference;
    const color = percentage < 50 ? '#16a34a' : percentage < 75 ? '#ca8a04' : '#dc2626';

    return (
        <div className="flex flex-col items-center">
            <svg width={size} height={size} className="-rotate-90">
                <circle cx={size / 2} cy={size / 2} r={radius}
                    fill="none" stroke="currentColor" strokeWidth={strokeWidth}
                    className="text-gray-200 dark:text-gray-700" />
                <circle cx={size / 2} cy={size / 2} r={radius}
                    fill="none" stroke={color} strokeWidth={strokeWidth}
                    strokeDasharray={circumference} strokeDashoffset={offset}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
            </svg>
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</span>
            <span className={`text-sm font-bold ${healthColor(percentage)}`}>{percentage}%</span>
        </div>
    );
}

// Settings2 icon (inline since lucide may not have it in all versions)
function Settings2(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
            strokeLinejoin="round" {...props}>
            <path d="M20 7h-9" /><path d="M14 17H5" />
            <circle cx="17" cy="17" r="3" /><circle cx="7" cy="7" r="3" />
        </svg>
    );
}

// ─── Main Component ─────────────────────────────────────────────

export default function SystemMetrics({ auth }: Props) {
    const user = auth.user;
    const [metrics, setMetrics] = useState<MetricsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [autoRefresh, setAutoRefresh] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    const [activeTab, setActiveTab] = useState<'overview' | 'database' | 'performance' | 'config'>('overview');

    // Benchmark state
    const [benchmark, setBenchmark] = useState<BenchmarkResult | null>(null);
    const [benchmarkHistory, setBenchmarkHistory] = useState<BenchmarkResult[]>([]);
    const [benchmarking, setBenchmarking] = useState(false);

    // History for sparklines (last 30 snapshots)
    const [history, setHistory] = useState<MetricsSnapshot[]>([]);
    const historyRef = useRef<MetricsSnapshot[]>([]);

    const getToken = () => localStorage.getItem('auth_token');

    const fetchMetrics = useCallback(async () => {
        try {
            const { data } = await axios.get('/api/v1/admin/system-metrics', {
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            if (data.success) {
                // Ensure application sub-objects have safe defaults
                const metricsData = data.data;
                if (metricsData.application) {
                    metricsData.application.cache = metricsData.application.cache ?? { driver: 'unknown', session: 'unknown', queue: 'unknown' };
                    metricsData.application.records = metricsData.application.records ?? {};
                    metricsData.application.activity_24h = metricsData.application.activity_24h ?? {};
                    metricsData.application.config = metricsData.application.config ?? { debug_mode: false, app_env: 'unknown', log_channel: 'unknown' };
                }
                setMetrics(metricsData);
                setLastUpdated(new Date());

                // Push to history (max 30 points)
                const snap: MetricsSnapshot = {
                    cpuPercent: data.data.server.cpu.usage_percent,
                    memoryPercent: data.data.server.memory.usage_percentage,
                    dbPingMs: data.data.performance.db_ping_ms,
                    timestamp: Date.now(),
                };
                historyRef.current = [...historyRef.current.slice(-29), snap];
                setHistory([...historyRef.current]);
            }
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 401) {
                window.location.href = '/login';
            }
        } finally {
            setLoading(false);
        }
    }, []);

    const runBenchmark = useCallback(async () => {
        setBenchmarking(true);
        try {
            const { data } = await axios.post('/api/v1/admin/system-metrics/benchmark', {}, {
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            if (data.success) {
                setBenchmark(data.data);
                setBenchmarkHistory(prev => [...prev.slice(-9), data.data]);
            }
        } catch {
            // silent
        } finally {
            setBenchmarking(false);
        }
    }, []);

    // Initial fetch
    useEffect(() => { fetchMetrics(); }, [fetchMetrics]);

    // Auto-refresh (30s when enabled)
    useEffect(() => {
        if (!autoRefresh) return;
        const id = setInterval(fetchMetrics, 30000);
        return () => clearInterval(id);
    }, [autoRefresh, fetchMetrics]);

    // ─── Tab: Overview ──────────────────────────────────────────

    const OverviewTab = () => {
        if (!metrics) return null;
        const m = metrics;

        return (
            <div className="space-y-6">
                {/* Health Gauges Row */}
                <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Gauge className="h-5 w-5 text-maroon-600 dark:text-gray-400" />
                            System Health
                        </CardTitle>
                        <CardDescription>Real-time resource utilization</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap items-center justify-around gap-6">
                            <CircularGauge percentage={m.server.memory.usage_percentage} label="Memory" />
                            <CircularGauge percentage={m.server.cpu.usage_percent} label="CPU" />
                            <CircularGauge percentage={m.storage.disk.usage_percentage} label="Disk" />
                            <CircularGauge percentage={m.database.connections.usage_percent} label="DB Conn" />
                        </div>
                    </CardContent>
                </Card>

                {/* 4 Key Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Memory */}
                    <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Memory</CardTitle>
                            <Server className="h-4 w-4 text-maroon-600 dark:text-gray-400" />
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${healthColor(m.server.memory.usage_percentage)}`}>
                                {m.server.memory.usage_percentage}%
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {m.server.memory.current_formatted} / {m.server.memory.limit_formatted}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                                Peak: {m.server.memory.peak_formatted}
                            </p>
                            <div className="mt-2">
                                <Sparkline data={history.map(h => h.memoryPercent)} color="#991b1b" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* CPU */}
                    <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">CPU</CardTitle>
                            <Cpu className="h-4 w-4 text-maroon-600 dark:text-gray-400" />
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${healthColor(m.server.cpu.usage_percent)}`}>
                                {m.server.cpu.usage_percent}%
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {m.server.cpu.cores} core{m.server.cpu.cores > 1 ? 's' : ''}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                                Load: {m.server.cpu.load_1min} / {m.server.cpu.load_5min} / {m.server.cpu.load_15min}
                            </p>
                            <div className="mt-2">
                                <Sparkline data={history.map(h => h.cpuPercent)} color="#b45309" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Disk */}
                    <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Disk</CardTitle>
                            <HardDrive className="h-4 w-4 text-maroon-600 dark:text-gray-400" />
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${healthColor(m.storage.disk.usage_percentage)}`}>
                                {m.storage.disk.usage_percentage}%
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {m.storage.disk.used_formatted} / {m.storage.disk.total_formatted}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                                Free: {m.storage.disk.free_formatted}
                            </p>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-3">
                                <div className={`h-2 rounded-full ${healthBg(m.storage.disk.usage_percentage)}`}
                                    style={{ width: `${m.storage.disk.usage_percentage}%`, transition: 'width 0.5s ease' }} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Database */}
                    <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Database</CardTitle>
                            <Database className="h-4 w-4 text-maroon-600 dark:text-gray-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-maroon-800 dark:text-gray-200">
                                {m.database.total_size_mb} MB
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {m.database.table_count} tables &middot; {m.database.connections.current} / {m.database.connections.max} conn
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                                {m.database.query_stats.queries_per_sec} queries/sec
                            </p>
                            <div className="mt-2">
                                <Sparkline data={history.map(h => h.dbPingMs)} color="#0369a1" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Latency Pings + 24h Activity Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Latency Pings */}
                    <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Zap className="h-4 w-4 text-maroon-600 dark:text-gray-400" />
                                Response Latency
                            </CardTitle>
                            <CardDescription>Real-time ping to subsystems</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Database className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                        <span className="text-sm">Database</span>
                                    </div>
                                    {latencyBadge(m.performance.db_ping_ms)}
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Server className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                        <span className="text-sm">Cache ({m.application.cache.driver})</span>
                                    </div>
                                    {latencyBadge(m.performance.cache_ping_ms)}
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <HardDrive className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                        <span className="text-sm">Filesystem</span>
                                    </div>
                                    {latencyBadge(m.performance.fs_ping_ms)}
                                </div>
                                <div className="flex items-center justify-between border-t dark:border-gray-700 pt-2">
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                        <span className="text-sm font-medium">API Response</span>
                                    </div>
                                    {latencyBadge(m.request_time_ms)}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 24h Activity */}
                    <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Activity className="h-4 w-4 text-maroon-600 dark:text-gray-400" />
                                24-Hour Activity
                            </CardTitle>
                            <CardDescription>System activity in the last day</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                    <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                                        {m.application?.activity_24h?.new_users ?? 0}
                                    </div>
                                    <div className="text-xs text-blue-600 dark:text-blue-300 mt-1">New Users</div>
                                </div>
                                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                    <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                                        {m.application?.activity_24h?.survey_responses ?? 0}
                                    </div>
                                    <div className="text-xs text-green-600 dark:text-green-300 mt-1">Responses</div>
                                </div>
                                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                    <div className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                                        {m.application?.activity_24h?.new_content ?? 0}
                                    </div>
                                    <div className="text-xs text-purple-600 dark:text-purple-300 mt-1">New Content</div>
                                </div>
                            </div>

                            <div className="mt-4 space-y-2">
                                {Object.entries(m.application?.records ?? {}).map(([key, val]) => (
                                    <div key={key} className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-400 capitalize">
                                            {key.replace(/_/g, ' ')}
                                        </span>
                                        <span className="font-semibold text-maroon-800 dark:text-gray-200">
                                            {(val as number).toLocaleString()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    };

    // ─── Tab: Database ──────────────────────────────────────────

    const DatabaseTab = () => {
        if (!metrics) return null;
        const db = metrics.database;

        return (
            <div className="space-y-6">
                {/* DB Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                        <CardContent className="pt-6">
                            <div className="text-sm text-gray-500 dark:text-gray-400">Total Size</div>
                            <div className="text-2xl font-bold text-maroon-800 dark:text-gray-200 mt-1">{db.total_size_mb} MB</div>
                            <div className="text-xs text-gray-400">{db.table_count} tables</div>
                        </CardContent>
                    </Card>
                    <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                        <CardContent className="pt-6">
                            <div className="text-sm text-gray-500 dark:text-gray-400">Connections</div>
                            <div className="text-2xl font-bold text-maroon-800 dark:text-gray-200 mt-1">
                                {db.connections.current} / {db.connections.max}
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-2">
                                <div className={`h-1.5 rounded-full ${healthBg(db.connections.usage_percent)}`}
                                    style={{ width: `${db.connections.usage_percent}%` }} />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                        <CardContent className="pt-6">
                            <div className="text-sm text-gray-500 dark:text-gray-400">Queries/sec</div>
                            <div className="text-2xl font-bold text-maroon-800 dark:text-gray-200 mt-1">{db.query_stats.queries_per_sec}</div>
                            <div className="text-xs text-gray-400">{db.query_stats.total_questions.toLocaleString()} total</div>
                        </CardContent>
                    </Card>
                    <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                        <CardContent className="pt-6">
                            <div className="text-sm text-gray-500 dark:text-gray-400">Slow Queries</div>
                            <div className={`text-2xl font-bold mt-1 ${db.query_stats.slow_queries > 10 ? 'text-red-600' : 'text-green-600 dark:text-green-400'}`}>
                                {db.query_stats.slow_queries}
                            </div>
                            <div className="text-xs text-gray-400">MySQL uptime: {db.query_stats.uptime_hours}h</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Table Sizes */}
                <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Database className="h-5 w-5 text-maroon-600 dark:text-gray-400" />
                            Top Database Tables
                        </CardTitle>
                        <CardDescription>Sorted by total size (data + indexes)</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b dark:border-gray-700">
                                        <th className="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400">#</th>
                                        <th className="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Table</th>
                                        <th className="text-right py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Size</th>
                                        <th className="text-right py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Index</th>
                                        <th className="text-right py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Rows</th>
                                        <th className="py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Proportion</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {db.top_tables.map((t, i) => {
                                        const pct = db.total_size_mb > 0
                                            ? Math.round((t.size_mb / db.total_size_mb) * 100)
                                            : 0;
                                        return (
                                            <tr key={i} className="border-b dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                <td className="py-2 px-3 text-gray-400">{i + 1}</td>
                                                <td className="py-2 px-3 font-mono text-xs">{t.name}</td>
                                                <td className="py-2 px-3 text-right">{t.size_mb} MB</td>
                                                <td className="py-2 px-3 text-right text-gray-500">{t.index_size_mb} MB</td>
                                                <td className="py-2 px-3 text-right">{(t.rows ?? 0).toLocaleString()}</td>
                                                <td className="py-2 px-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-full max-w-[100px] bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                                            <div className="h-1.5 rounded-full bg-maroon-600"
                                                                style={{ width: `${pct}%` }} />
                                                        </div>
                                                        <span className="text-xs text-gray-500 w-8">{pct}%</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Storage Folders */}
                <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <HardDrive className="h-5 w-5 text-maroon-600 dark:text-gray-400" />
                            Storage Breakdown
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {Object.entries(metrics.storage.storage_folders).map(([name, info]) => (
                                <div key={name} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                    <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">{name}</div>
                                    <div className="text-lg font-bold text-maroon-800 dark:text-gray-200 mt-1">
                                        {info.size_formatted}
                                    </div>
                                    <div className="text-xs text-gray-400">{info.files} files</div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    };

    // ─── Tab: Performance ───────────────────────────────────────

    const PerformanceTab = () => (
        <div className="space-y-6">
            {/* Benchmark Runner */}
            <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-maroon-600 dark:text-gray-400" />
                        Performance Benchmark
                    </CardTitle>
                    <CardDescription>
                        Run a comprehensive benchmark to test database, cache, filesystem, and PHP compute performance.
                        Results help identify bottlenecks on the system.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button
                        onClick={runBenchmark}
                        disabled={benchmarking}
                        className="bg-maroon-700 hover:bg-maroon-800 text-white"
                    >
                        {benchmarking ? (
                            <>
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                Running Benchmark...
                            </>
                        ) : (
                            <>
                                <Zap className="h-4 w-4 mr-2" />
                                Run Benchmark
                            </>
                        )}
                    </Button>

                    {benchmark && (
                        <div className="mt-6 space-y-4">
                            {/* Grade */}
                            <div className="flex items-center gap-4">
                                <div className={`text-5xl font-black px-5 py-2 rounded-xl ${gradeColor(benchmark.grade)}`}>
                                    {benchmark.grade}
                                </div>
                                <div>
                                    <div className="text-xl font-bold text-maroon-800 dark:text-gray-200">
                                        {benchmark.total_ms} ms total
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                        {benchmark.timestamp}
                                    </div>
                                </div>
                            </div>

                            {/* Individual Results */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                {([
                                    { key: 'db_read_ms' as const, label: 'DB Read', icon: Database, desc: 'SELECT query' },
                                    { key: 'db_write_ms' as const, label: 'DB Write', icon: Database, desc: 'INSERT + DELETE' },
                                    { key: 'db_aggregate_ms' as const, label: 'DB Aggregate', icon: BarChart3, desc: 'GROUP BY query' },
                                    { key: 'cache_rw_ms' as const, label: 'Cache R/W', icon: Server, desc: 'Put + Get + Forget' },
                                    { key: 'filesystem_ms' as const, label: 'Filesystem', icon: HardDrive, desc: '100KB write + read' },
                                    { key: 'php_compute_ms' as const, label: 'PHP Compute', icon: Cpu, desc: '1M iterations' },
                                    { key: 'json_codec_ms' as const, label: 'JSON Codec', icon: Activity, desc: '1K objects encode/decode' },
                                ]).map(({ key, label, icon: Icon, desc }) => (
                                    <div key={key} className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Icon className="h-3.5 w-3.5 text-gray-500" />
                                            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{label}</span>
                                        </div>
                                        <div className="text-lg font-bold text-maroon-800 dark:text-gray-200">
                                            {benchmark[key]} ms
                                        </div>
                                        <div className="text-xs text-gray-400">{desc}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Benchmark History */}
                    {benchmarkHistory.length > 1 && (
                        <div className="mt-6">
                            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-3">Benchmark History</h4>
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="border-b dark:border-gray-700">
                                            <th className="text-left py-2 px-2 text-gray-500">Time</th>
                                            <th className="text-right py-2 px-2 text-gray-500">Total</th>
                                            <th className="text-right py-2 px-2 text-gray-500">DB Read</th>
                                            <th className="text-right py-2 px-2 text-gray-500">DB Write</th>
                                            <th className="text-right py-2 px-2 text-gray-500">Cache</th>
                                            <th className="text-right py-2 px-2 text-gray-500">FS</th>
                                            <th className="text-right py-2 px-2 text-gray-500">PHP</th>
                                            <th className="text-center py-2 px-2 text-gray-500">Grade</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {benchmarkHistory.map((b, i) => (
                                            <tr key={i} className="border-b dark:border-gray-700/50">
                                                <td className="py-1.5 px-2 text-gray-500">
                                                    {new Date(b.timestamp).toLocaleTimeString()}
                                                </td>
                                                <td className="py-1.5 px-2 text-right font-medium">{b.total_ms}</td>
                                                <td className="py-1.5 px-2 text-right">{b.db_read_ms}</td>
                                                <td className="py-1.5 px-2 text-right">{b.db_write_ms}</td>
                                                <td className="py-1.5 px-2 text-right">{b.cache_rw_ms}</td>
                                                <td className="py-1.5 px-2 text-right">{b.filesystem_ms}</td>
                                                <td className="py-1.5 px-2 text-right">{b.php_compute_ms}</td>
                                                <td className="py-1.5 px-2 text-center">
                                                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${gradeColor(b.grade)}`}>
                                                        {b.grade}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="mt-3">
                                <span className="text-xs text-gray-500">Total (ms) trend:</span>
                                <Sparkline
                                    data={benchmarkHistory.map(b => b.total_ms)}
                                    color="#991b1b"
                                    width={200}
                                    height={28}
                                />
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Latency History */}
            {metrics && history.length > 1 && (
                <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Clock className="h-5 w-5 text-maroon-600 dark:text-gray-400" />
                            Latency History
                        </CardTitle>
                        <CardDescription>
                            Trends from the last {history.length} snapshots (auto-refresh required for data collection)
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">DB Ping (ms)</div>
                                <Sparkline data={history.map(h => h.dbPingMs)} color="#0369a1" width={180} height={40} />
                                <div className="text-sm font-medium mt-1">
                                    Latest: {latencyBadge(history[history.length - 1].dbPingMs)}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">CPU (%)</div>
                                <Sparkline data={history.map(h => h.cpuPercent)} color="#b45309" width={180} height={40} />
                                <div className="text-sm font-medium mt-1">
                                    Latest: <span className={healthColor(history[history.length - 1].cpuPercent)}>
                                        {history[history.length - 1].cpuPercent}%
                                    </span>
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Memory (%)</div>
                                <Sparkline data={history.map(h => h.memoryPercent)} color="#991b1b" width={180} height={40} />
                                <div className="text-sm font-medium mt-1">
                                    Latest: <span className={healthColor(history[history.length - 1].memoryPercent)}>
                                        {history[history.length - 1].memoryPercent}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );

    // ─── Tab: Configuration ─────────────────────────────────────

    const ConfigTab = () => {
        if (!metrics) return null;
        const m = metrics;

        type StatusType = 'good' | 'warn' | 'bad';
        interface ConfigItem { label: string; value: string; status?: StatusType }
        interface ConfigSection { section: string; items: ConfigItem[] }

        const s = (condition: boolean, ifTrue: StatusType, ifFalse: StatusType): StatusType => condition ? ifTrue : ifFalse;

        const configItems: ConfigSection[] = [
            { section: 'PHP Runtime', items: [
                { label: 'PHP Version', value: m.server.php.version },
                { label: 'OS', value: m.server.php.os },
                { label: 'SAPI', value: m.server.php.sapi },
                { label: 'Memory Limit', value: m.server.php.memory_limit },
                { label: 'Max Execution Time', value: `${m.server.php.max_execution_time}s` },
                { label: 'Upload Max Filesize', value: m.server.php.upload_max_filesize },
                { label: 'Post Max Size', value: m.server.php.post_max_size },
                { label: 'OPcache', value: m.server.php.opcache_enabled ? 'Enabled' : 'Disabled',
                    status: s(m.server.php.opcache_enabled, 'good', 'warn') },
            ]},
            { section: 'Application', items: [
                { label: 'Environment', value: m.application.config.app_env,
                    status: s(m.application.config.app_env === 'production', 'good', 'warn') },
                { label: 'Debug Mode', value: m.application.config.debug_mode ? 'ON' : 'OFF',
                    status: s(m.application.config.debug_mode, 'bad', 'good') },
                { label: 'Log Channel', value: m.application.config.log_channel },
                { label: 'Server Uptime', value: m.server.uptime },
            ]},
            { section: 'Drivers', items: [
                { label: 'Cache Driver', value: m.application.cache.driver,
                    status: s(m.application.cache.driver === 'redis' || m.application.cache.driver === 'file', 'good', 'warn') },
                { label: 'Session Driver', value: m.application.cache.session,
                    status: s(m.application.cache.session === 'redis' || m.application.cache.session === 'file', 'good', 'warn') },
                { label: 'Queue Driver', value: m.application.cache.queue,
                    status: s(m.application.cache.queue === 'sync', 'warn', 'good') },
            ]},
        ];

        return (
            <div className="space-y-6">
                {configItems.map(section => (
                    <Card key={section.section} className="border-beige-200 dark:border-gray-700 shadow-lg">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">{section.section}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {section.items.map(item => (
                                    <div key={item.label} className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-gray-700/50 last:border-0">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">{item.label}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-maroon-800 dark:text-gray-200">{item.value}</span>
                                            {'status' in item && item.status && (
                                                item.status === 'good'
                                                    ? <CheckCircle className="h-4 w-4 text-green-500" />
                                                    : item.status === 'bad'
                                                        ? <XCircle className="h-4 w-4 text-red-500" />
                                                        : <AlertTriangle className="h-4 w-4 text-yellow-500" />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {/* Recommendations */}
                <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            Optimization Recommendations
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {m.application.cache.driver === 'database' && (
                                <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                                    <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                                    <div className="text-sm">
                                        <span className="font-medium text-yellow-800 dark:text-yellow-300">Cache driver is &quot;database&quot;</span>
                                        <p className="text-yellow-700 dark:text-yellow-400 mt-0.5">
                                            Every cache read/write hits MySQL. Consider switching to &quot;file&quot; or &quot;redis&quot; for better performance.
                                        </p>
                                    </div>
                                </div>
                            )}
                            {m.application.cache.session === 'database' && (
                                <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                                    <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                                    <div className="text-sm">
                                        <span className="font-medium text-yellow-800 dark:text-yellow-300">Session driver is &quot;database&quot;</span>
                                        <p className="text-yellow-700 dark:text-yellow-400 mt-0.5">
                                            Every page load queries the sessions table. Consider using &quot;file&quot; for less DB overhead.
                                        </p>
                                    </div>
                                </div>
                            )}
                            {m.application.cache.queue === 'sync' && (
                                <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                                    <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                                    <div className="text-sm">
                                        <span className="font-medium text-yellow-800 dark:text-yellow-300">Queue driver is &quot;sync&quot;</span>
                                        <p className="text-yellow-700 dark:text-yellow-400 mt-0.5">
                                            All queued jobs run synchronously, blocking HTTP responses. Consider &quot;database&quot; driver with a queue worker for background processing.
                                        </p>
                                    </div>
                                </div>
                            )}
                            {m.application.config.debug_mode && (
                                <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                    <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                                    <div className="text-sm">
                                        <span className="font-medium text-red-800 dark:text-red-300">Debug mode is ON</span>
                                        <p className="text-red-700 dark:text-red-400 mt-0.5">
                                            Disable APP_DEBUG in production. Exposes stack traces and significantly impacts performance.
                                        </p>
                                    </div>
                                </div>
                            )}
                            {!m.server.php.opcache_enabled && (
                                <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                                    <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                                    <div className="text-sm">
                                        <span className="font-medium text-yellow-800 dark:text-yellow-300">OPcache is disabled</span>
                                        <p className="text-yellow-700 dark:text-yellow-400 mt-0.5">
                                            Enable OPcache in php.ini for significant PHP execution speed improvement (2-5x).
                                        </p>
                                    </div>
                                </div>
                            )}
                            {m.database.query_stats.slow_queries > 10 && (
                                <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                    <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                                    <div className="text-sm">
                                        <span className="font-medium text-red-800 dark:text-red-300">{m.database.query_stats.slow_queries} slow queries detected</span>
                                        <p className="text-red-700 dark:text-red-400 mt-0.5">
                                            Enable the MySQL slow query log to identify and optimize problematic queries.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* If everything looks good */}
                            {m.application.cache.driver !== 'database' &&
                             m.application.cache.session !== 'database' &&
                             m.application.cache.queue !== 'sync' &&
                             !m.application.config.debug_mode &&
                             m.server.php.opcache_enabled &&
                             m.database.query_stats.slow_queries <= 10 && (
                                <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                    <div className="text-sm">
                                        <span className="font-medium text-green-800 dark:text-green-300">All systems optimized!</span>
                                        <p className="text-green-700 dark:text-green-400 mt-0.5">
                                            No critical optimization recommendations at this time.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    };

    // ─── Render ─────────────────────────────────────────────────

    if (loading) {
        return (
            <AdminBaseLayout title="System Monitor" user={user}>
                <div className="flex items-center justify-center h-64">
                    <RefreshCw className="h-8 w-8 animate-spin text-maroon-600" />
                </div>
            </AdminBaseLayout>
        );
    }

    if (!metrics) {
        return (
            <AdminBaseLayout title="System Monitor" user={user}>
                <div className="text-center py-12">
                    <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">Failed to load system metrics</p>
                    <Button onClick={fetchMetrics} className="mt-4 bg-maroon-700 hover:bg-maroon-800 text-white">
                        Retry
                    </Button>
                </div>
            </AdminBaseLayout>
        );
    }

    const tabs = [
        { id: 'overview' as const, label: 'Overview', icon: Gauge },
        { id: 'database' as const, label: 'Database & Storage', icon: Database },
        { id: 'performance' as const, label: 'Performance', icon: Zap },
        { id: 'config' as const, label: 'Configuration', icon: Settings2 },
    ];

    return (
        <AdminBaseLayout title="System Monitor" user={user}>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-maroon-800 dark:text-gray-200">System Monitor</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Resource monitoring, performance benchmarks &amp; configuration health
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                            Last updated: {lastUpdated.toLocaleTimeString()}
                            {autoRefresh && <span className="ml-2 text-green-600">● Live (30s)</span>}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={autoRefresh}
                                onChange={(e) => setAutoRefresh(e.target.checked)}
                                className="rounded border-maroon-300 dark:border-gray-600 text-maroon-600 focus:ring-maroon-200"
                            />
                            <span className="text-sm text-gray-600 dark:text-gray-300">Auto-refresh</span>
                        </label>
                        <Button
                            onClick={fetchMetrics}
                            variant="outline"
                            size="sm"
                            className="border-maroon-300 dark:border-gray-600 text-maroon-700 dark:text-gray-300 hover:bg-maroon-50 dark:hover:bg-gray-800"
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh
                        </Button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex flex-wrap gap-1 border-b border-gray-200 dark:border-gray-700">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        const active = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
                                    active
                                        ? 'border-maroon-600 text-maroon-700 dark:text-maroon-400 dark:border-maroon-400 bg-maroon-50/50 dark:bg-maroon-900/20'
                                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                                }`}
                            >
                                <Icon className="h-4 w-4" />
                                <span className="hidden sm:inline">{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Tab Content */}
                {activeTab === 'overview' && <OverviewTab />}
                {activeTab === 'database' && <DatabaseTab />}
                {activeTab === 'performance' && <PerformanceTab />}
                {activeTab === 'config' && <ConfigTab />}
            </div>
        </AdminBaseLayout>
    );
}
