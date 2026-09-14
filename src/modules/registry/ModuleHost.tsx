import * as LucideIcons from 'lucide-react';
import {
  AlertTriangle,
  ArrowLeft,
  Blocks,
  DownloadCloud,
  Loader2,
  RefreshCw,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import React, { Component, ErrorInfo, ReactNode, Suspense, useEffect, useState } from 'react';
import * as ReactJSXRuntime from 'react/jsx-runtime';
import * as ReactDOM from 'react-dom';
import * as ReactRouterDOM from 'react-router-dom';
import { useNavigate, useParams } from 'react-router-dom';
import * as CustomIcons from '../../components/CustomIcons';
import { useModules } from './ModuleContext';
import { AVAILABLE_MODULES } from './ModuleRegistry';

interface ModuleErrorBoundaryProps {
  moduleId: string;
  moduleName?: string;
  onRetry: () => void;
  children: ReactNode;
}

interface ModuleErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ModuleErrorBoundary extends Component<
  ModuleErrorBoundaryProps,
  ModuleErrorBoundaryState
> {
  constructor(props: ModuleErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): ModuleErrorBoundaryState {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });
    console.error(`[ModuleHost] Error in module "${this.props.moduleId}":`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', maxWidth: '900px', margin: '2rem auto' }}>
          <div
            className="tactical-card"
            style={{
              background: 'var(--card-bg)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '16px',
              padding: '2rem',
            }}
          >
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}
            >
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '10px',
                  padding: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ShieldAlert size={26} color="var(--danger)" />
              </div>
              <div>
                <h2 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '1.25rem' }}>
                  Module Runtime Exception
                </h2>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '2px' }}>
                  Module: <strong>{this.props.moduleName || this.props.moduleId}</strong> (
                  {this.props.moduleId})
                </div>
              </div>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
              An isolated error occurred inside this modular extension. The core vault application
              and your firearm inventory remain completely secure and unaffected.
            </p>

            <div
              style={{
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid var(--border-light)',
                borderRadius: '8px',
                padding: '1rem',
                margin: '1.25rem 0',
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                color: '#f87171',
                overflowX: 'auto',
                maxHeight: '200px',
              }}
            >
              {this.state.error?.toString()}
              {this.state.errorInfo?.componentStack && (
                <pre
                  style={{ marginTop: '0.5rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}
                >
                  {this.state.errorInfo.componentStack}
                </pre>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                className="btn-primary"
                onClick={() => {
                  this.setState({ hasError: false, error: null, errorInfo: null });
                  this.props.onRetry();
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <RefreshCw size={15} />
                <span>Reload Module</span>
              </button>
              <button
                className="btn-secondary"
                onClick={() => {
                  window.dispatchEvent(
                    new CustomEvent('armoryvault-open-module-center', {
                      detail: { moduleId: this.props.moduleId },
                    })
                  );
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Blocks size={15} />
                <span>Open in Module Center</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

interface ModuleHostProps {
  moduleId?: string;
  featureName?: string;
}

export const ModuleHost: React.FC<ModuleHostProps> = ({
  moduleId: propModuleId,
  featureName: propFeatureName,
}) => {
  const params = useParams<{ moduleId: string }>();
  const navigate = useNavigate();
  const { isInstalled, availableModules, openModuleCenter } = useModules();

  const targetModuleId = propModuleId || params.moduleId || '';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [DynamicComponent, setDynamicComponent] = useState<React.ComponentType<any> | null>(null);
  const [moduleManifest, setModuleManifest] = useState<any>(null);
  const [retryNonce, setRetryNonce] = useState(0);

  // Setup global module runtime environment once
  useEffect(() => {
    const w = window as any;
    w.React = React;
    w.ReactDOM = ReactDOM;
    w.ReactJSXRuntime = ReactJSXRuntime;
    w.LucideIcons = LucideIcons;
    w.CustomIcons = CustomIcons;
    w.ReactRouterDOM = ReactRouterDOM;
    w.ArmoryVaultModules = w.ArmoryVaultModules || {};
  }, []);

  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setError(null);
    setDynamicComponent(null);

    async function loadModule() {
      if (!targetModuleId) {
        setError('No module ID specified');
        setLoading(false);
        return;
      }

      // Check if built-in fallback module exists
      const builtIn = AVAILABLE_MODULES.find((m) => m.manifest.id === targetModuleId);
      if (builtIn) {
        setModuleManifest(builtIn.manifest);
      }

      // 1. Check if module is installed on disk via electron IPC
      if (window.api && window.api.getModuleBundle) {
        try {
          const res = await window.api.getModuleBundle(targetModuleId);
          if (res && res.success && res.hasBundle && res.jsCode) {
            if (isCancelled) return;
            setModuleManifest(res.manifest);

            // Mount CSS if provided
            if (res.cssCode) {
              const styleId = `module-style-${targetModuleId}`;
              let styleTag = document.getElementById(styleId);
              if (!styleTag) {
                styleTag = document.createElement('style');
                styleTag.id = styleId;
                document.head.appendChild(styleTag);
              }
              styleTag.textContent = res.cssCode;
            }

            // Execute compiled bundle
            try {
              const globalVarName = `ArmoryModule_${targetModuleId.replace(/-/g, '_')}`;
              // Evaluate bundle in current window scope
              const scriptFn = new Function(res.jsCode);
              scriptFn.call(window);

              const modExport =
                (window as any)[globalVarName] ||
                (window as any).ArmoryVaultModules?.[targetModuleId];

              let comp: any = null;
              if (modExport) {
                if (typeof modExport === 'function') {
                  comp = modExport;
                } else if (modExport.default) {
                  if (typeof modExport.default === 'function') {
                    comp = modExport.default;
                  } else if (modExport.default.routes && modExport.default.routes[0]?.element) {
                    comp = modExport.default.routes[0].element;
                  }
                }
                if (!comp) {
                  // Check named component exports
                  for (const key of Object.keys(modExport)) {
                    if (typeof modExport[key] === 'function' && key !== 'default') {
                      comp = modExport[key];
                      break;
                    }
                  }
                }
              }

              if (comp) {
                setDynamicComponent(() => comp);
                setLoading(false);
                return;
              }
            } catch (evalErr: any) {
              console.warn(
                `[ModuleHost] Failed to execute dynamic bundle for ${targetModuleId}:`,
                evalErr
              );
            }
          }
        } catch (e: any) {
          console.warn(`[ModuleHost] Error loading bundle for ${targetModuleId}:`, e);
        }
      }

      // 2. Fallback to built-in module route if bundle execution wasn't needed or available
      if (builtIn && builtIn.routes && builtIn.routes.length > 0) {
        const PrimaryComponent = builtIn.routes[0].element;
        setDynamicComponent(() => PrimaryComponent);
        setLoading(false);
        return;
      }

      if (!isCancelled) {
        setError(
          `Unable to load module "${targetModuleId}". Verify that it is installed in the Module Center.`
        );
        setLoading(false);
      }
    }

    loadModule();

    return () => {
      isCancelled = true;
      // Clean up injected module stylesheet on unmount
      const styleTag = document.getElementById(`module-style-${targetModuleId}`);
      if (styleTag) {
        styleTag.remove();
      }
    };
  }, [targetModuleId, retryNonce]);

  const moduleName = propFeatureName || moduleManifest?.name || targetModuleId;

  // Not installed banner
  if (!isInstalled(targetModuleId) && !loading) {
    return (
      <div style={{ padding: '2.5rem', maxWidth: '750px', margin: '3rem auto' }}>
        <div
          className="tactical-card"
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--border-light)',
            borderRadius: '16px',
            padding: '2.5rem',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              background: 'rgba(52, 211, 153, 0.1)',
              border: '1px solid rgba(52, 211, 153, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem auto',
            }}
          >
            <Blocks size={28} color="var(--accent)" />
          </div>
          <h2 style={{ color: 'var(--text-primary)', margin: '0 0 0.5rem 0', fontSize: '1.4rem' }}>
            {moduleName} Not Installed
          </h2>
          <p
            style={{
              color: 'var(--text-muted)',
              fontSize: '0.9rem',
              maxWidth: '500px',
              margin: '0 auto 1.5rem auto',
            }}
          >
            This modular feature is not currently enabled or downloaded. Install it from the
            official ArmoryVault Module Center to access it.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
            <button
              className="btn-primary"
              onClick={() => openModuleCenter(targetModuleId)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <DownloadCloud size={16} />
              <span>Install in Module Center</span>
            </button>
            <button
              className="btn-secondary"
              onClick={() => navigate('/')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <ArrowLeft size={16} />
              <span>Back to Dashboard</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div
        style={{
          height: '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          color: 'var(--text-muted)',
        }}
      >
        <Loader2 size={32} color="var(--accent)" className="animate-spin" />
        <div style={{ fontSize: '0.9rem', letterSpacing: '0.5px' }}>
          Loading module: <strong>{moduleName}</strong>...
        </div>
      </div>
    );
  }

  if (error || !DynamicComponent) {
    return (
      <div style={{ padding: '2.5rem', maxWidth: '750px', margin: '3rem auto' }}>
        <div
          className="tactical-card"
          style={{
            background: 'var(--card-bg)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '16px',
            padding: '2rem',
            textAlign: 'center',
          }}
        >
          <AlertTriangle size={36} color="var(--danger)" style={{ margin: '0 auto 1rem auto' }} />
          <h2 style={{ color: 'var(--text-primary)', margin: '0 0 0.5rem 0', fontSize: '1.25rem' }}>
            Module Load Failure
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '0 0 1.5rem 0' }}>
            {error || 'The component could not be resolved from the module distribution package.'}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
            <button className="btn-primary" onClick={() => setRetryNonce((n) => n + 1)}>
              Retry
            </button>
            <button className="btn-secondary" onClick={() => openModuleCenter(targetModuleId)}>
              Module Center
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ModuleErrorBoundary
      moduleId={targetModuleId}
      moduleName={moduleName}
      onRetry={() => setRetryNonce((n) => n + 1)}
    >
      <Suspense
        fallback={
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Loader2
              size={24}
              color="var(--accent)"
              className="animate-spin"
              style={{ margin: '0 auto 0.5rem auto' }}
            />
            <div>Initializing {moduleName}...</div>
          </div>
        }
      >
        <DynamicComponent />
      </Suspense>
    </ModuleErrorBoundary>
  );
};

export default ModuleHost;
