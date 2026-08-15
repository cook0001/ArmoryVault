import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Firearm } from '../types';
import { Wrench, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

export const MaintenanceDashboard = () => {
  const [firearms, setFirearms] = useState<Firearm[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadFirearms();
  }, []);

  const loadFirearms = async () => {
    if (window.api) {
      const data = await window.api.getFirearms();
      setFirearms(data.filter((f: Firearm) => !f.is_sold));
    }
  };

  const getRoundsSinceCleaning = (f: Firearm) => {
    if (!f.logs) return 0;
    let totalRounds = 0;
    const sortedLogs = [...f.logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    for (const log of sortedLogs) {
      if (log.type === 'Cleaning') {
        break;
      }
      if (log.type === 'Range') {
        totalRounds += (log.rounds_fired || 0);
      }
    }
    return totalRounds;
  };

  const getDaysSinceCleaning = (f: Firearm) => {
    if (!f.logs) return -1;
    const cleanings = f.logs.filter(l => l.type === 'Cleaning').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (cleanings.length === 0) return -1;
    const lastCleaning = new Date(cleanings[0].date);
    return Math.floor((new Date().getTime() - lastCleaning.getTime()) / (1000 * 3600 * 24));
  };

  const maintenanceData = firearms.map(f => {
    const roundsSince = getRoundsSinceCleaning(f);
    const daysSince = getDaysSinceCleaning(f);
    
    let isRoundDue = false;
    if (f.maintenance_round_threshold && roundsSince >= f.maintenance_round_threshold) {
      isRoundDue = true;
    }
    
    let isDateDue = false;
    if (f.maintenance_date_threshold_days && daysSince >= f.maintenance_date_threshold_days) {
      isDateDue = true;
    }

    return {
      firearm: f,
      roundsSince,
      daysSince,
      isRoundDue,
      isDateDue,
      isDue: isRoundDue || isDateDue,
      roundProgress: f.maintenance_round_threshold ? Math.min(100, (roundsSince / f.maintenance_round_threshold) * 100) : 0,
      daysProgress: f.maintenance_date_threshold_days && daysSince !== -1 ? Math.min(100, (daysSince / f.maintenance_date_threshold_days) * 100) : 0,
    };
  });

  const dueForMaintenance = maintenanceData.filter(d => d.isDue);
  const others = maintenanceData.filter(d => !d.isDue && (d.firearm.maintenance_round_threshold || d.firearm.maintenance_date_threshold_days));

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Wrench size={28} /> Maintenance Dashboard
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>Track service intervals and scheduled cleanings.</p>
      </div>

      {dueForMaintenance.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--warning)', marginBottom: '1rem' }}>
            <AlertTriangle size={24} /> Service Due ({dueForMaintenance.length})
          </h2>
          <div className="grid">
            {dueForMaintenance.map((data, i) => (
              <div 
                key={data.firearm.id} 
                className="card clickable-row"
                style={{ border: '1px solid rgba(245, 158, 11, 0.5)', background: 'rgba(245, 158, 11, 0.05)', cursor: 'pointer', animationDelay: `${i * 0.1}s` }}
                onClick={() => navigate(`/details/${data.firearm.id}`)}
              >
                <h3 style={{ margin: '0 0 0.5rem 0' }}>{data.firearm.make} {data.firearm.model}</h3>
                
                {data.isRoundDue && (
                  <div style={{ marginBottom: '0.5rem', color: 'var(--warning)', fontSize: '0.9rem' }}>
                    <strong>Round Count Exceeded:</strong> {data.roundsSince} / {data.firearm.maintenance_round_threshold} rounds fired since last cleaning.
                  </div>
                )}
                
                {data.isDateDue && (
                  <div style={{ marginBottom: '0.5rem', color: 'var(--warning)', fontSize: '0.9rem' }}>
                    <strong>Time Exceeded:</strong> {data.daysSince} / {data.firearm.maintenance_date_threshold_days} days since last cleaning.
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Clock size={24} /> Tracking Service Intervals
        </h2>
        
        {others.length === 0 && dueForMaintenance.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <CheckCircle size={48} color="var(--text-secondary)" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <h3 style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>No Maintenance Alerts Configured</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Edit a firearm and set its Maintenance Alerts to track scheduled service here.</p>
          </div>
        ) : (
          <div className="grid">
            {others.map((data, i) => (
              <div 
                key={data.firearm.id} 
                className="card clickable-row"
                style={{ cursor: 'pointer', animationDelay: `${i * 0.1}s` }}
                onClick={() => navigate(`/details/${data.firearm.id}`)}
              >
                <h3 style={{ margin: '0 0 1rem 0' }}>{data.firearm.make} {data.firearm.model}</h3>
                
                {data.firearm.maintenance_round_threshold && (
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.2rem', color: 'var(--text-secondary)' }}>
                      <span>Rounds: {data.roundsSince} / {data.firearm.maintenance_round_threshold}</span>
                      <span>{Math.round(data.roundProgress)}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${data.roundProgress}%`, background: 'var(--accent)' }}></div>
                    </div>
                  </div>
                )}
                
                {data.firearm.maintenance_date_threshold_days && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.2rem', color: 'var(--text-secondary)' }}>
                      <span>Days: {data.daysSince === -1 ? 'Never' : data.daysSince} / {data.firearm.maintenance_date_threshold_days}</span>
                      <span>{Math.round(data.daysProgress)}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${data.daysProgress}%`, background: 'var(--accent)' }}></div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
