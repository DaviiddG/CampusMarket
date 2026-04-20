import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6 text-center">
          <div className="bg-white/10 p-8 rounded-2xl backdrop-blur-md border border-white/20 max-w-md">
            <h1 className="text-white font-roboto font-bold text-xl mb-4">¡Ups! Algo salió mal.</h1>
            <p className="text-gray-400 font-roboto text-sm mb-6">
              Ha ocurrido un error inesperado. Estamos trabajando para solucionarlo.
            </p>
            <div className="bg-red-500/20 p-4 rounded-lg text-red-400 text-xs font-mono mb-6 text-left overflow-auto max-h-32">
              {this.state.error?.message}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="bg-white text-black px-6 py-2 rounded-full font-roboto font-bold text-sm hover:bg-gray-200 transition-colors"
            >
              Recargar Sitio
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
