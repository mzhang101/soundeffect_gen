const translations = {
  en: {
    // Auth
    signIn: 'Sign In',
    signInToContinue: 'Sign in to continue',
    username: 'Username',
    password: 'Password',
    invalidCredentials: 'Invalid credentials. Please try again.',
    signingIn: 'Signing in...',
    demoAccount: 'Demo account:',

    // Header
    soundFxBatcher: 'Sound FX Batcher',
    processing: 'Processing',
    of: 'of',
    generated: 'generated',
    importCsv: 'Import CSV',
    addBar: 'Add Bar',
    runAll: 'Run All',
    running: 'Running...',
    download: 'Download',
    clear: 'Clear',

    // Generation Bar
    soundTitle: 'Sound title',
    guidance: 'Influence',
    duration: 'Duration',
    enterSoundDescription: 'Enter sound description...',
    translate: 'Translate',
    translating: 'Translating...',
    generate: 'Generate',
    generating: 'Generating...',
    generatingAudio: 'Generating audio...',

    // Status
    error: 'Error',
    generatedSuccessfully: 'Generated successfully',

    // Empty State
    noSoundEffectsYet: 'No sound effects yet',
    importCsvOrAdd: 'Import a CSV file or add a new generation bar to start creating sound effects.',
    addGenerationBar: 'Add Generation Bar',
    needTemplate: 'Need a template?',
    downloadCsvTemplate: 'Download CSV Template',

    // Tips
    tips: 'Tips',
    csvFormat: 'CSV format: id, name, description_en, duration_seconds',
    useTranslateButton: 'Use the Translate button to convert Chinese descriptions to English',
    adjustSettings: 'Adjust Influence and Duration for different audio effects',

    // Audio Player
    audioReady: 'Audio ready',
    downloadAudio: 'Download',

    // Models
    elevenTextToSoundV2: 'ElevenLabs Text-to-Sound v2',
    elevenFlash: 'ElevenLabs Flash',
  },
  zh: {
    // Auth
    signIn: '登录',
    signInToContinue: '登录以继续',
    username: '用户名',
    password: '密码',
    invalidCredentials: '用户名或密码错误',
    signingIn: '登录中...',
    demoAccount: '演示账号：',

    // Header
    soundFxBatcher: '音效批量生成器',
    processing: '处理中',
    of: '/',
    generated: '已生成',
    importCsv: '导入 CSV',
    addBar: '添加',
    runAll: '全部运行',
    running: '运行中...',
    download: '下载',
    clear: '清空',

    // Generation Bar
    soundTitle: '音效标题',
    guidance: '影响度',
    duration: '时长',
    enterSoundDescription: '输入音效描述...',
    translate: '翻译',
    translating: '翻译中...',
    generate: '生成',
    generating: '生成中...',
    generatingAudio: '正在生成音频...',

    // Status
    error: '错误',
    generatedSuccessfully: '生成成功',

    // Empty State
    noSoundEffectsYet: '暂无音效',
    importCsvOrAdd: '导入 CSV 文件或添加生成条来开始创建音效。',
    addGenerationBar: '添加生成条',
    needTemplate: '需要模板？',
    downloadCsvTemplate: '下载 CSV 模板',

    // Tips
    tips: '提示',
    csvFormat: 'CSV 格式：id, name, description_en, duration_seconds',
    useTranslateButton: '使用翻译按钮将中文描述转换为英文',
    adjustSettings: '调整影响度和时长以获得不同的音效',

    // Audio Player
    audioReady: '音频就绪',
    downloadAudio: '下载',

    // Models
    elevenTextToSoundV2: 'ElevenLabs 文字转音效 v2',
    elevenFlash: 'ElevenLabs Flash',
  }
};

let currentLocale = localStorage.getItem('locale') || 'en';

export function setLocale(locale) {
  currentLocale = locale;
  localStorage.setItem('locale', locale);
}

export function getLocale() {
  return currentLocale;
}

export function t(key) {
  return translations[currentLocale]?.[key] || translations.en[key] || key;
}

export function toggleLocale() {
  setLocale(currentLocale === 'en' ? 'zh' : 'en');
  return currentLocale;
}
