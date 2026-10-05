import React, { useRef, useState } from 'react';
import { toPng, toBlob } from 'html-to-image';
import { 
  Download, 
  Copy, 
  Check, 
  Sparkles, 
  Edit3, 
  Eye, 
  RotateCcw, 
  Shield, 
  Layers, 
  Zap,
  Share2,
  Smartphone,
  Monitor
} from 'lucide-react';
import { InfographicCardData, InfographicCharacter } from '../types/infographic';
import { ElementType } from '../types/er';
import { CharacterAvatar } from './CharacterAvatar';

interface InfographicCardProps {
  data: InfographicCardData;
  onUpdateData?: (updated: InfographicCardData) => void;
  onCalculateER?: () => void;
  readOnly?: boolean;
}

const ELEMENT_COLORS: Record<ElementType, { bg: string; text: string; bar: string; border: string }> = {
  Pyro: { bg: 'rgba(239, 68, 68, 0.2)', text: '#f87171', bar: '#ef4444', border: 'rgba(239, 68, 68, 0.4)' },
  Hydro: { bg: 'rgba(14, 165, 233, 0.2)', text: '#38bdf8', bar: '#0284c7', border: 'rgba(14, 165, 233, 0.4)' },
  Anemo: { bg: 'rgba(20, 184, 166, 0.2)', text: '#2dd4bf', bar: '#14b8a6', border: 'rgba(20, 184, 166, 0.4)' },
  Electro: { bg: 'rgba(168, 85, 247, 0.2)', text: '#c084fc', bar: '#a855f7', border: 'rgba(168, 85, 247, 0.4)' },
  Dendro: { bg: 'rgba(34, 197, 94, 0.2)', text: '#4ade80', bar: '#22c55e', border: 'rgba(34, 197, 94, 0.4)' },
  Cryo: { bg: 'rgba(56, 189, 248, 0.2)', text: '#7dd3fc', bar: '#38bdf8', border: 'rgba(56, 189, 248, 0.4)' },
  Geo: { bg: 'rgba(245, 158, 11, 0.2)', text: '#fbbf24', bar: '#f59e0b', border: 'rgba(245, 158, 11, 0.4)' },
  None: { bg: 'rgba(148, 163, 184, 0.2)', text: '#cbd5e1', bar: '#94a3b8', border: 'rgba(148, 163, 184, 0.4)' }
};

