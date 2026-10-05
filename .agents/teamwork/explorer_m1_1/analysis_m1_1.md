# Technical Analysis: Milestone 1 Part 1 — Dependencies, main.tsx & App.tsx Shell
**Agent**: `explorer_m1_1`  
**Date**: 2026-10-03  
**Status**: Complete  

---

## Executive Summary

Milestone 1 establishes the infrastructure baseline, core models, and application shell for **Astralys Suite** (formerly "Ametist Impact Suite"). In its current state, the repository lacks `node_modules`, `src/main.tsx`, and `src/App.tsx`, causing any build (`npm run build`) or dev server launch (`npm run dev`) to fail immediately. Furthermore, `package.json` lacks the critical libraries required by R1 and R2 (`xlsx` and `html-to-image`).

This analysis delivers:
1. Exact package dependency definitions and an `npm install` strategy.
2. Specification and implementation for `src/main.tsx` mounting into `index.html` (`#root`).
3. Specification and implementation for `src/App.tsx` shell, including tab routing (`'landing' | 'generator' | 'er' | 'tierlist' | 'damage'`), cross-component state (`ERTransferPayload`), and high-fidelity placeholder shells for unbuilt milestones.
4. Necessary synchronization patches for `index.html` (title: Astralys Suite), `src/components/Header.tsx` (branding + nav), and `src/components/LandingPage.tsx` (branding + CTA).
5. Step-by-step verification commands for the Worker.

---

## 1. Package Dependencies & Install Strategy

### 1.1 Existing State of `package.json`
`package.json` contains:
- `dependencies`: `react` (^18.3.1), `react-dom` (^18.3.1), `lucide-react` (^0.453.0), `clsx` (^2.1.1), `tailwind-merge` (^2.5.4)
- `devDependencies`: `@types/react` (^18.3.11), `@types/react-dom` (^18.3.1), `@vitejs/plugin-react` (^4.3.3), `autoprefixer` (^10.4.20), `postcss` (^8.4.47), `tailwindcss` (^3.4.14), `typescript` (^5.6.3), `vite` (^5.4.9)
- `scripts`: `"dev": "vite"`, `"build": "tsc && vite build"`, `"preview": "vite preview"`

### 1.2 Required Additions
1. **`xlsx`** (SheetJS Community Edition):
   - **Target Version**: `^0.18.5`
   - **Role**: Required by Feature F1 / Requirement R1 for client-side workbook parsing of `Calc Sheet.xlsx` (12 tabs, binary array buffers, cell matrices).
   - **Type declarations**: Bundled natively within `xlsx` (`xlsx.d.ts`), no `@types/xlsx` needed.
2. **`html-to-image`**:
   - **Target Version**: `^1.11.11`
   - **Role**: Required by Feature F5 / Requirement R1 for converting DOM node `#infographic-card` into high-resolution PNG (`toPng` at `pixelRatio: 2`) and copying image blob to clipboard (`toBlob`).
   - **Type declarations**: Bundled natively (`index.d.ts`).
3. **`@types/node`** (devDependency):
   - **Target Version**: `^22.7.5` (or `^20.16.11`)
   - **Role**: Provides standard Node.js typings (`process.env`, `Buffer`, path utilities) for test runner scripts, Vite plugins, and tooling.
4. **`tsx`** (devDependency):
   - **Target Version**: `^4.19.1`
   - **Role**: Executes TypeScript test suites directly (`npx tsx tests/runAllTests.ts`) as specified in `TEST_INFRA.md`.
5. **`test` script**:
   - Add `"test": "tsx tests/runAllTests.ts"` under `"scripts"`.

### 1.3 Recommended `package.json`
```json
{
  "name": "astralys-suite",
  "private": true,
  "version": "2.4.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "tsx tests/runAllTests.ts"
  },
  "dependencies": {
    "clsx": "^2.1.1",
    "html-to-image": "^1.11.11",
    "lucide-react": "^0.453.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "tailwind-merge": "^2.5.4",
    "xlsx": "^0.18.5"
  },
  "devDependencies": {
    "@types/node": "^22.7.5",
    "@types/react": "^18.3.11",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.3",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.14",
    "tsx": "^4.19.1",
    "typescript": "^5.6.3",
    "vite": "^5.4.9"
  }
}
```

