'use client'

// components/charts/ChartSales.js
'use client';
import { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

// Регистрация компонентов Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function ChartSales({ data, type = 'line', period = 'week' }) {
  const chartRef = useRef(null);

  // Группировка данных по датам
  const processData = () => {
    if (!data || data.length === 0) {
      return getEmptyData();
    }

    const groupedData = {};
    const today = new Date();
    let days = period === 'week' ? 7 : period === 'month' ? 30 : 90;

    // Инициализируем все дни
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('ru-RU', { 
        day: '2-digit', 
        month: '2-digit' 
      });
      groupedData[dateStr] = {
        sales: 0,
        revenue: 0,
        orders: 0
      };
    }

    // Заполняем данными
    data.forEach(order => {
      if (order.createdAt) {
        const orderDate = new Date(order.createdAt);
        const dateStr = orderDate.toLocaleDateString('ru-RU', { 
          day: '2-digit', 
          month: '2-digit' 
        });
        
        if (groupedData[dateStr]) {
          groupedData[dateStr].sales += order.items?.length || 0;
          groupedData[dateStr].revenue += order.subtotal || 0;
          groupedData[dateStr].orders += 1;
        }
      }
    });

    return {
      labels: Object.keys(groupedData),
      sales: Object.values(groupedData).map(d => d.sales),
      revenue: Object.values(groupedData).map(d => d.revenue),
      orders: Object.values(groupedData).map(d => d.orders)
    };
  };

  const getEmptyData = () => {
    const labels = [];
    const today = new Date();
    const days = period === 'week' ? 7 : period === 'month' ? 30 : 90;

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      labels.push(date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }));
    }

    return {
      labels,
      sales: Array(days).fill(0),
      revenue: Array(days).fill(0),
      orders: Array(days).fill(0)
    };
  };

  const processedData = processData();

  // Данные для графика продаж
  const salesChartData = {
    labels: processedData.labels,
    datasets: [
      {
        label: 'Продажи (шт)',
        data: processedData.sales,
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: 'rgb(34, 197, 94)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ]
  };

  // Данные для графика выручки
  const revenueChartData = {
    labels: processedData.labels,
    datasets: [
      {
        label: 'Выручка (тенге)',
        data: processedData.revenue,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ]
  };

  // Данные для графика заказов (столбцы)
  const ordersChartData = {
    labels: processedData.labels,
    datasets: [
      {
        label: 'Количество заказов',
        data: processedData.orders,
        backgroundColor: 'rgba(34, 197, 94, 0.7)',
        borderRadius: 6,
        barPercentage: 0.6
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          usePointStyle: true,
          boxWidth: 6
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.dataset.label === 'Выручка (тенге)') {
              label += context.parsed.y.toLocaleString() + ' тенге';
            } else {
              label += context.parsed.y;
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  const barOptions = {
    ...options,
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          stepSize: 1
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Выбор периода (управление снаружи) */}
      
      {/* График выручки */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Динамика выручки</h3>
        <div className="h-64">
          <Line ref={chartRef} data={revenueChartData} options={options} />
        </div>
      </div>

      {/* График продаж */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Динамика продаж</h3>
        <div className="h-64">
          <Line data={salesChartData} options={options} />
        </div>
      </div>

      {/* График заказов */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Количество заказов</h3>
        <div className="h-64">
          <Bar data={ordersChartData} options={barOptions} />
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-green-600 mb-1">Всего продаж</p>
          <p className="text-2xl font-bold text-green-700">
            {processedData.sales.reduce((a, b) => a + b, 0)}
          </p>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-600 mb-1">Общая выручка</p>
          <p className="text-2xl font-bold text-blue-700">
            {processedData.revenue.reduce((a, b) => a + b, 0).toLocaleString()} тенге
          </p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <p className="text-sm text-purple-600 mb-1">Средний чек</p>
          <p className="text-2xl font-bold text-purple-700">
            {processedData.orders.reduce((a, b) => a + b, 0) > 0
              ? Math.round(
                  processedData.revenue.reduce((a, b) => a + b, 0) /
                  processedData.orders.reduce((a, b) => a + b, 0)
                ).toLocaleString()
              : 0} тенге
          </p>
        </div>
      </div>

      {/* Таблица с данными */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b">
          <h3 className="font-semibold">Детализация по дням</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Дата</th>
                <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">Продажи</th>
                <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">Заказы</th>
                <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">Выручка</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {processedData.labels.map((label, index) => (
                <tr key={label} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm">{label}</td>
                  <td className="px-4 py-2 text-sm text-right">{processedData.sales[index]}</td>
                  <td className="px-4 py-2 text-sm text-right">{processedData.orders[index]}</td>
                  <td className="px-4 py-2 text-sm text-right font-medium">
                    {processedData.revenue[index].toLocaleString()} тенге
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 font-medium">
              <tr>
                <td className="px-4 py-2 text-sm">Итого:</td>
                <td className="px-4 py-2 text-sm text-right">
                  {processedData.sales.reduce((a, b) => a + b, 0)}
                </td>
                <td className="px-4 py-2 text-sm text-right">
                  {processedData.orders.reduce((a, b) => a + b, 0)}
                </td>
                <td className="px-4 py-2 text-sm text-right">
                  {processedData.revenue.reduce((a, b) => a + b, 0).toLocaleString()} тенге
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

// Компонент для маленького графика (в карточке)
export function MiniChart({ data, color = 'green' }) {
  const colors = {
    green: 'rgb(34, 197, 94)',
    blue: 'rgb(59, 130, 246)',
    red: 'rgb(239, 68, 68)',
    yellow: 'rgb(234, 179, 8)'
  };

  const chartData = {
    labels: data.map((_, i) => i),
    datasets: [
      {
        data: data,
        borderColor: colors[color] || colors.green,
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.4,
        fill: false
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false }
    },
    scales: {
      x: { display: false },
      y: { display: false }
    },
    elements: {
      line: {
        borderWidth: 2
      }
    }
  };

  return (
    <div className="h-16 w-full">
      <Line data={chartData} options={options} />
    </div>
  );
}

// Компонент для круговой диаграммы категорий
export function CategoryPieChart({ data }) {
  // Группировка по категориям
  const categories = {};
  data.forEach(item => {
    const category = item.category || 'Другое';
    if (!categories[category]) {
      categories[category] = {
        count: 0,
        revenue: 0
      };
    }
    categories[category].count += 1;
    categories[category].revenue += item.price * (item.salesCount || 0);
  });

  const chartData = {
    labels: Object.keys(categories),
    datasets: [
      {
        data: Object.values(categories).map(c => c.revenue),
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(234, 179, 8, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(236, 72, 153, 0.8)',
          'rgba(249, 115, 22, 0.8)'
        ],
        borderWidth: 0
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          boxWidth: 12,
          padding: 15
        }
      }
    }
  };

  return (
    <div className="h-64">
      <Doughnut data={chartData} options={options} />
    </div>
  );
}