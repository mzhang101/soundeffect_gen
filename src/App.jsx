import { GenerationProvider } from './context/GenerationContext';
import Header from './components/Header';
import GenerationList from './components/GenerationList';

export default function App() {
  return (
    <GenerationProvider>
      <div className="min-h-screen bg-zinc-950">
        <Header />
        <main>
          <GenerationList />
        </main>
      </div>
    </GenerationProvider>
  );
}
