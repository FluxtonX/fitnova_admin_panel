import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import styles from './ChartWidget.module.css';

const ChartWidget = ({ title, data, type = 'area', dataKey = 'value', xAxisKey = 'name', color = '#5e6ad2' }) => {
  return (
    <div className={`glass ${styles.container}`}>
      <div className={styles.header}>
        <h3>{title}</h3>
      </div>
      <div className={styles.chartContainer}>
        <ResponsiveContainer width="100%" height="100%">
          {type === 'area' ? (
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id={`color-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={color} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
              <XAxis dataKey={xAxisKey} axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-muted)' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-muted)' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--color-surface)', borderRadius: '8px', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-md)' }}
                itemStyle={{ color: 'var(--color-text-primary)' }}
              />
              <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={3} fillOpacity={1} fill={`url(#color-${dataKey})`} />
            </AreaChart>
          ) : (
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={30}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
              <XAxis dataKey={xAxisKey} axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-muted)' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-muted)' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--color-surface)', borderRadius: '8px', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-md)' }}
                cursor={{ fill: 'var(--color-field)' }}
              />
              <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ChartWidget;
