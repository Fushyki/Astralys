import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Upload, 
  ClipboardPaste, 
  Sparkles, 
  Zap, 
  Layers, 
  Check, 
  AlertCircle,
  FileText,
  RotateCcw,
  Edit3
} from 'lucide-react';
import { InfographicCard } from './InfographicCard';
import { InfographicCardData, ERTransferPayload } from '../types/infographic';
import { PRESET_INFOGRAPHICS } from '../data/presetsInfographics';
import { parseSpreadsheetBuffer } from '../engines/spreadsheetParser';
import { parseRawTableText } from '../engines/rawTableParser';

interface InfographicGeneratorProps {
  erPayload: ERTransferPayload | null;
  onClearPayload: () => void;
  onOpenER: () => void;
  onSendTeamToER?: (characterNames: string[], rotationDuration?: number) => void;
  externalCardData?: InfographicCardData | null;
  onClearExternalCardData?: () => void;
}

export const InfographicGenerator: React.FC<InfographicGeneratorProps> = ({
  erPayload,
  onClearPayload,
  onOpenER,
  onSendTeamToER,
  externalCardData,
  onClearExternalCardData
}) => {
  const [cardData, setCardData] = useState<InfographicCardData>(PRESET_INFOGRAPHICS[0]);
  const [activeInputTab, setActiveInputTab] = useState<'excel' | 'paste' | 'presets'>('excel');
  const [detectedSheets, setDetectedSheets] = useState<string[]>([]);
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null);
  const [activeSheetName, setActiveSheetName] = useState<string>('');
  const [rawText, setRawText] = useState<string>('');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Automatically apply external card data when injected from Damage Analyzer
  useEffect(() => {
    if (externalCardData) {
      setCardData(externalCardData);
      setStatusMsg({
        type: 'success',
        text: `🔥 Rotação e DPS importados da Análise de Dano! [${externalCardData.carryArchetype} - DPS: ${externalCardData.metrics.dps}]`
      });
      setTimeout(() => setStatusMsg(null), 5000);
      onClearExternalCardData?.();
    }
  }, [externalCardData]);

  // Automatically apply ER targets when received from ER Calculator
  useEffect(() => {
    if (!erPayload || erPayload.targets.length === 0) return;

    setCardData(prev => {
      const updatedChars = [...prev.characters];
      erPayload.targets.forEach(t => {
        // Find matching character by name or slot
        const targetChar = updatedChars.find(c => c.name.toLowerCase() === t.characterName.toLowerCase()) || updatedChars[t.slotIndex];
        if (targetChar) {
          targetChar.artifact.erTarget = t.erTargetLabel;
        }
      });
      return { ...prev, characters: updatedChars };
    });

    const summary = erPayload.targets.map(t => `${t.characterName}: ${t.erTargetLabel}`).join(' • ');
    setStatusMsg({
      type: 'success',
      text: `⚡ Metas de Recarga sincronizadas com sucesso! [${summary}]`
    });
    setTimeout(() => setStatusMsg(null), 6000);
    onClearPayload();
  }, [erPayload]);

  // Handle Excel Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      setFileBuffer(buffer);
      const result = parseSpreadsheetBuffer(buffer);
      setDetectedSheets(result.sheets);
      setActiveSheetName(result.activeSheet);
      setCardData(result.data);
      setStatusMsg({ type: 'success', text: `Planilha carregada! Aba ativa: "${result.activeSheet}" (${result.sheets.length} abas encontradas)` });
    } catch (err: any) {
      console.error(err);
      setStatusMsg({ type: 'error', text: err?.message || 'Erro ao processar arquivo Excel.' });
    }
  };

  // Handle Sheet Change
  const handleSheetChange = (sheet: string) => {
    if (!fileBuffer) return;
    try {
      const result = parseSpreadsheetBuffer(fileBuffer, sheet);
      setActiveSheetName(sheet);
      setCardData(result.data);
      setStatusMsg({ type: 'success', text: `Aba "${sheet}" carregada no card!` });
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: `Erro ao ler aba "${sheet}".` });
    }
  };

  // Handle Raw Text Parse
  const handleParseRawText = () => {
    if (!rawText.trim()) return;
    try {
      const parsed = parseRawTableText(rawText);
      setCardData(parsed);
      setStatusMsg({ type: 'success', text: 'Tabela de rotação processada com sucesso!' });
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: 'Erro ao interpretar tabela de texto.' });
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Top Banner & Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 font-cinzel">
            <Sparkles className="w-5 h-5 text-ametist-400" />
            Gerador de Infográficos de Rotação
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Importe suas planilhas de cálculo (<code className="text-slate-200">.xlsx</code>), cole tabelas de print ou use os modelos prontos para gerar cards visuais de alta definição.
          </p>
        </div>

        {/* Quick Send Team to ER Calculator button */}
        {onSendTeamToER && (
          <button
            onClick={() => onSendTeamToER(cardData.characters.map(c => c.name), cardData.metrics.rotationDurationSeconds)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all shadow-sm flex-shrink-0 cursor-pointer"
            title="Abre a Calculadora de Recarga carregando estes 4 heróis e a duração desta rotação"
          >
            <Zap className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>⚡ Calcular ER desta Equipe</span>
          </button>
        )}
      </div>

      {/* Main Grid: Data Inputs on Left / Card on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Data Source Inputs (lg:col-span-5) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-5">
            
            {/* Input Mode Selector Tabs */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <button
                onClick={() => setActiveInputTab('excel')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg font-semibold transition-all ${
                  activeInputTab === 'excel'
                    ? 'bg-ametist-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Upload Excel
              </button>

              <button
                onClick={() => setActiveInputTab('paste')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg font-semibold transition-all ${
                  activeInputTab === 'paste'
                    ? 'bg-ametist-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ClipboardPaste className="w-3.5 h-3.5" />
                Colar Tabela
              </button>

              <button
                onClick={() => setActiveInputTab('presets')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg font-semibold transition-all ${
                  activeInputTab === 'presets'
                    ? 'bg-ametist-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Presets
              </button>
            </div>

            {/* TAB 1: EXCEL UPLOAD */}
            {activeInputTab === 'excel' && (
              <div className="space-y-4">
                <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-700 hover:border-ametist-500/60 rounded-xl cursor-pointer bg-slate-950/60 hover:bg-slate-950 transition-all group">
                  <Upload className="w-8 h-8 text-slate-400 group-hover:text-ametist-400 transition-colors mb-2" />
                  <span className="text-xs font-bold text-slate-200">Arraste seu arquivo .xlsx aqui</span>
                  <span className="text-[11px] text-slate-500 mt-0.5">ou clique para selecionar do computador</span>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>

                {/* Detected Sheets Selector */}
                {detectedSheets.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-ametist-400" />
                      Selecione a aba da planilha:
                    </span>
                    <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                      {detectedSheets.map(s => (
                        <button
                          key={s}
                          onClick={() => handleSheetChange(s)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                            activeSheetName === s
                              ? 'bg-ametist-600 text-white font-bold'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: RAW TEXT / TABLE PASTE */}
            {activeInputTab === 'paste' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Cole as linhas copiadas da sua planilha ou tabela:</span>
                  {rawText && (
                    <button
                      type="button"
                      onClick={() => setRawText('')}
                      className="text-[11px] text-slate-500 hover:text-rose-400 transition-colors"
                    >
                      Limpar
                    </button>
                  )}
                </div>

                <textarea
                  rows={9}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder={`Character    Damage    Percentage    Weapon    Artefact Set
Mavuika    4.157.702,28    94,64%    Blazing Suns    Obsidian
Citlali    144.709,93    3,29%    TTDS    Instructor
Iansan    64.814,53    1,48%    Engulfing    Cinder City
Bennett    25.902,67    0,59%    Aquila    Noblesse

DPR    4.393.129,41
DPS(17,5)    251.036
Q CccF cdF cdF cdF Combo`}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 outline-none focus:border-ametist-500 leading-relaxed placeholder:text-slate-600"
                />

                <button
                  onClick={handleParseRawText}
                  disabled={!rawText.trim()}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-1.5 ${
                    rawText.trim()
                      ? 'bg-gradient-to-r from-ametist-600 to-purple-600 hover:brightness-110 text-white cursor-pointer'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Interpretar Tabela e Gerar Card
                </button>
              </div>
            )}

            {/* TAB 3: PRESETS */}
            {activeInputTab === 'presets' && (
              <div className="space-y-2">
                <div className="text-xs text-slate-400 mb-2">Modelos pré-configurados da sua planilha:</div>
                <div className="grid grid-cols-1 gap-2">
                  {PRESET_INFOGRAPHICS.map(preset => (
                    <button
                      key={preset.carryArchetype}
                      onClick={() => setCardData(preset)}
                      className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                        cardData.carryArchetype === preset.carryArchetype
                          ? 'bg-ametist-950 border-ametist-500 text-white'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-xs">{preset.carryArchetype}</div>
                        <div className="text-[11px] text-slate-500">{preset.teamName} • DPS: {preset.metrics.dps}</div>
                      </div>
                      <span className="text-[11px] font-mono text-ametist-400 font-semibold">Carregar</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Header & Badges Customizer */}
            <div className="pt-3 border-t border-slate-800 space-y-3.5 text-xs">
              <div className="flex items-center justify-between text-slate-300 font-semibold">
                <span className="flex items-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                  Personalizar Títulos & Badges
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Edição Rápida</span>
              </div>

              {/* Carry Archetype Input */}
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400">Título / Arquétipo do Card:</label>
                <input
                  type="text"
                  value={cardData.carryArchetype}
                  onChange={(e) => setCardData({ ...cardData, carryArchetype: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 font-bold text-xs uppercase outline-none focus:border-ametist-500"
                  placeholder="ex: SANDRONE V1, MAVUIKA C0..."
                />
              </div>

              {/* Investment Badge Input + Quick Chips */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] text-slate-400">Badge de Investimento:</label>
                  <span className="text-[10px] text-amber-400/80 font-mono">Texto Livre</span>
                </div>
                <input
                  type="text"
                  value={cardData.investmentBadge || ''}
                  onChange={(e) => setCardData({ ...cardData, investmentBadge: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-amber-300 font-semibold text-xs outline-none focus:border-amber-500"
                  placeholder="ex: KQM Investment, F2P, C0R1..."
                />
                <div className="flex flex-wrap gap-1">
                  {['KQM Investment', 'F2P', 'Alto Investimento', 'C0R1', 'Médio Investimento'].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setCardData({ ...cardData, investmentBadge: chip })}
                      className="px-2 py-0.5 rounded text-[10px] bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
                    >
                      {chip}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setCardData({ ...cardData, investmentBadge: '' })}
                    className="px-2 py-0.5 rounded text-[10px] bg-rose-950/40 hover:bg-rose-950 text-rose-300 border border-rose-800/40 transition-colors"
                  >
                    Limpar
                  </button>
                </div>
              </div>

              {/* STC / Version Status Tag */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] text-slate-400">Tag de Status / Versão:</label>
                  <span className="text-[10px] text-cyan-400 font-mono" title="Subject to Change: Sujeito a Alterações">STC = Subject to Change</span>
                </div>
                <input
                  type="text"
                  value={cardData.statusTag || ''}
                  onChange={(e) => setCardData({ ...cardData, statusTag: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-cyan-300 font-mono text-xs outline-none focus:border-cyan-500"
                  placeholder="ex: STC (V1 OF BETA), META 6.7..."
                />
                <div className="flex flex-wrap gap-1">
                  {['STC (V1 OF BETA)', 'THEORY V1', 'META 6.7', 'OFICIAL LIVE'].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setCardData({ ...cardData, statusTag: tag })}
                      className="px-2 py-0.5 rounded text-[10px] bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
                    >
                      {tag}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setCardData({ ...cardData, statusTag: '' })}
                    className="px-2 py-0.5 rounded text-[10px] bg-rose-950/40 hover:bg-rose-950 text-rose-300 border border-rose-800/40 transition-colors"
                  >
                    Ocultar Tag
                  </button>
                </div>
              </div>
            </div>

            {/* Status Notifications */}
            {statusMsg && (
              <div className={`flex items-center gap-2 p-3 rounded-xl text-xs ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
              }`}>
                {statusMsg.type === 'success' ? <Check className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                <span>{statusMsg.text}</span>
              </div>
            )}

            {/* Link to ER Calculator */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Precisa calcular os alvos de recarga?</span>
              <button
                onClick={onOpenER}
                className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
              >
                <Zap className="w-3.5 h-3.5" />
                Abrir Calculadora ER
              </button>
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN: The Infographic Card Preview (lg:col-span-7) */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <InfographicCard 
            data={cardData} 
            onUpdateData={setCardData} 
            onCalculateER={onSendTeamToER ? () => onSendTeamToER(cardData.characters.map(c => c.name), cardData.metrics.rotationDurationSeconds) : undefined}
          />
        </div>

      </div>
    </div>
  );
};
