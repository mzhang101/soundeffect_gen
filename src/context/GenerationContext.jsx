import { createContext, useContext, useReducer, useEffect, useCallback, useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { translateText } from '../services/api';
import { generateAudio } from '../services/elevenlabs';
import { getLocale, setLocale as setI18nLocale, t, toggleLocale as toggleI18nLocale } from '../services/i18n';

const GenerationContext = createContext(null);

const initialState = {
  isAuthenticated: false,
  generationBars: [],
  isRunningAll: false,
  runAllIndex: -1,
};

function reducer(state, action) {
  switch (action.type) {
    case 'LOGIN':
      return { ...state, isAuthenticated: true };
    case 'LOGOUT':
      return { ...state, isAuthenticated: false };
    case 'ADD_BAR':
      return { ...state, generationBars: [...state.generationBars, action.payload] };
    case 'REMOVE_BAR':
      return { ...state, generationBars: state.generationBars.filter(b => b.id !== action.payload) };
    case 'UPDATE_BAR':
      return {
        ...state,
        generationBars: state.generationBars.map(b =>
          b.id === action.id ? { ...b, ...action.payload } : b
        ),
      };
    case 'IMPORT_CSV':
      return { ...state, generationBars: [...state.generationBars, ...action.payload] };
    case 'SET_RUNNING_ALL':
      return { ...state, isRunningAll: action.payload };
    case 'SET_RUN_ALL_INDEX':
      return { ...state, runAllIndex: action.payload };
    case 'CLEAR_ALL':
      return { ...state, generationBars: [] };
    case 'LOAD_STATE':
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

function createEmptyBar() {
  return {
    id: crypto.randomUUID(),
    title: '',
    model: 'eleven_text_to_sound_v2',
    promptInfluence: 0.3,
    duration: 5.0,
    loop: false,
    promptChinese: '',
    status: 'idle',
    audioUrl: null,
    audioName: null,
    audioBlob: null,
    error: null,
    progress: 0,
    createdAt: Date.now(),
  };
}

export function GenerationProvider({ children }) {
  const [savedState, setSavedState] = useLocalStorage('sound-batcher-state', initialState);
  const [locale, setLocaleState] = useState(getLocale);

  // Process saved state to handle stale audio data
  const getProcessedState = () => {
    if (savedState.generationBars && savedState.generationBars.length > 0) {
      return {
        ...savedState,
        generationBars: savedState.generationBars.map(bar => {
          // If status is 'complete' but no audioUrl, it means page was refreshed
          // Reset to 'idle' so user knows they need to regenerate
          if (bar.status === 'complete' && !bar.audioUrl) {
            return { ...bar, status: 'idle', audioUrl: null, audioBlob: null, audioName: null };
          }
          // Always clear audio data on load - blob URLs don't survive refresh
          return { ...bar, audioUrl: null, audioBlob: null };
        })
      };
    }
    return savedState;
  };

  const [state, dispatch] = useReducer(reducer, getProcessedState());

  // Persist state changes (excluding audio data which uses blob URLs that don't persist)
  useEffect(() => {
    // Filter out audioUrl and audioBlob before saving - blob URLs don't survive page refresh
    const barsToSave = state.generationBars.map(bar => ({
      ...bar,
      audioUrl: null,
      audioBlob: null,
    }));
    // Don't persist isAuthenticated - require login each visit
    setSavedState({
      generationBars: barsToSave,
    });
  }, [state.generationBars, setSavedState]);

  const login = useCallback(() => dispatch({ type: 'LOGIN' }), []);
  const logout = useCallback(() => {
    setLocaleState('en');
    setI18nLocale('en');
    dispatch({ type: 'LOGOUT' });
  }, []);

  const addBar = useCallback(() => {
    dispatch({ type: 'ADD_BAR', payload: createEmptyBar() });
  }, []);

  const removeBar = useCallback((id) => {
    dispatch({ type: 'REMOVE_BAR', payload: id });
  }, []);

  const updateBar = useCallback((id, updates) => {
    dispatch({ type: 'UPDATE_BAR', id, payload: updates });
  }, []);

  const importCSV = useCallback((bars) => {
    dispatch({ type: 'IMPORT_CSV', payload: bars });
  }, []);

  const translateBar = useCallback(async (id) => {
    const bar = state.generationBars.find(b => b.id === id);
    if (!bar || !bar.promptChinese) return;

    dispatch({ type: 'UPDATE_BAR', id, payload: { status: 'translating' } });

    try {
      const english = await translateText(bar.promptChinese);
      // Replace Chinese text with English translation
      dispatch({ type: 'UPDATE_BAR', id, payload: { promptChinese: english, status: 'idle' } });
    } catch (error) {
      dispatch({ type: 'UPDATE_BAR', id, payload: { status: 'error', error: error.message } });
    }
  }, [state.generationBars]);

  const generateBar = useCallback(async (id) => {
    const bar = state.generationBars.find(b => b.id === id);
    if (!bar || !bar.promptChinese) return;

    dispatch({ type: 'UPDATE_BAR', id, payload: { status: 'generating', progress: 0 } });

    try {
      const result = await generateAudio({
        text: bar.promptChinese,
        modelId: bar.model,
        durationSeconds: bar.duration,
        promptInfluence: bar.promptInfluence,
        loop: bar.loop,
      }, (progress) => {
        dispatch({ type: 'UPDATE_BAR', id, payload: { progress } });
      });

      dispatch({
        type: 'UPDATE_BAR',
        id,
        payload: {
          status: 'complete',
          audioUrl: result.url,
          audioName: result.filename,
          audioBlob: result.blob,
          progress: 100,
        },
      });
    } catch (error) {
      dispatch({ type: 'UPDATE_BAR', id, payload: { status: 'error', error: error.message } });
    }
  }, [state.generationBars]);

  const runAll = useCallback(async () => {
    dispatch({ type: 'SET_RUNNING_ALL', payload: true });

    for (let i = 0; i < state.generationBars.length; i++) {
      dispatch({ type: 'SET_RUN_ALL_INDEX', payload: i });
      const bar = state.generationBars[i];

      if (bar.status === 'complete' || !bar.promptChinese) continue;

      // Translate if needed (promptChinese contains Chinese)
      const textToTranslate = bar.promptChinese;
      if (/[\u4e00-\u9fa5]/.test(textToTranslate)) {
        dispatch({ type: 'UPDATE_BAR', id: bar.id, payload: { status: 'translating' } });
        try {
          const english = await translateText(textToTranslate);
          dispatch({ type: 'UPDATE_BAR', id: bar.id, payload: { promptChinese: english } });
        } catch (error) {
          dispatch({ type: 'UPDATE_BAR', id: bar.id, payload: { status: 'error', error: error.message } });
          continue;
        }
      }

      // Generate
      dispatch({ type: 'UPDATE_BAR', id: bar.id, payload: { status: 'generating', progress: 0 } });
      try {
        const result = await generateAudio({
          text: bar.promptChinese,
          modelId: bar.model,
          durationSeconds: bar.duration,
          promptInfluence: bar.promptInfluence,
          loop: bar.loop,
        }, (progress) => {
          dispatch({ type: 'UPDATE_BAR', id: bar.id, payload: { progress } });
        });
        dispatch({
          type: 'UPDATE_BAR',
          id: bar.id,
          payload: {
            status: 'complete',
            audioUrl: result.url,
            audioName: result.filename,
            audioBlob: result.blob,
            progress: 100,
          },
        });
      } catch (error) {
        dispatch({ type: 'UPDATE_BAR', id: bar.id, payload: { status: 'error', error: error.message } });
      }
    }

    dispatch({ type: 'SET_RUNNING_ALL', payload: false });
    dispatch({ type: 'SET_RUN_ALL_INDEX', payload: -1 });
  }, [state.generationBars]);

  const clearAll = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL' });
  }, []);

  const toggleLocale = useCallback(() => {
    const newLocale = toggleI18nLocale();
    setLocaleState(newLocale);
  }, []);

  return (
    <GenerationContext.Provider
      value={{
        ...state,
        locale,
        login,
        logout,
        addBar,
        removeBar,
        updateBar,
        importCSV,
        translateBar,
        generateBar,
        runAll,
        clearAll,
        toggleLocale,
      }}
    >
      {children}
    </GenerationContext.Provider>
  );
}

export function useGeneration() {
  const context = useContext(GenerationContext);
  if (!context) {
    throw new Error('useGeneration must be used within GenerationProvider');
  }
  return context;
}

// Re-export t for convenience
export { t };
