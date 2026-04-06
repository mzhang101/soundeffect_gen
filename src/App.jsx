import { ThemeProvider } from './context/ThemeContext';
import { GenerationProvider, useGeneration } from './context/GenerationContext';
import Header from './components/Header';
import GenerationList from './components/GenerationList';
import AuthGate from './components/AuthGate';

function AppContent() {
  const { isAuthenticated } = useGeneration();

  if (!isAuthenticated) {
    return <AuthGate />;
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Header />
      <main>
        <GenerationList />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <GenerationProvider>
        <AppContent />
      </GenerationProvider>
    </ThemeProvider>
  );
}
