import { Component, lazy, Suspense, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { ProfileProvider, useProfile } from './lib/profile';
import { useRoute } from './lib/router';
import { Layout } from './components/Layout';
import { Welcome } from './pages/Welcome';
import { Button } from './components/ui';

const pages: Record<string, ReturnType<typeof lazy>> = {
  '/': lazy(() => import('./pages/Dashboard')),
  '/plan': lazy(() => import('./pages/Plan')),
  '/guide': lazy(() => import('./pages/Guide')),
  '/speaking': lazy(() => import('./pages/Speaking')),
  '/writing': lazy(() => import('./pages/Writing')),
  '/reading': lazy(() => import('./pages/Reading')),
  '/listening': lazy(() => import('./pages/Listening')),
  '/mock': lazy(() => import('./pages/Mock')),
  '/vocabulary': lazy(() => import('./pages/Vocabulary')),
  '/grammar': lazy(() => import('./pages/Grammar')),
  '/tutor': lazy(() => import('./pages/Tutor')),
  '/interview': lazy(() => import('./pages/Interview')),
  '/progress': lazy(() => import('./pages/Progress')),
  '/settings': lazy(() => import('./pages/Settings')),
};
const Onboarding = lazy(() => import('./pages/Onboarding'));

function Router() {
  const { path } = useRoute();
  const { profile, loading } = useProfile();
  if (loading) return <Spinner />;
  if (!profile) return <Welcome />;
  if (!profile.onboarded) return <Suspense fallback={<Spinner />}><Onboarding /></Suspense>;
  const key = Object.keys(pages).filter((k) => k === '/' ? path === '/' : path.startsWith(k)).sort((a, b) => b.length - a.length)[0];
  const Page = pages[key] ?? pages['/'];
  return (
    <Layout>
      <ErrorBoundary key={key}>
        <Suspense fallback={<Spinner />}><Page /></Suspense>
      </ErrorBoundary>
    </Layout>
  );
}

export const Spinner = () => <div className="grid min-h-[50vh] place-items-center"><Loader2 className="size-8 animate-spin text-[var(--accent)]" /></div>;

class ErrorBoundary extends Component<{ children: ReactNode }, { error?: Error }> {
  state: { error?: Error } = {};
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="surface mx-auto max-w-lg rounded-2xl p-6 text-center">
        <h2 className="text-lg font-semibold">This section hit a problem</h2>
        <p className="text-muted mt-2 text-sm">{this.state.error.message}</p>
        <p className="text-muted mt-1 text-xs">Your data is safe. Other modules keep working.</p>
        <Button className="mt-4" onClick={() => this.setState({ error: undefined })}>Try again</Button>
      </div>
    );
  }
}

export function App() {
  return <ProfileProvider><Router /></ProfileProvider>;
}
