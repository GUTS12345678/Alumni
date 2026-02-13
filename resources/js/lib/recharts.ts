/**
 * Lazy-loaded recharts barrel export.
 *
 * Instead of importing from 'recharts' directly (which pulls the full
 * 310 KB library into every page bundle), import from this file:
 *
 *   const Recharts = React.lazy(() => import('@/lib/recharts'));
 *
 * Or use the individual named exports after a dynamic import():
 *
 *   const { BarChart, Bar, ... } = await import('@/lib/recharts');
 */
export {
    LineChart,
    Line,
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart,
    Pie,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell,
} from 'recharts';
