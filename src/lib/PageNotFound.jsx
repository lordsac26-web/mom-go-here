import { Link } from 'react-router-dom';

export default function PageNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-7xl font-light text-muted-foreground/40">404</h1>
          <div className="h-0.5 w-16 bg-border mx-auto"></div>
        </div>

        <div className="space-y-3">
          <h2 className="text-2xl font-black text-foreground">
            Page Not Found
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            This page doesn't exist. Let's get you back home!
          </p>
        </div>

        <div className="pt-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 text-lg font-black bg-primary text-primary-foreground rounded-2xl hover:brightness-110 transition-all active:scale-95"
          >
            🏠 Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}