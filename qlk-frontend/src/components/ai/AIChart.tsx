import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  ArcElement,
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import type { AIChartData } from '../../api/ai';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface AIChartProps {
  config: AIChartData;
}

const AIChart: React.FC<AIChartProps> = ({ config }) => {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: 'rgba(255, 255, 255, 0.8)',
          font: { size: 12 }
        }
      },
      title: {
        display: !!config.title,
        text: config.title,
        color: '#fff',
        font: { size: 16, weight: 'bold' as 'bold' }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
      }
    },
    scales: config.type !== 'pie' ? {
      y: {
        ticks: { color: 'rgba(255, 255, 255, 0.6)' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      },
      x: {
        ticks: { color: 'rgba(255, 255, 255, 0.6)' },
        grid: { display: false }
      }
    } : {}
  };

  const defaultColors = [
    'rgba(54, 162, 235, 0.7)',
    'rgba(255, 99, 132, 0.7)',
    'rgba(75, 192, 192, 0.7)',
    'rgba(255, 206, 86, 0.7)',
    'rgba(153, 102, 255, 0.7)',
    'rgba(255, 159, 64, 0.7)',
  ];

  const data = {
    labels: config.labels,
    datasets: config.datasets.map((ds, idx) => ({
      ...ds,
      backgroundColor: ds.backgroundColor || (config.type === 'pie' ? defaultColors : defaultColors[idx % defaultColors.length]),
      borderColor: '#fff',
      borderWidth: 1,
    }))
  };

  return (
    <div className="w-full h-64 bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10 mt-2">
      {config.type === 'bar' && <Bar options={options} data={data} />}
      {config.type === 'pie' && <Pie options={options} data={data} />}
      {config.type === 'line' && <Line options={options} data={data} />}
    </div>
  );
};

export default AIChart;
