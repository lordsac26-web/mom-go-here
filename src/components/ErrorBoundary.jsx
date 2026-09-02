import { Component } from "react";

/**
 * Top-level error boundary so unexpected render crashes never show a blank screen.
 * Renders a friendly recovery UI for senior users.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("App crashed:", error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-8 bg-background text-foreground">
        <div className="max-w-md text-center space-y-5">
          <div className="text-6xl">😔</div>
          <h1 className="text-3xl font-black text-primary">Something went wrong — tap to try again</h1>
          <p className="text-xl text-muted-foreground">
            Don't worry — your progress is safe.
          </p>
          <div className="flex flex-col gap-3 mt-6">
            <button
              onClick={this.handleReload}
              className="bg-primary text-primary-foreground text-xl font-black py-4 rounded-2xl active:scale-95 transition-transform shadow-lg"
            >
              🔄 Reload App
            </button>
            <button
              onClick={this.handleGoHome}
              className="bg-secondary text-foreground text-xl font-black py-4 rounded-2xl border-2 border-border active:scale-95 transition-transform"
            >
              🏠 Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }
}