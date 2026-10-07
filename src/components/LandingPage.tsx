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
  BarChart3,
  Gem,
  Cloud,
  Lock
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
                <span className="text-slate-500 text-[11px] block">Análise Inteligente</span>
                <span className="font-semibold text-slate-200">.xml, .xlsx e Prints</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-slate-500 text-[11px] block">Calculadora de Recarga</span>
                <span className="font-semibold text-slate-200">128 Personagens + Favonius</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-slate-500 text-[11px] block">Compartilhar</span>
                <span className="font-semibold text-slate-200">Salvar e Copiar</span>
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">

          {/* CARD 1: DASHBOARDS */}
          <div 
            onClick={() => setActiveTab('dashboards')}
            className="crystal-panel rounded-2xl p-4 sm:p-4.5 transition-all duration-200 hover:border-cyan-400/50 hover:scale-[1.01] cursor-pointer flex flex-col justify-between group bg-gradient-to-b from-cyan-950/15 to-transparent"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                  <BarChart3 className="w-4.5 h-4.5" />
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-700/40">
                  Destaque
                </span>
              </div>

              <div>
                <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-cyan-300 transition-colors flex items-center gap-1">
                  Dashboards & Rotações
                  <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                  Rankings de DPS/DPR, timelines de golpes e matriz situacional de decisões.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/60 mt-3 flex items-center justify-between text-xs text-cyan-400 font-semibold">
              <span>Abrir Dashboards</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* CARD 2: VAULT */}
          <div 
            onClick={() => setActiveTab('vault')}
            className="crystal-panel rounded-2xl p-4 sm:p-4.5 transition-all duration-200 hover:border-purple-400/50 hover:scale-[1.01] cursor-pointer flex flex-col justify-between group bg-gradient-to-b from-purple-950/15 to-transparent"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
                  <FolderGit2 className="w-4.5 h-4.5" />
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-950/80 text-purple-300 border border-purple-700/40">
                  Repositório
                </span>
              </div>

              <div>
                <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-purple-300 transition-colors flex items-center gap-1">
                  Astralys Vault
                  <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                  Repositório central para salvar, buscar e gerenciar equipes na nuvem e local.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/60 mt-3 flex items-center justify-between text-xs text-purple-400 font-semibold">
              <span>Abrir Vault</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* CARD 3: GERADOR DE INFOGRÁFICOS */}
          <div 
            onClick={() => setActiveTab('generator')}
            className="crystal-panel rounded-2xl p-4 sm:p-4.5 transition-all duration-200 hover:border-cyan-400/50 hover:scale-[1.01] cursor-pointer flex flex-col justify-between group"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                  <FileSpreadsheet className="w-4.5 h-4.5" />
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-700/40">
                  Infográfico
                </span>
              </div>

              <div>
                <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-cyan-300 transition-colors flex items-center gap-1">
                  Gerador de Infográficos
                  <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                  Gere cards visuais automáticos com Damage Share, armas e DPS de rotação.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/60 mt-3 flex items-center justify-between text-xs text-cyan-400 font-semibold">
              <span>Criar Infográfico</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* CARD 4: COMPARADOR DE ARMAS */}
          <div 
            onClick={() => setActiveTab('weapons')}
            className="crystal-panel rounded-2xl p-4 sm:p-4.5 transition-all duration-200 hover:border-amber-400/50 hover:scale-[1.01] cursor-pointer flex flex-col justify-between group"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                  <Swords className="w-4.5 h-4.5" />
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-700/40">
                  Armas
                </span>
              </div>

              <div>
                <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-amber-300 transition-colors flex items-center gap-1">
                  Comparador de Armas
                  <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                  Compare armas e refinamentos (R1 a R5) com baseline dinâmico de 100%.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/60 mt-3 flex items-center justify-between text-xs text-amber-400 font-semibold">
              <span>Comparar Armas</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* CARD 5: ANÁLISE DE DANO */}
          <div 
            onClick={() => setActiveTab('damage')}
            className="crystal-panel rounded-2xl p-4 sm:p-4.5 transition-all duration-200 hover:border-rose-400/50 hover:scale-[1.01] cursor-pointer flex flex-col justify-between group"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-400 group-hover:scale-105 transition-transform">
                  <Flame className="w-4.5 h-4.5" />
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-950/80 text-rose-300 border border-rose-700/40">
                  Combate
                </span>
              </div>

              <div>
                <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-rose-300 transition-colors flex items-center gap-1">
                  Análise de Dano & Rotações
                  <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                  Decomposição golpe a golpe, fórmulas matemáticas e reações elementais.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/60 mt-3 flex items-center justify-between text-xs text-rose-400 font-semibold">
              <span>Analisar Dano</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* CARD 6: CALCULADORA DE ER */}
          <div 
            onClick={() => setActiveTab('er')}
            className="crystal-panel rounded-2xl p-4 sm:p-4.5 transition-all duration-200 hover:border-purple-400/50 hover:scale-[1.01] cursor-pointer flex flex-col justify-between group"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
                  <Zap className="w-4.5 h-4.5" />
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-950/80 text-purple-300 border border-purple-700/40">
                  Recarga
                </span>
              </div>

              <div>
                <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-purple-300 transition-colors flex items-center gap-1">
                  Calculadora de Recarga (ER)
                  <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                  Cálculo de recarga para 128 personagens com Favonius e split funneling.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/60 mt-3 flex items-center justify-between text-xs text-purple-400 font-semibold">
              <span>Calcular Recarga</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

        </div>
      </section>

      {/* 2B. UNIFIED SSO & CLOUD SHOWCASE */}
      <section className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-ametist-950/60 via-purple-950/40 to-slate-900 border border-ametist-500/30 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-ametist-600 via-purple-600 to-amber-400 p-0.5 shadow-lg shadow-ametist-600/30 flex items-center justify-center shrink-0">
            <div className="w-full h-full bg-[#0a0c16] rounded-[14px] flex items-center justify-center">
              <Gem className="text-ametist-400 w-6 h-6 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">Conta Unificada Astralys & Ametist</h3>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-ametist-900 text-ametist-300 border border-ametist-500/40">
                SSO Integrado
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Use a mesma conta para ambos os sites. Entre com o Google ou crie seu cadastro central para sincronizar todos os seus cálculos e rotações na nuvem sem duplicar senhas.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setActiveTab('login')}
          className="px-5 py-3 rounded-xl bg-gradient-to-r from-ametist-600 via-purple-600 to-amber-500 hover:from-ametist-500 hover:to-amber-400 text-white font-bold text-xs shadow-lg shadow-ametist-600/30 transition-all cursor-pointer whitespace-nowrap hover:scale-105 shrink-0"
        >
          Acessar Conta Unificada
        </button>
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
