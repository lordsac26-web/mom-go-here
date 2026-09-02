import { Component } from "react";
import { RefreshCw } from "lucide-react";

export default class GameErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Game screen error:", error, errorInfo);
  }

  retry = () => this.setState({ hasError: false });

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex min-h-[70dvh] items-center justify-center px-6 text-center">
        <div className="max-w-md rounded-3xl border-2 border-primary bg-card p-7 shadow-xl">
          <p className="mb-3 text-5xl" aria-hidden="true">🎮</p>
          <h1 className="text-3xl font-black text-primary">Something went wrong</h1>
          <p className="mt-3 text-xl font-bold text-foreground">Your progress is safe. Tap below to try again.</p>
          <button onClick={this.retry} className="mt-6 inline-flex min-h-[56px] items-center justify-center gap-2 rounded-2xl bg-primary px-6 text-xl font-black text-primary-foreground">
            <RefreshCw size={24} /> Try Again
          </button>
        </div>
      </div>
    );
  }
}