export const InfographicCard: React.FC<InfographicCardProps> = ({
  data,
  onUpdateData,
  onCalculateER,
  readOnly = false
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isCopiedLink, setIsCopiedLink] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [cardOrientation, setCardOrientation] = useState<'landscape' | 'vertical'>('landscape');

  // Handle Export to PNG
  const handleExportPNG = async () => {
    if (!cardRef.current) return;
    try {
      setIsExporting(true);
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: cardOrientation === 'vertical' ? 3.0 : 2.5,
        backgroundColor: '#0a0f1d'
      });
      const link = document.createElement('a');
      link.download = `${data.carryArchetype.toLowerCase()}_${cardOrientation}_astralys.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export PNG:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Handle Copy Image to Clipboard
  const handleCopyClipboard = async () => {
    if (!cardRef.current) return;
    try {
      setIsExporting(true);
      const blob = await toBlob(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2.5,
        backgroundColor: '#0a0f1d'
      });
      if (blob && navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new window.ClipboardItem({ 'image/png': blob })
        ]);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2500);
      }
    } catch (err) {
      console.error('Failed to copy image to clipboard:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Handle Share URL Link
  const handleShareLink = () => {
    try {
      const json = JSON.stringify(data);
      const encoded = btoa(unescape(encodeURIComponent(json)));
      const shareUrl = `${window.location.origin}${window.location.pathname}#card=${encoded}`;
      navigator.clipboard.writeText(shareUrl);
      setIsCopiedLink(true);
      setTimeout(() => setIsCopiedLink(false), 2500);
    } catch (e) {
      console.error('Error generating share URL:', e);
    }
  };

  // Inline update helper
  const updateChar = (index: number, patch: Partial<InfographicCharacter>) => {
    if (!onUpdateData) return;
    const updatedChars = [...data.characters];
    updatedChars[index] = { ...updatedChars[index], ...patch };
    onUpdateData({ ...data, characters: updatedChars });
  };

  const updateRoot = (patch: Partial<InfographicCardData>) => {
    if (!onUpdateData) return;
    onUpdateData({ ...data, ...patch });
  };

  const isVertical = cardOrientation === 'vertical';

  return (
    <div className={`flex flex-col items-center gap-4 w-full mx-auto transition-all ${
      isVertical ? 'max-w-[430px]' : 'max-w-[620px]'
    }`}>
      
      {/* Action Toolbar */}
      {!readOnly && (
        <div className="flex items-center justify-between w-full px-2 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs flex-wrap gap-2">
          
          {/* Format Selector: 16:9 vs 9:16 */}
          <div className="flex items-center p-0.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-semibold">
            <button
              onClick={() => setCardOrientation('landscape')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                cardOrientation === 'landscape'
                  ? 'bg-ametist-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Formato Paisagem Padrão (Feed, Reddit, Discord)"
            >
              <Monitor className="w-3 h-3" />
              <span>16:9</span>
            </button>
            <button
              onClick={() => setCardOrientation('vertical')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                cardOrientation === 'vertical'
                  ? 'bg-ametist-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Formato Vertical 9:16 (Stories, TikTok, Reels, Shorts)"
            >
              <Smartphone className="w-3 h-3" />
              <span>9:16</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {onCalculateER && (
              <button
                onClick={onCalculateER}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-bold transition-all shadow-sm cursor-pointer"
                title="Abrir Calculadora de ER com os 4 heróis desta rotação"
              >
                <Zap className="w-3 h-3 text-amber-400" />
                <span>Simular ER</span>
              </button>
            )}

            <button
              onClick={handleShareLink}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-all cursor-pointer ${
                isCopiedLink
                  ? 'bg-emerald-600 text-white border-emerald-500'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
              }`}
              title="Copiar link direto para compartilhar este card"
            >
              {isCopiedLink ? <Check className="w-3 h-3 text-white" /> : <Share2 className="w-3 h-3" />}
              <span>{isCopiedLink ? 'Link Copiado!' : 'Compartilhar'}</span>
            </button>

            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                isEditing 
                  ? 'bg-ametist-600 text-white shadow-sm' 
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <Edit3 className="w-3 h-3" />
              {isEditing ? 'Concluir' : 'Editar'}
            </button>

            <button
              onClick={handleCopyClipboard}
              disabled={isExporting}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold transition-all cursor-pointer"
              title="Copiar imagem PNG para colar direto no Discord"
            >
              {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{isCopied ? 'Copiado!' : 'Copiar'}</span>
            </button>

            <button
              onClick={handleExportPNG}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-ametist-600 to-purple-600 text-white font-bold text-[11px] shadow-sm hover:shadow-ametist-glow transition-all cursor-pointer"
            >
              <Download className="w-3 h-3" />
              <span>{isExporting ? 'Renderizando...' : 'Baixar PNG'}</span>
            </button>
          </div>
        </div>
      )}

      {/* THE INFOGRAPHIC CARD (Dual Mode: Landscape or 9:16 Vertical) */}
      <div 
        ref={cardRef}
        className={`w-full bg-[#07131d] text-slate-100 rounded-3xl shadow-2xl border border-cyan-950/60 font-sans relative overflow-hidden select-none transition-all ${
          isVertical ? 'p-5 sm:p-6 min-h-[700px]' : 'p-6 sm:p-7'
        }`}
        style={{
          backgroundImage: 'radial-gradient(ellipse at 50% 0%, #0d283d 0%, #07131d 75%)'
        }}
      >
        {/* Subtle Ambient Vignette */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/30 pointer-events-none" />

        {/* 1. TOP HEADER: Carry Archetype & Investment */}
        <div className="relative text-center mb-5">
          {isEditing ? (
            <div className="space-y-2 max-w-md mx-auto">
              <input
                type="text"
                value={data.carryArchetype}
                onChange={(e) => updateRoot({ carryArchetype: e.target.value.toUpperCase() })}
                className="font-cinzel text-2xl font-bold tracking-widest text-center uppercase bg-slate-900/90 border border-ametist-500 rounded px-3 py-1 text-white w-full outline-none focus:ring-1 focus:ring-ametist-400"
                placeholder="ARQUÉTIPO / NOME DO CARRY"
              />
              <div className="flex items-center justify-center gap-2">
                <input
                  type="text"
                  value={data.investmentBadge ?? ''}
                  onChange={(e) => updateRoot({ investmentBadge: e.target.value })}
                  className="text-xs font-semibold tracking-wider text-amber-300 uppercase bg-slate-900/90 border border-amber-500/50 rounded px-2.5 py-1 outline-none text-center w-44"
                  placeholder="ex: KQM Investment, F2P..."
                  title="Badge de Investimento (ex: KQM Investment)"
                />
                <input
                  type="text"
                  value={data.statusTag ?? ''}
                  onChange={(e) => updateRoot({ statusTag: e.target.value })}
                  className="text-xs font-mono font-bold tracking-wider text-cyan-300 uppercase bg-slate-900/90 border border-cyan-500/50 rounded px-2.5 py-1 outline-none text-center w-36"
                  placeholder="ex: STC (V1 OF BETA)"
                  title="Status Tag (ex: STC)"
                />
              </div>
            </div>
          ) : (
            <>
              <h1 className="font-cinzel text-2xl sm:text-3xl font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-100 via-slate-100 to-ametist-300 uppercase drop-shadow-md">
                {data.carryArchetype}
              </h1>
              <div className="flex items-center justify-center gap-2 mt-1 flex-wrap">
                {data.investmentBadge && (
                  <span className="text-[11px] font-semibold tracking-wider text-amber-300/90 uppercase px-2 py-0.5 rounded-full bg-amber-950/40 border border-amber-500/30">
                    {data.investmentBadge}
                  </span>
                )}
                {data.statusTag && (
                  <span 
                    onClick={() => !readOnly && setIsEditing(true)}
                    className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/40 cursor-pointer hover:border-cyan-400 transition-colors"
                    title="STC = Subject to Change"
                  >
                    {data.statusTag}
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        {/* 9:16 VERTICAL PROMINENT METRICS PILL */}
        {isVertical && (
          <div className="mb-4 p-3 rounded-2xl bg-gradient-to-r from-slate-900/90 to-slate-950/90 border border-slate-800 flex items-center justify-around font-mono shadow-md">
            <div className="text-center">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">DPS da Equipe</span>
              <span className="text-lg font-black text-amber-400">{data.metrics.dps}</span>
            </div>
            <div className="w-px h-8 bg-slate-800" />
            <div className="text-center">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">DPR Total</span>
              <span className="text-lg font-black text-cyan-400">{data.metrics.dpr}</span>
            </div>
          </div>
        )}

        {/* 2. BODY: Dual Columns (Landscape) OR Vertical Stack (9:16) */}
        {isVertical ? (
          /* VERTICAL 9:16 STACK */
          <div className="space-y-3 mb-5">
            {data.characters.map((char, idx) => {
              const elemTheme = ELEMENT_COLORS[char.element] || ELEMENT_COLORS.None;
              const barWidth = Math.min(100, Math.max(2, char.damagePercentage));

              return (
                <div 
                  key={idx}
                  className="p-3 rounded-2xl bg-[#091522] border border-slate-800/80 space-y-2 shadow-sm"
                >
                  {/* Row 1: Character, Constellation, Share Bar */}
                  <div className="flex items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <CharacterAvatar name={char.name} element={char.element} size="sm" />
                      <div className="min-w-0 truncate">
                        <span className="text-amber-300/90 font-mono text-xs mr-1">{char.constellation}</span>
                        <span className="font-bold text-xs text-white truncate">{char.name}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                        <div 
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${barWidth}%`, backgroundColor: elemTheme.bar }}
                        />
                      </div>
                      <span className="font-mono font-bold text-xs text-cyan-400 w-10 text-right">
                        {char.damagePercentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Row 2: Equipment Sub-cards Side-by-Side */}
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="flex items-center justify-between gap-1 px-2 py-1 rounded-md bg-amber-950/30 border border-amber-800/40 truncate">
                      <span className="font-mono font-bold text-amber-300 flex-shrink-0">{char.weapon.refinement}</span>
                      <span className="font-medium text-slate-200 truncate">{char.weapon.name}</span>
                    </div>

                    <div className="flex items-center justify-between gap-1 px-2 py-1 rounded-md bg-cyan-950/40 border border-cyan-800/40 truncate">
                      <span className="font-medium text-slate-300 truncate">{char.artifact.setName}</span>
                      <span className="px-1 py-0.2 rounded bg-cyan-950 border border-cyan-600/50 text-[9px] font-mono font-bold text-cyan-300 flex-shrink-0">
                        {char.artifact.erTarget}
                      </span>
                    </div>
                  </div>

                  {/* Row 3: Main Stats */}
                  <div className="text-[9px] font-mono text-slate-400 text-center tracking-tight">
                    {char.mainStats}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* STANDARD LANDSCAPE DUAL COLUMNS (52% / 48%) */
          <div className="relative flex items-start gap-4 mb-6">
            
            {/* LEFT COLUMN: Damage Share (w-[52%]) */}
            <div className="w-[52%] min-w-0 pr-3 border-r border-slate-800/80 space-y-3.5">
              <div className="text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-2">
                Damage Share
              </div>

              {data.characters.map((char, idx) => {
                const elemTheme = ELEMENT_COLORS[char.element] || ELEMENT_COLORS.None;
                const barWidth = Math.min(100, Math.max(2, char.damagePercentage));

                return (
                  <div key={idx} className="flex items-center gap-2.5 min-w-0">
                    <div className="flex-shrink-0">
                      <CharacterAvatar 
                        name={char.name} 
                        element={char.element} 
                        size="md" 
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between text-xs mb-1 min-w-0">
                        {isEditing ? (
                          <div className="flex items-center gap-1 min-w-0 flex-1 mr-1">
                            <input
                              type="text"
                              value={char.constellation}
                              onChange={(e) => updateChar(idx, { constellation: e.target.value })}
                              className="w-7 px-1 py-0.5 rounded bg-slate-900 border border-amber-500/40 font-mono font-bold text-amber-300 text-[10px] text-center outline-none flex-shrink-0"
                              placeholder="C0"
                            />
                            <input
                              type="text"
                              value={char.name}
                              onChange={(e) => updateChar(idx, { name: e.target.value })}
                              className="flex-1 min-w-0 px-1 py-0.5 rounded bg-slate-900 border border-slate-700 font-bold text-slate-200 text-[11px] outline-none truncate"
                              placeholder="Nome"
                            />
                          </div>
                        ) : (
                          <span className="font-bold text-slate-200 truncate">
                            <span className="text-amber-300/90 font-mono mr-1">{char.constellation}</span>
                            {char.name}
                          </span>
                        )}

                        {isEditing ? (
                          <div className="flex items-center gap-0.5 flex-shrink-0">
                            <input
                              type="number"
                              step="0.1"
                              value={char.damagePercentage}
                              onChange={(e) => updateChar(idx, { damagePercentage: parseFloat(e.target.value) || 0 })}
                              className="w-11 px-1 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-100 font-mono text-[10px] font-bold text-right outline-none"
                            />
                            <span className="text-[10px] text-slate-400 font-mono">%</span>
                          </div>
                        ) : (
                          <span className="font-mono font-bold text-cyan-400 text-xs flex-shrink-0 ml-1">
                            {char.damagePercentage.toFixed(1)}%
                          </span>
                        )}
                      </div>

                      <div className="h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                        <div 
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${barWidth}%`,
                            backgroundColor: elemTheme.bar
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* RIGHT COLUMN: Equipment Builds (w-[48%]) */}
            <div className="w-[48%] min-w-0 pl-1 space-y-3.5">
              <div className="text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-2">
                Builds & Metas de ER
              </div>

              {data.characters.map((char, idx) => (
                <div key={idx} className="flex flex-col justify-center min-w-0 h-[48px] space-y-1">
                  {isEditing ? (
                    <div className="space-y-1">
                      <div className="grid grid-cols-2 gap-1">
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={char.weapon.refinement}
                            onChange={(e) => updateChar(idx, {
                              weapon: { ...char.weapon, refinement: e.target.value }
                            })}
                            className="w-6 px-1 py-0.5 rounded bg-slate-900 border border-amber-500/40 text-[9px] font-mono font-bold text-amber-300 text-center outline-none"
                          />
                          <input
                            type="text"
                            value={char.weapon.name}
                            onChange={(e) => updateChar(idx, {
                              weapon: { ...char.weapon, name: e.target.value }
                            })}
                            className="flex-1 min-w-0 px-1 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] text-slate-200 outline-none truncate"
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={char.artifact.setName}
                            onChange={(e) => updateChar(idx, {
                              artifact: { ...char.artifact, setName: e.target.value }
                            })}
                            className="flex-1 min-w-0 px-1 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] text-slate-200 outline-none truncate"
                          />
                          <input
                            type="text"
                            value={char.artifact.erTarget}
                            onChange={(e) => updateChar(idx, {
                              artifact: { ...char.artifact, erTarget: e.target.value }
                            })}
                            className="w-12 px-1 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-[9px] font-mono font-bold text-cyan-300 text-center outline-none"
                          />
                        </div>
                      </div>
                      <input
                        type="text"
                        value={char.mainStats}
                        onChange={(e) => updateChar(idx, { mainStats: e.target.value })}
                        className="w-full px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-[9px] font-mono text-slate-300 outline-none text-center"
                        placeholder="ATK / DMG / CRIT"
                      />
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-1.5">
                        <div className="flex items-center gap-1 px-1.5 py-1 rounded-md bg-amber-950/30 border border-amber-800/40 min-w-0 shadow-sm">
                          <span className="font-mono font-bold text-[9px] text-amber-300 flex-shrink-0">
                            {char.weapon.refinement}
                          </span>
                          <span className="text-[10px] font-medium text-slate-200 truncate flex-1" title={char.weapon.name}>
                            {char.weapon.name}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-1 px-1.5 py-1 rounded-md bg-cyan-950/40 border border-cyan-800/40 min-w-0 shadow-sm">
                          <span className="text-[10px] font-medium text-slate-300 truncate flex-1" title={char.artifact.setName}>
                            {char.artifact.setName}
                          </span>
                          <div className="flex items-center gap-0.5 px-1 py-0.2 rounded bg-cyan-950 border border-cyan-600/50 text-[9px] font-mono font-bold text-cyan-300 flex-shrink-0 shadow-sm">
                            <Zap className="w-2.5 h-2.5 text-cyan-400" />
                            <span>{char.artifact.erTarget}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-[9.5px] font-mono font-semibold text-slate-400 text-center tracking-tight truncate px-1">
                        {char.mainStats}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

          </div>
        )}

        {/* 3. FOOTER: Key Metrics & Rotation Sequence */}
        <div className="relative pt-3 border-t border-slate-800/80 text-center space-y-2">
          
          {/* DPS & DPR Large Numbers (in Landscape mode) */}
          {!isVertical && (
            <div className="flex items-center justify-center gap-3 font-mono font-black text-lg sm:text-xl tracking-tight">
              <span className="text-amber-400 drop-shadow-sm">
                DPS: {data.metrics.dps}
              </span>
              <span className="text-slate-600 font-normal">|</span>
              <span className="text-cyan-400 drop-shadow-sm">
                DPR: {data.metrics.dpr}
              </span>
            </div>
          )}

          {/* Rotation Notation */}
          <div className="text-xs text-slate-300 font-mono tracking-tight px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800/60 leading-relaxed text-center">
            {data.rotationNotation}
          </div>

          {/* Assumptions & Astralys Watermark */}
          {isEditing ? (
            <div className="flex items-center gap-2 pt-1 text-[10px] font-mono">
              <input
                type="text"
                value={data.assumptions || ''}
                onChange={(e) => updateRoot({ assumptions: e.target.value })}
                className="flex-1 bg-slate-900/90 border border-slate-700 rounded px-2 py-0.5 text-slate-200 outline-none"
                placeholder="Premissas"
              />
              <input
                type="text"
                value={data.watermark || 'ASTRALYS'}
                onChange={(e) => updateRoot({ watermark: e.target.value })}
                className="w-28 text-right bg-slate-900/90 border border-ametist-500/50 rounded px-2 py-0.5 text-ametist-400 font-bold outline-none uppercase"
                placeholder="ASTRALYS"
              />
            </div>
          ) : (
            <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1">
              <span>{data.assumptions || 'Assumes standard 5-star investment'}</span>
              <span className="font-bold text-ametist-400/90 tracking-widest uppercase">
                {data.watermark || 'ASTRALYS'}
              </span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
