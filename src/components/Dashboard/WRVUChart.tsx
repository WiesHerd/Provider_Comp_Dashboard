'use client';

import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface WRVUChartProps {
  actualWRVUs: number[];
  targetWRVUs: number[];
  months: string[];
}

export default function WRVUChart({ actualWRVUs, targetWRVUs, months }: WRVUChartProps) {
  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        left: 0,
        right: 0
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: '#f3f4f6'
        }
      }
    },
    plugins: {
      legend: {
        position: 'top' as const,
        align: 'end' as const,
        labels: {
          boxWidth: 8,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      }
    }
  };

  const data = {
    labels: months,
    datasets: [
      {
        label: 'Actual wRVUs',
        data: actualWRVUs,
        borderColor: '#3b82f6',
        backgroundColor: '#3b82f6',
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6
      },
      {
        label: 'Target wRVUs',
        data: targetWRVUs,
        borderColor: '#e5e7eb',
        backgroundColor: '#e5e7eb',
        borderDash: [5, 5],
        tension: 0,
        pointRadius: 0,
        pointHoverRadius: 0
      }
    ]
  };

  return (
    <div style={{ width: '100%', height: '400px', marginLeft: '-8px', marginRight: '-8px' }}>
      <Line options={options} data={data} />
    </div>
  );
} 