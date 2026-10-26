import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen w-full bg-slate-950 text-slate-100 p-6 font-sans">
          <div className="max-w-xl w-full bg-slate-900 border border-red-500/50 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-950/80 border border-red-500 flex items-center justify-center text-red-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-base font-bold text-red-400 font-mono tracking-wide">
                  CHYBA PŘI VYKRESLOVÁNÍ MISE
                </h1>
                <p className="text-xs text-slate-400">
                  Nastala neočekávaná chyba při zpracování dat mise.
                </p>
              </div>
            </div>

            <div className="bg-slate-950 rounded-lg p-3 border border-slate-800 text-[11px] font-mono text-red-300 max-h-48 overflow-auto whitespace-pre-wrap leading-relaxed">
              {this.state.error?.message || 'Neznámá chyba'}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={this.handleReset}
                className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-lg shadow-sky-600/30"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Obnovit výchozí misi</span>
              </button>

              <button
                onClick={() => window.location.reload()}
                className="text-xs text-slate-400 hover:text-white underline"
              >
                Znovu načíst stránku
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
