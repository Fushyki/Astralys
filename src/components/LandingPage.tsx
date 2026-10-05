import React from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  Zap, 
  FileSpreadsheet, 
  Layers, 
  ShieldCheck, 
  Download, 
  Flame, 
  Droplets,
  ExternalLink,
  ChevronRight,
  Swords,
  FolderGit2,
  Clock,
  BarChart3
} from 'lucide-react';
import { ActiveTab } from './Header';
import { CharacterAvatar } from './CharacterAvatar';

interface LandingPageProps {
  setActiveTab: (tab: ActiveTab) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ setActiveTab }) => {
  return (
    <div className="space-y-12 pb-16">
      
      {/* 1. HERO SHOWCASE SECTION ("Bonito, Limpo e com Visão Primária") */}
      <section className="relative overflow-hidden rounded-3xl p-8 sm:p-12 crystal-panel border border-ametist-600/30">
        
        {/* Ambient Lights & Starry Dust */}
        <div className="absolute top-0 right-0 -mr-24 -mt-24 w-[450px] h-[450px] rounded-full bg-ametist-600/20 blur-3xl -z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-[380px] h-[380px] rounded-full bg-purple-900/25 blur-3xl -z-10 pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Left Text & CTA Column (lg:col-span-7) */}
          <div className="lg:col-span-7 space-y-6">
            
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-ametist-500/40 text-xs font-semibold text-ametist-300">
              <Sparkles className="w-3.5 h-3.5 text-ametist-400" />
              <span>Genshin Theorycrafting & Rotation Hub • Meta 6.7/7.0</span>
            </div>

            <h1 className="font-cinzel text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
              ASTRALYS
            </h1>

            <p className="text-base sm:text-lg text-slate-300 font-normal leading-relaxed max-w-xl">
              Seu hub definitivo para planilhas, rotações e cálculos de Genshin Impact.
              Visualize <strong className="text-white">linhas do tempo frame-accurate</strong> de golpes e trocas, avalie <strong className="text-white">o que é melhor em cada situação</strong> e armazene todos os seus projetos no Vault central.
            </p>

            {/* Quick Action CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => setActiveTab('dashboards')}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 text-white font-bold text-xs sm:text-sm shadow-ametist-md hover:shadow-ametist-glow transition-all transform hover:-translate-y-0.5 cursor-pointer"
              >
                <BarChart3 className="w-4 h-4 text-cyan-300" />
                Dashboards & Rotações
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setActiveTab('vault')}
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-purple-300 font-bold text-xs sm:text-sm border border-purple-500/40 transition-all transform hover:-translate-y-0.5 cursor-pointer"
              >
                <FolderGit2 className="w-4 h-4 text-purple-400" />
                Astralys Vault
              </button>

              <button
                onClick={() => setActiveTab('damage')}
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-rose-300 font-bold text-xs sm:text-sm border border-rose-500/40 transition-all transform hover:-translate-y-0.5 cursor-pointer"
              >
                <Flame className="w-4 h-4 text-rose-400" />
                Análise de Dano
              </button>

              <button
                onClick={() => setActiveTab('weapons')}
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-amber-300 font-bold text-xs sm:text-sm border border-amber-500/40 transition-all transform hover:-translate-y-0.5 cursor-pointer"
              >
                <Swords className="w-4 h-4 text-amber-400" />
                Armas
              </button>
            </div>

            {/* Objective Bullet Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-800/80 text-xs">
              <div className="space-y-0.5">
                <span className="text-slate-500 text-[11px] block">Upload Inteligente</span>
                <span className="font-semibold text-slate-200">Lê .xlsx e Prints</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-slate-500 text-[11px] block">Motor de Recarga</span>
                <span className="font-semibold text-slate-200">128 Heróis & Favonius</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-slate-500 text-[11px] block">Exportação</span>
                <span className="font-semibold text-slate-200">PNG Hi-Res & Clipboard</span>
              </div>
            </div>

          </div>

          {/* Right Showcase Column: Floating Eye-Candy Mockup (lg:col-span-5) */}
          <div className="lg:col-span-5 flex justify-center relative">
            
            {/* Ambient Halo */}
            <div className="absolute inset-0 bg-gradient-to-tr from-ametist-500/20 to-cyan-500/20 rounded-2xl blur-xl -z-10" />

            {/* Floating Mini Mockup of the Infographic Card */}
            <div className="w-full max-w-sm p-5 rounded-2xl bg-[#091522]/95 border border-cyan-500/30 shadow-2xl space-y-4 font-sans text-slate-100 transform hover:scale-[1.02] transition-transform duration-300">
              
              {/* Mockup Header */}
              <div className="text-center border-b border-slate-800/80 pb-3">
                <span className="text-[10px] font-mono tracking-widest text-cyan-400 block uppercase">
                  ASTRALYS INFOGRAPHIC PREVIEW
                </span>
                <h3 className="font-cinzel text-xl font-bold tracking-wider text-white">
                  SANDRONE V1
                </h3>
                <span className="text-[10px] text-amber-300 font-semibold uppercase">
                  KQM Investment • 6.7 Beta
                </span>
              </div>

              {/* Mockup Progress Bars Preview */}
              <div className="space-y-2.5 text-[11px]">
                <div className="flex items-center gap-2">
                  <CharacterAvatar name="Sandrone" element="Cryo" size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between font-bold text-slate-200 mb-0.5">
                      <span>C0 Sandrone</span>
                      <span className="text-cyan-300 font-mono">52%</span>
                    </div>
                    <div className="h-2 bg-slate-900 rounded overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded" style={{ width: '52%' }} />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <CharacterAvatar name="Yae" element="Electro" size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between font-bold text-slate-200 mb-0.5">
                      <span>C1 Yae</span>
                      <span className="text-purple-300 font-mono">31%</span>
                    </div>
                    <div className="h-2 bg-slate-900 rounded overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-purple-400 to-purple-600 rounded" style={{ width: '31%' }} />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <CharacterAvatar name="Qiqi" element="Cryo" size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between font-bold text-slate-200 mb-0.5">
                      <span>C0 Qiqi</span>
                      <span className="text-cyan-300 font-mono">16%</span>
                    </div>
                    <div className="h-2 bg-slate-900 rounded overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-cyan-400 to-sky-500 rounded" style={{ width: '16%' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Mockup Footer Highlight */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-1">
                <div className="font-mono font-black text-sm tracking-tight">
                  <span className="text-amber-400">DPS: 189.1k</span>
                  <span className="text-slate-600 mx-1.5">|</span>
                  <span className="text-cyan-400">DPR: 3.88M</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono truncate">
                  (20.5s) Odette EE Yae EEE Qiqi E Sandrone CA E...
                </div>
              </div>

              {/* Floating Badges */}
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1">
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Pronto p/ Exportar
                </span>
                <span className="font-bold text-ametist-300">ASTRALYS</span>
              </div>

            </div>

          </div>

        </div>

      </section>

      {/* 2. THE THREE CORE PILLARS (Visão Primária das Ferramentas) */}
      <section className="space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 font-cinzel">
            <Layers className="w-5 h-5 text-ametist-400" />
            Módulos da Plataforma
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Tudo o que você precisa para teoria, cálculos de rotação e compartilhamento de builds
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* CARD 0A: DASHBOARDS ANALÍTICOS & ROTAÇÕES */}
          <div 
            onClick={() => setActiveTab('dashboards')}
            className="crystal-panel rounded-2xl p-6 transition-all duration-300 hover:border-cyan-400/50 hover:shadow-ametist-md cursor-pointer flex flex-col justify-between group bg-gradient-to-b from-cyan-950/20 to-transparent"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-700/50">
                  Destaque
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors flex items-center gap-1.5">
                  Dashboards & Rotações
                  <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Ranking comparativo de DPS/DPR entre todas as equipes do Vault, linhas do tempo interativas de rotações (quem entra, qual golpe usa, duração exata) e matriz de decisões situacionais.
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-2">
                <span className="text-[11px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">Ranking DPS & DPR</span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">Timeline de Golpes</span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">Matriz Situacional</span>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-800 mt-6 flex items-center justify-between text-xs text-cyan-400 font-semibold">
              <span>Abrir Dashboards</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* CARD 0B: ASTRALYS VAULT */}
          <div 
            onClick={() => setActiveTab('vault')}
            className="crystal-panel rounded-2xl p-6 transition-all duration-300 hover:border-purple-400/50 hover:shadow-ametist-md cursor-pointer flex flex-col justify-between group bg-gradient-to-b from-purple-950/20 to-transparent"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
                  <FolderGit2 className="w-6 h-6" />
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-950/80 text-purple-300 border border-purple-700/50">
                  Repositório
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors flex items-center gap-1.5">
                  Astralys Vault
                  <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Armazene todas as suas planilhas e cálculos em um só lugar. Organize por Carry, tags e rotações, com backup JSON e carregamento instantâneo.
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-2">
                <span className="text-[11px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">Todas as Planilhas</span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">Tags & Busca</span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">Backup JSON</span>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-800 mt-6 flex items-center justify-between text-xs text-purple-400 font-semibold">
              <span>Abrir Repositório</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* CARD 1: GERADOR DE INFOGRÁFICOS */}
          <div 
            onClick={() => setActiveTab('generator')}
            className="crystal-panel rounded-2xl p-6 transition-all duration-300 hover:border-ametist-400/50 hover:shadow-ametist-md cursor-pointer flex flex-col justify-between group"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-700/50">
                  Flagship
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors flex items-center gap-1.5">
                  Gerador de Infográficos
                  <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Arraste sua planilha <code className="text-slate-200">Calc Sheet.xlsx</code> ou cole tabelas de print. O sistema gera automaticamente o card idêntico ao modelo com Damage Share, equipamentos e DPS de rotação.
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-2">
                <span className="text-[11px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">Lê .xlsx Direto</span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">Formatos Sandrone/Wrio</span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">Exporta em PNG</span>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-800 mt-6 flex items-center justify-between text-xs text-cyan-400 font-semibold">
              <span>Abrir Gerador</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* CARD 2: COMPARADOR DE ARMAS */}
          <div 
            onClick={() => setActiveTab('weapons')}
            className="crystal-panel rounded-2xl p-6 transition-all duration-300 hover:border-amber-400/50 hover:shadow-ametist-md cursor-pointer flex flex-col justify-between group"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                  <Swords className="w-6 h-6" />
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-950/80 text-amber-300 border border-amber-700/50">
                  Novo
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors flex items-center gap-1.5">
                  Comparador de Armas
                  <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Comparação direta de armas e refinamentos (R1 a R5) com baseline dinâmico (100%), gráficos de barras proporcionais, adição de armas personalizadas e exportação em imagem.
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-2">
                <span className="text-[11px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">Baseline 100% Livre</span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">R1 vs R5</span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">Injeção no Card</span>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-800 mt-6 flex items-center justify-between text-xs text-amber-400 font-semibold">
              <span>Comparar Armas</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* CARD 3: ANÁLISE DE DANO */}
          <div 
            onClick={() => setActiveTab('damage')}
            className="crystal-panel rounded-2xl p-6 transition-all duration-300 hover:border-rose-400/50 hover:shadow-ametist-md cursor-pointer flex flex-col justify-between group"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 group-hover:scale-105 transition-transform">
                  <Flame className="w-6 h-6" />
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-950/80 text-rose-300 border border-rose-700/50">
                  Golpe a Golpe
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white group-hover:text-rose-300 transition-colors flex items-center gap-1.5">
                  Análise de Dano & Rotações
                  <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Decomposição detalhada dos golpes (QM, FM, E, C), inspetor matemático de fórmulas de reações Lunares e Stellares, e edição instantânea dos status dos personagens no site.
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-2">
                <span className="text-[11px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">Status Editáveis</span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">Fórmulas Matemáticas</span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">Reações Stellares/Lunares</span>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-800 mt-6 flex items-center justify-between text-xs text-rose-400 font-semibold">
              <span>Analisar Golpes</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* CARD 2: CALCULADORA DE ER */}
          <div 
            onClick={() => setActiveTab('er')}
            className="crystal-panel rounded-2xl p-6 transition-all duration-300 hover:border-amber-400/50 hover:shadow-ametist-md cursor-pointer flex flex-col justify-between group"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                  <Zap className="w-6 h-6" />
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-950/80 text-amber-300 border border-amber-700/50">
                  Partículas Reais
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors flex items-center gap-1.5">
                  Calculadora de Recarga (ER)
                  <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Calcule a recarga exata necessária para 128 personagens. Suporte a armas Favonius, canalização dividida (50/50) e transferência em 1 clique para o Card de Infográfico.
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-2">
                <span className="text-[11px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">128 Heróis</span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">Split Funneling</span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">Ponte para o Card</span>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-800 mt-6 flex items-center justify-between text-xs text-amber-400 font-semibold">
              <span>Calcular Recargas</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

        </div>
      </section>

      {/* 3. SCIENTIFIC & TECHNICAL HIGHLIGHTS */}
      <section className="crystal-panel rounded-2xl p-6 sm:p-8 space-y-5">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Rigor Matemático & Conformidade com o Meta
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="font-bold text-cyan-300 block">Lunaris.moe API</span>
            <span className="text-slate-300 font-semibold block">Versão 7.1 / 6.7 Suportada</span>
            <p className="text-slate-400 text-[11px]">
              Compatibilidade total com personagens novos e armas do meta futuro presentes na sua planilha.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="font-bold text-amber-300 block">Absorção de Partículas</span>
            <span className="text-slate-300 font-semibold block">Regras Reais de Combate</span>
            <p className="text-slate-400 text-[11px]">
              3.0/1.8 no mesmo elemento, 1.0/0.6 em elemento diferente e partículas neutras de Favonius.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="font-bold text-purple-300 block">Template KQM / TGS</span>
            <span className="text-slate-300 font-semibold block">Layout images.jfif</span>
            <p className="text-slate-400 text-[11px]">
              Renderização visual em 4 quadrantes com alta densidade de informação e contraste nítido.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="font-bold text-emerald-300 block">Exportação Direta</span>
            <span className="text-slate-300 font-semibold block">PNG 2.5x Hi-Res</span>
            <p className="text-slate-400 text-[11px]">
              Gera imagens nítidas sem cortes, prontas para colar diretamente no Discord ou redes sociais.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
};
