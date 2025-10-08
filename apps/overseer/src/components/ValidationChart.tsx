import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

export interface ChartDataPoint {
  timestamp: string;
  success_rate: number;
  total_validations: number;
  response_time_ms: number;
}

export interface EyePerformanceData {
  eye: string;
  approvals: number;
  rejections: number;
  avg_response_ms: number;
}

export interface ValidationChartProps {
  data: ChartDataPoint[];
  type: 'success_rate' | 'response_time' | 'volume';
  height?: number;
  isLoading?: boolean;
}

export interface EyePerformanceChartProps {
  data: EyePerformanceData[];
  height?: number;
  isLoading?: boolean;
}

export interface StatusDistributionProps {
  data: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  height?: number;
  isLoading?: boolean;
}

const COLORS = {
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  primary: '#F7B500',
  secondary: '#818CF8'
};

function ChartSkeleton({ height = 200 }: { height?: number }) {
  return (
    <div className="animate-pulse" style={{ height }}>
      <div className="h-4 bg-slate-600/40 rounded w-1/4 mb-4" />
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-end gap-2">
            <div
              className="bg-slate-600/40 rounded"
              style={{
                height: Math.random() * 40 + 20,
                width: '100%'
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{
    color: string;
    name: string;
    value: string | number;
    dataKey: string;
  }>;
  label?: string;
}) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-lg">
        <p className="text-slate-300 text-sm mb-1">
          {label ? format(new Date(label), 'MMM dd, HH:mm') : 'No date'}
        </p>
        {payload.map((item, index: number) => (
          <p key={index} className="text-white text-sm">
            <span style={{ color: item.color }}>●</span>
            {` ${item.name}: ${typeof item.value === 'number' ? item.value.toLocaleString() : item.value}`}
            {item.dataKey === 'success_rate' && '%'}
            {item.dataKey === 'response_time_ms' && 'ms'}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

export function ValidationChart({ data, type, height = 200, isLoading }: ValidationChartProps) {
  if (isLoading || !data || data.length === 0) {
    return <ChartSkeleton height={height} />;
  }

  const getDataKey = () => {
    switch (type) {
      case 'success_rate':
        return 'success_rate';
      case 'response_time':
        return 'response_time_ms';
      case 'volume':
        return 'total_validations';
      default:
        return 'success_rate';
    }
  };

  const getColor = () => {
    switch (type) {
      case 'success_rate':
        return COLORS.success;
      case 'response_time':
        return COLORS.warning;
      case 'volume':
        return COLORS.primary;
      default:
        return COLORS.primary;
    }
  };

  const getYAxisProps = () => {
    if (type === 'success_rate') {
      return { domain: [0, 100] };
    }
    return {};
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis
            dataKey="timestamp"
            stroke="#9CA3AF"
            fontSize={12}
            tickFormatter={(value) => format(new Date(value), 'HH:mm')}
          />
          <YAxis stroke="#9CA3AF" fontSize={12} {...getYAxisProps()} />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey={getDataKey()}
            stroke={getColor()}
            strokeWidth={2}
            dot={{ fill: getColor(), r: 4 }}
            activeDot={{ r: 6, stroke: getColor(), strokeWidth: 2 }}
            animationDuration={1000}
          />
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

export function EyePerformanceChart({ data, height = 300, isLoading }: EyePerformanceChartProps) {
  if (isLoading || !data || data.length === 0) {
    return <ChartSkeleton height={height} />;
  }

  // Transform data for chart
  const chartData = data.map(item => ({
    name: item.eye.replace(/^[A-Z_]+_/, '').toLowerCase(),
    approvals: item.approvals,
    rejections: item.rejections,
    total: item.approvals + item.rejections,
    success_rate: item.approvals + item.rejections > 0
      ? ((item.approvals / (item.approvals + item.rejections)) * 100).toFixed(1)
      : 0
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis
            dataKey="name"
            stroke="#9CA3AF"
            fontSize={12}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis stroke="#9CA3AF" fontSize={12} />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-lg">
                    <p className="text-white font-medium mb-2">{label}</p>
                    <p className="text-green-400 text-sm">
                      ✅ Approvals: {data.approvals}
                    </p>
                    <p className="text-red-400 text-sm">
                      ❌ Rejections: {data.rejections}
                    </p>
                    <p className="text-blue-400 text-sm">
                      📊 Success Rate: {data.success_rate}%
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="approvals" fill={COLORS.success} />
          <Bar dataKey="rejections" fill={COLORS.error} />
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

export function StatusDistributionChart({ data, height = 250, isLoading }: StatusDistributionProps) {
  if (isLoading || !data || data.length === 0) {
    return <ChartSkeleton height={height} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={80}
            dataKey="value"
            animationDuration={1000}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0];
                return (
                  <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-lg">
                    <p className="text-white font-medium">
                      {data.name}: {data.value}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

export default ValidationChart;