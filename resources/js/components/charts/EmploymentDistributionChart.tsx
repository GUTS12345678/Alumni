import React from 'react';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid
} from 'recharts';

interface EmploymentData {
    status: string;
    count: number;
    percentage: number;
    [key: string]: string | number; // Add index signature to make it compatible with ChartDataInput
}

interface Props {
    data: EmploymentData[];
    height?: number;
    chartType?: 'pie' | 'bar';
}

const COLORS = ['#800000', '#B22222', '#D4AF37', '#DAA520', '#CD853F', '#8B4513', '#A0522D', '#F4A460'];

export default function EmploymentDistributionChart({ data, height = 350, chartType = 'pie' }: Props) {
    const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ value: number; payload: EmploymentData }> }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                    <p className="text-sm font-medium text-gray-900">{data.status}</p>
                    <p className="text-sm text-maroon-600">
                        Count: {data.count} ({data.percentage.toFixed(1)}%)
                    </p>
                </div>
            );
        }
        return null;
    };

    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center" style={{ height }}>
                <div className="text-center">
                    <div className="text-gray-400 mb-2">
                        <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                        </svg>
                    </div>
                    <p className="text-gray-600 text-sm">No employment data available</p>
                </div>
            </div>
        );
    }

    if (chartType === 'bar') {
        return (
            <ResponsiveContainer width="100%" height={height}>
                <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                        dataKey="status"
                        tick={{ fontSize: 11, fill: '#666' }}
                        axisLine={{ stroke: '#ddd' }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                    />
                    <YAxis
                        tick={{ fontSize: 12, fill: '#666' }}
                        axisLine={{ stroke: '#ddd' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                        dataKey="count"
                        fill="#800000"
                        radius={[4, 4, 0, 0]}
                    />
                </BarChart>
            </ResponsiveContainer>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={height}>
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={false}
                    outerRadius={Math.min(height * 0.35, 120)}
                    fill="#8884d8"
                    dataKey="count"
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value: string) => `${value}`}
                />
            </PieChart>
        </ResponsiveContainer>
    );
}