### 1.4 Execution Strategy for Worker
1. Update `package.json` with the JSON block above.
2. Execute command: `npm install` in `C:\Users\dabiv\ametist-impact-suite`.
3. Verify presence of `node_modules/xlsx` and `node_modules/html-to-image`.

---

## 2. Specification for `src/main.tsx` & `index.html`

### 2.1 Analysis of `index.html`
- Contains `<div id="root"></div>` (line 13).
- Contains `<script type="module" src="/src/main.tsx"></script>` (line 14).
- User branding directive requires updating line 7:
  - From: `<title>Ametist Impact Suite — Unified Genshin Tools</title>`
  - To: `<title>Astralys Suite — Unified Genshin Tools</title>`

### 2.2 Requirements for `src/main.tsx`
1. Must import React and ReactDOM client: `import React from 'react'; import ReactDOM from 'react-dom/client';`
2. Must import `./index.css` to load Tailwind base, components, utilities, and crystal-glass classes.
3. Must import `App` from `./App`.
4. Must query element `document.getElementById('root')` and throw a descriptive error if missing.
5. Must invoke `ReactDOM.createRoot(rootElement).render(<React.StrictMode><App /></React.StrictMode>);`.

### 2.3 Concrete Implementation: `src/main.tsx`
```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Failed to find root DOM element with id "root". Verify index.html contains <div id="root"></div>.');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

---

## 3. Specification for `src/App.tsx` Shell

### 3.1 Routing & Navigation State
- **Tab State**:
  ```typescript
  export type ActiveTab = 'landing' | 'generator' | 'er' | 'tierlist' | 'damage';
  ```
  - `'landing'`: Hub Dashboard (`LandingPage.tsx`)
  - `'generator'`: Infographic Card Generator (Milestone 3 & 4)
  - `'er'`: Particle ER Calculator (Milestone 2)
  - `'tierlist'`: Version 6.7 Tierlist Portal (Milestone 5)
  - `'damage'`: Combat Damage Engine Simulator
- **Default Tab**: `'landing'`
- **Abyss / Enemy Level State**:
  - `abyssLevel`: `number` (defaults to `100` for Floor 12 Abyss Boss, toggles to `90`)

### 3.2 Cross-Component Data Transfer (`ERCalculator` -> `InfographicCard`)
According to `PROJECT.md § Interface Contracts`:
```typescript
export interface ERTransferTarget {
  slotIndex: number;      // 0 to 3
  characterName: string;  // e.g. "Mavuika"
  erTargetPct: number;    // e.g. 166.8
  erTargetLabel: string;  // e.g. "167 ER"
}

export interface ERTransferPayload {
  targets: ERTransferTarget[];
}
```
In `App.tsx`:
- `erTransferPayload: ERTransferPayload | null` (stored in top-level state).
- `handleTransferER(payload: ERTransferPayload)`:
  1. Updates `erTransferPayload`.
  2. Automatically transitions `activeTab` to `'generator'`.
  3. Displays confirmation toast/banner in generator shell.

### 3.3 Placeholder Shells for Unbuilt Milestones
In Milestone 1, components `InfographicGenerator.tsx`, `ERCalculator.tsx`, and `TierlistPortal.tsx` are planned for subsequent milestones. `App.tsx` must render modular placeholder shells that:
1. Use the full "Astralys / Ametist Clean" theme (`crystal-panel`, gradient buttons, typography).
2. Clearly explain feature scope and milestone readiness.
3. Include interactive prototypes (e.g. an interactive "Simular Transferência de ER" button in the ER shell that dispatches `handleTransferER` to test cross-component wiring).
4. Seamlessly get replaced in Milestones 2–5 without altering `App.tsx` top-level architecture.

### 3.4 Concrete Implementation: `src/App.tsx`
```typescript
import React, { useState } from 'react';
import { Header } from './components/Header';
import { LandingPage } from './components/LandingPage';
import { 
  Sparkles, 
  Zap, 
  ListOrdered, 
  Layers, 
  ArrowRight, 
  Upload, 
  FileSpreadsheet, 
  ClipboardCopy, 
  Download, 
  CheckCircle2, 
  Calculator,
  ShieldCheck,
  Info,
  ExternalLink
} from 'lucide-react';

export type ActiveTab = 'landing' | 'generator' | 'er' | 'tierlist' | 'damage';

