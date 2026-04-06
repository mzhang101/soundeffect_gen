import { ThemeProvider } from './context/ThemeContext';
import { GenerationProvider } from './context/GenerationContext';
import Header from './components/Header';
import GenerationList from './components/GenerationList';

export default function App() {
  return (
    <ThemeProvider>
      <GenerationProvider>
        <div className="min-h-screen bg-[var(--bg-primary)]">
          <Header />
          <main>
            <GenerationList />
          </main>
        </div>
      </GenerationProvider>
    </ThemeProvider>
  );
}
