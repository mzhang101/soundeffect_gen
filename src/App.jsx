import { GenerationProvider, useGeneration } from './context/GenerationContext';
import AuthGate from './components/AuthGate';
import Header from './components/Header';
import GenerationList from './components/GenerationList';

function AppContent() {
  const { isAuthenticated } = useGeneration();

  if (!isAuthenticated) {
    return <AuthGate />;
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <Header />
      <main>
        <GenerationList />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <GenerationProvider>
      <AppContent />
    </GenerationProvider>
  );
}