export interface ERTransferTarget {
  slotIndex: number;
  characterName: string;
  erTargetPct: number;
  erTargetLabel: string;
}

export interface ERTransferPayload {
  targets: ERTransferTarget[];
}

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('landing');
  const [abyssLevel, setAbyssLevel] = useState<number>(100);
  const [erPayload, setErPayload] = useState<ERTransferPayload | null>(null);

  const handleTransferER = (payload: ERTransferPayload) => {
    setErPayload(payload);
    setActiveTab('generator');
  };

  return (
    <div className="min-h-screen bg-ametist-950 text-slate-100 flex flex-col font-sans selection:bg-ametist-500 selection:text-white">
      {/* Sticky Header with Navigation and Branding */}
      <Header 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        abyssLevel={abyssLevel}
        setAbyssLevel={setAbyssLevel}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'landing' && (
          <LandingPage setActiveTab={setActiveTab} />
        )}

        {activeTab === 'generator' && (
          <GeneratorPlaceholderShell 
            erPayload={erPayload} 
            onClearPayload={() => setErPayload(null)} 
            onOpenER={() => setActiveTab('er')}
          />
        )}

        {activeTab === 'er' && (
          <ERCalculatorPlaceholderShell 
            onTransferER={handleTransferER} 
            abyssLevel={abyssLevel}
          />
        )}

        {activeTab === 'tierlist' && (
          <TierlistPlaceholderShell />
        )}

        {activeTab === 'damage' && (
          <DamagePlaceholderShell abyssLevel={abyssLevel} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-ametist-800/60 bg-ametist-950/80 backdrop-blur-md py-6 text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-cinzel font-bold text-ametist-300 tracking-wider">ASTRALYS SUITE</span>
            <span>•</span>
            <span>Unified Genshin Impact Theorycrafting Platform</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Versão 2.4.0</span>
            <span>•</span>
            <span>Meta 6.7 Natlan & Snezhnaya</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

/* --- Placeholder Shells (Milestones 2, 3, 4, 5) --- */

interface GeneratorPlaceholderShellProps {
  erPayload: ERTransferPayload | null;
  onClearPayload: () => void;
  onOpenER: () => void;
}

const GeneratorPlaceholderShell: React.FC<GeneratorPlaceholderShellProps> = ({
  erPayload,
  onClearPayload,
  onOpenER
}) => {
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="crystal-panel rounded-2xl p-6 sm:p-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-semibold text-emerald-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Módulo R1 • Gerador de Infográficos & Parser de Rotações</span>
            </div>
            <h1 className="text-3xl font-bold font-cinzel text-white">
              Gerador de Cards de Rotação
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl">
              Transforme planilhas de cálculo (<code className="text-ametist-300">Calc Sheet.xlsx</code>) e tabelas coladas em cards de rotação visuais de 4 seções com exportação PNG e cópia para clipboard.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs px-3 py-1.5 rounded-lg bg-ametist-900 border border-ametist-700/60 text-ametist-300 font-mono">
              Milestone 3 & 4
            </span>
          </div>
        </div>

        {/* ER Payload Integration Alert */}
        {erPayload && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                  Targets de ER Recebidos da Calculadora (R2 ➔ R1 Contract)
                </div>
                <div className="text-sm text-slate-200 mt-1 flex flex-wrap gap-3">
                  {erPayload.targets.map((t) => (
                    <span key={t.slotIndex} className="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-700/40 text-amber-200 text-xs font-mono">
                      Slot {t.slotIndex + 1} ({t.characterName}): <strong>{t.erTargetLabel}</strong> ({t.erTargetPct.toFixed(1)}%)
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <button 
              onClick={onClearPayload}
              className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
            >
              Limpar
            </button>
          </div>
        )}
      </div>

      {/* Feature Showcase Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="crystal-panel rounded-2xl p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-white text-base">Parser Excel Heurístico</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Upload direto de planilhas <code className="text-slate-300">.xlsx</code> identificando abas Sandrone, Mavuika, Flins e mais em 4 arquétipos de layout.
          </p>
        </div>

        <div className="crystal-panel rounded-2xl p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Layers className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-white text-base">Card 4-Seções (images.jfif)</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Header do Carry, barras de contribuição de dano por elemento, painel de armas/artefatos e footer com métricas de DPS/DPR.
          </p>
        </div>

        <div className="crystal-panel rounded-2xl p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <Download className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-white text-base">Exportação 2x PNG & Clipboard</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Geração instantânea de imagem em alta fidelidade via <code className="text-slate-300">html-to-image</code> com cópia direta para a área de transferência.
          </p>
        </div>
      </div>

      <div className="crystal-panel rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Info className="w-5 h-5 text-ametist-400 flex-shrink-0" />
          <p className="text-xs text-slate-300">
            Deseja calcular os requisitos de energia antes de preencher o card? Acesse a calculadora de recarga.
          </p>
        </div>
        <button
          onClick={onOpenER}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-ametist-800 hover:bg-ametist-750 border border-ametist-600/40 text-xs font-bold text-ametist-200 hover:text-white transition-colors"
        >
          <Zap className="w-4 h-4 text-amber-400" />
          Abrir Calculadora de ER
        </button>
      </div>
    </div>
  );
};

interface ERCalculatorPlaceholderShellProps {
  onTransferER: (payload: ERTransferPayload) => void;
  abyssLevel: number;
}

const ERCalculatorPlaceholderShell: React.FC<ERCalculatorPlaceholderShellProps> = ({
  onTransferER,
  abyssLevel
}) => {
  const handleSimulateTransfer = () => {
    onTransferER({
      targets: [
        { slotIndex: 0, characterName: 'Mavuika', erTargetPct: 100.0, erTargetLabel: '100 ER' },
        { slotIndex: 1, characterName: 'Citlali', erTargetPct: 166.8, erTargetLabel: '167 ER' },
        { slotIndex: 2, characterName: 'Iansan', erTargetPct: 195.4, erTargetLabel: '195 ER' },
        { slotIndex: 3, characterName: 'Bennett', erTargetPct: 220.0, erTargetLabel: '220 ER' },
      ]
    });
  };

  return (
    <div className="space-y-6">
      <div className="crystal-panel rounded-2xl p-6 sm:p-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-xs font-semibold text-amber-400">
              <Zap className="w-3.5 h-3.5" />
              <span>Módulo R2 • Calculadora de Recarga de Energia</span>
            </div>
            <h1 className="text-3xl font-bold font-cinzel text-white">
              Calculadora de ER por Partículas
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl">
              Porte fiel do script <code className="text-amber-300">Calculadora_Recarga_Genshin.html</code>. Suporte a 128 personagens, absorção on/off-field, Favonius, Split Funneling e margem de Boss (+15%).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs px-3 py-1.5 rounded-lg bg-ametist-900 border border-ametist-700/60 text-amber-300 font-mono">
              Milestone 2
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="crystal-panel rounded-2xl p-6 space-y-4">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            Parâmetros Atuais do Sistema
          </h3>
          <ul className="space-y-2 text-xs text-slate-300">
            <li className="flex justify-between border-b border-ametist-800/40 pb-1.5">
              <span>Nível do Alvo (Inimigo):</span>
              <span className="font-bold text-ametist-200">Lv. {abyssLevel}</span>
            </li>
            <li className="flex justify-between border-b border-ametist-800/40 pb-1.5">
              <span>Multiplicadores Elemento Igual:</span>
              <span className="font-mono text-emerald-300">3.0 (On-Field) / 1.8 (Off-Field)</span>
            </li>
            <li className="flex justify-between border-b border-ametist-800/40 pb-1.5">
              <span>Multiplicadores Elemento Diferente:</span>
              <span className="font-mono text-amber-300">1.0 (On-Field) / 0.6 (Off-Field)</span>
            </li>
            <li className="flex justify-between border-b border-ametist-800/40 pb-1.5">
              <span>Partículas Claras (Neutras / Favonius):</span>
              <span className="font-mono text-sky-300">2.0 (On-Field) / 1.2 (Off-Field)</span>
            </li>
            <li className="flex justify-between">
              <span>Margem de Segurança (Boss Abyss 12):</span>
              <span className="font-mono text-purple-300">+15% ER Target</span>
            </li>
          </ul>
        </div>

        <div className="crystal-panel rounded-2xl p-6 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              Transferência de ER para o Gerador de Cards
            </h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Teste o contrato de comunicação entre módulos. Clique no botão abaixo para transferir alvos de ER calculados diretamente para o Gerador.
            </p>
          </div>

          <button
            onClick={handleSimulateTransfer}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold text-xs shadow-ametist-sm transition-all"
          >
            <Zap className="w-4 h-4" />
            Simular Transferência de Targets de ER (Mavuika / Citlali / Iansan / Bennett)
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

const TierlistPlaceholderShell: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="crystal-panel rounded-2xl p-6 sm:p-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-xs font-semibold text-sky-400">
              <ListOrdered className="w-3.5 h-3.5" />
              <span>Módulo R3 • Portal de Tierlists Meta 6.7</span>
            </div>
            <h1 className="text-3xl font-bold font-cinzel text-white">
              Tierlists de Armas & Personagens 6.7
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl">
              Classificações consolidadas para Natlan e Snezhnaya com filtros interativos por função (Carry, Sub-DPS, Suporte) e elemento.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs px-3 py-1.5 rounded-lg bg-ametist-900 border border-ametist-700/60 text-sky-300 font-mono">
              Milestone 5
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

interface DamagePlaceholderShellProps {
  abyssLevel: number;
}

const DamagePlaceholderShell: React.FC<DamagePlaceholderShellProps> = ({ abyssLevel }) => {
  return (
    <div className="space-y-6">
      <div className="crystal-panel rounded-2xl p-6 sm:p-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-xs font-semibold text-purple-300">
              <Calculator className="w-3.5 h-3.5" />
              <span>Simulador de Dano & DPS Engine</span>
            </div>
            <h1 className="text-3xl font-bold font-cinzel text-white">
              Cálculo de Dano & Rotações
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl">
              Fórmulas completas com mitigação de defesa (Lv. {abyssLevel}), resistência, reações amplificadoras e bônus Yuhengcup / Lunaris.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
```

---

## 4. Updates for `Header.tsx` & `LandingPage.tsx`

### 4.1 Synchronizing `src/components/Header.tsx`
`Header.tsx` currently defines:
```typescript
interface HeaderProps {
  activeTab: 'landing' | 'er' | 'damage' | 'tierlist';
  setActiveTab: (tab: 'landing' | 'er' | 'damage' | 'tierlist') => void;
  abyssLevel: number;
  setAbyssLevel: (lvl: number) => void;
}
```
**Required modifications**:
1. Update `HeaderProps` to use `ActiveTab`:
   ```typescript
   export type ActiveTab = 'landing' | 'generator' | 'er' | 'tierlist' | 'damage';
   
   interface HeaderProps {
     activeTab: ActiveTab;
     setActiveTab: (tab: ActiveTab) => void;
     abyssLevel: number;
     setAbyssLevel: (lvl: number) => void;
   }
   ```
2. Branding update (User directive: "Astralys Suite"):
   - Replace `AMETIST` with `ASTRALYS` (line 36).
   - Change `Impact Theorycrafting Hub` to `Genshin Theorycrafting Hub` (line 42).
3. Add Navigation Button for `generator`:
   ```tsx
   <button
     onClick={() => setActiveTab('generator')}
     className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
       activeTab === 'generator'
         ? 'bg-gradient-to-r from-ametist-600 to-ametist-500 text-white shadow-sm'
         : 'text-slate-300 hover:text-white hover:bg-ametist-800/50'
     }`}
   >
     <Sparkles className="w-4 h-4 text-emerald-400" />
     Gerador de Card
   </button>
   ```

### 4.2 Synchronizing `src/components/LandingPage.tsx`
1. Branding update:
   - Change `Ametist Impact Suite` to `Astralys Suite`.
2. Add direct CTA or Card link to `setActiveTab('generator')`.

---

## 5. Verification Commands for the Worker

After implementation, the Worker should execute the following sequence:

1. **Verify dependencies installed**:
   ```powershell
   npm install
   Test-Path "node_modules/xlsx"
   Test-Path "node_modules/html-to-image"
   ```
   *Expected: Both return `True`.*

2. **Verify TypeScript compilation**:
   ```powershell
   npx tsc --noEmit
   ```
   *Expected: Exits with code 0 without any type errors.*

3. **Verify Vite build**:
   ```powershell
   npm run build
   ```
   *Expected: `dist/index.html` and bundled assets generated cleanly with exit code 0.*
