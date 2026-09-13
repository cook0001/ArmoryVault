import {
  ArrowLeft,
  Blocks,
  BookOpen,
  Crosshair,
  Database,
  Download,
  FlaskConical,
  RotateCcw,
  ShieldCheck,
  Wrench,
} from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useModules } from '../modules/registry/ModuleContext';

interface ModulePromptViewProps {
  moduleId: string;
  featureName?: string;
}

export const ModulePromptView: React.FC<ModulePromptViewProps> = ({ moduleId, featureName }) => {
  const navigate = useNavigate();
  const { availableModules, installModule, archives, openModuleCenter } = useModules();

  const module = availableModules.find((m) => m.manifest.id === moduleId);
  const title = module?.manifest.name || featureName || 'Module Feature';
  const description =
    module?.manifest.description ||
    'This capability is part of an optional modular extension for ArmoryVault.';
  const archive = archives[moduleId];

  const getModuleIcon = () => {
    switch (moduleId) {
      case 'reloading':
        return <FlaskConical size={36} color="#c084fc" />;
      case 'maintenance':
        return <Wrench size={36} color="#fbbf24" />;
      case 'ballistics':
        return <Crosshair size={36} color="#34d399" />;
      case 'nfa':
        return <ShieldCheck size={36} color="#60a5fa" />;
      case 'boundbook':
        return <BookOpen size={36} color="#818cf8" />;
      default:
        return <Blocks size={36} color="var(--accent, #38bdf8)" />;
    }
  };

  const handleInstall = async () => {
    await installModule(moduleId, true);
  };

  return (
    <div
      style={{
        minHeight: '70vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: '560px',
          width: '100%',
          textAlign: 'center',
          padding: '2.5rem 2rem',
          backgroundColor: '#0f172a',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Module Icon Badge */}
        <div
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '18px',
            background: 'rgba(30, 41, 59, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.25rem',
          }}
        >
          {getModuleIcon()}
        </div>

        {/* Title & Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.2rem 0.6rem',
            borderRadius: '9999px',
            backgroundColor: 'rgba(56, 189, 248, 0.1)',
            color: '#38bdf8',
            fontSize: '0.75rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            marginBottom: '0.75rem',
          }}
        >
          <Blocks size={13} />
          <span>Module Required</span>
        </div>

        <h2
          style={{ fontSize: '1.5rem', fontWeight: 600, margin: '0 0 0.5rem 0', color: '#f8fafc' }}
        >
          {title}
        </h2>

        <p
          style={{
            fontSize: '0.925rem',
            color: '#94a3b8',
            lineHeight: 1.5,
            margin: '0 0 1.5rem 0',
            maxWidth: '440px',
          }}
        >
          {description}
        </p>

        {/* Archive Found Callout */}
        {archive && (
          <div
            style={{
              width: '100%',
              padding: '0.85rem 1rem',
              borderRadius: '8px',
              backgroundColor: 'rgba(251, 191, 36, 0.1)',
              border: '1px solid rgba(251, 191, 36, 0.25)',
              color: '#fef3c7',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              marginBottom: '1.5rem',
            }}
          >
            <Database size={16} color="#fbbf24" />
            <span>
              Encrypted archive detected ({archive.totalRecords || 0} records saved on{' '}
              {new Date(archive.archivedAt).toLocaleDateString()}). Installing will restore your
              data.
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div
          style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}
        >
          <button
            className="btn-primary"
            onClick={handleInstall}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 1.25rem',
              fontSize: '0.9rem',
              fontWeight: 600,
              backgroundColor: 'var(--accent, #0284c7)',
              color: '#ffffff',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {archive ? <RotateCcw size={16} /> : <Download size={16} />}
            {archive ? 'Install & Restore Data' : `Install ${title}`}
          </button>

          <button
            className="btn-secondary"
            onClick={() => openModuleCenter(moduleId)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 1.15rem',
              fontSize: '0.9rem',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            <Blocks size={16} />
            Module Center
          </button>

          <button
            className="btn-secondary"
            onClick={() => navigate('/')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 1rem',
              fontSize: '0.9rem',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            <ArrowLeft size={16} />
            Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
