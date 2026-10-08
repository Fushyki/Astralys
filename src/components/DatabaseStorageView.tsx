import React, { useState, useEffect, useRef } from 'react';
import { 
  Database, 
  HardDrive, 
  CheckCircle2, 
  AlertTriangle, 
  Upload, 
  Download, 
  Copy, 
  Trash2, 
  ArrowRightLeft, 
  FileSpreadsheet, 
  Layers, 
  Swords, 
  Shield, 
  Clock, 
  ExternalLink, 
  Sparkles, 
  Info,
  Check,
  X,
  FileUp,
  RefreshCw
} from 'lucide-react';
import { 
  DatabaseSlot, 
  getDatabaseSlots, 
  saveDatabaseSlots, 
  getActiveSlotId, 
  setActiveSlotId, 
  calculateStorageStats, 
  duplicateSlot, 
  clearSlot, 
  updateSlotData,
  StorageGlobalStats 
} from '../services/storageManager';
import { exportSlotToExcel, parseExcelToSlotData, ExcelImportResult } from '../services/excelDatabaseEngine';
import { CalculationProject } from '../types/projectVault';
import { CharacterWeaponComparison } from '../types/weaponComparison';

interface DatabaseStorageViewProps {
  currentProjects: CalculationProject[];
  onProjectsChange: (projects: CalculationProject[]) => void;
  currentWeapons: Record<string, CharacterWeaponComparison>;
  onWeaponsChange: (weapons: Record<string, CharacterWeaponComparison>) => void;
}

export const DatabaseStorageView: React.FC<DatabaseStorageViewProps> = ({
  currentProjects,
  onProjectsChange,
  currentWeapons,
  onWeaponsChange
}) => {
  const [slots, setSlots] = useState<DatabaseSlot[]>(() => getDatabaseSlots(currentProjects, currentWeapons));
  const [activeSlotId, setActiveSlotIdState] = useState<string>(() => getActiveSlotId());
  const [storageStats, setStorageStats] = useState<StorageGlobalStats>(() => calculateStorageStats());

  // Feedback Notification State
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Modais de Ação
  const [deleteConfirmSlotId, setDeleteConfirmSlotId] = useState<string | null>(null);
  const [copySourceSlotId, setCopySourceSlotId] = useState<string | null>(null);
  const [copyTargetSlotId, setCopyTargetSlotId] = useState<string>('db_2');

  // Modal de Upload Excel
  const [excelTargetSlotId, setExcelTargetSlotId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importMode, setImportMode] = useState<'overwrite' | 'merge'>('overwrite');
  const [isProcessingFile, setIsProcessingFile] = useState<boolean>(false);
  const [filePreview, setFilePreview] = useState<ExcelImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (type: 'success' | 'error' | 'info', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Atualiza as estatísticas sempre que os slots mudam
  const refreshStorage = () => {
    const updatedSlots = getDatabaseSlots(currentProjects, currentWeapons);
    setSlots(updatedSlots);
    setStorageStats(calculateStorageStats());
  };

  useEffect(() => {
    refreshStorage();
  }, [currentProjects, currentWeapons]);

  // Alternar Base de Dados Ativa
  const handleSwitchActiveSlot = (slotId: string) => {
    if (slotId === activeSlotId) return;

    // 1. Salva o estado atual na base que está sendo desativada
    updateSlotData(activeSlotId, currentProjects, currentWeapons);

    // 2. Localiza a nova base selecionada
    const targetSlot = slots.find(s => s.id === slotId);
    if (!targetSlot) return;

    // 3. Define novo slot ativo
    setActiveSlotId(slotId);
    setActiveSlotIdState(slotId);

    // 4. Carrega os projetos e armas do novo slot para o estado global
    onProjectsChange(targetSlot.data.projects || []);
    onWeaponsChange(targetSlot.data.weaponComparisons || {});

    showToast('success', `Base ativa alterada para "${targetSlot.name}" com sucesso!`);
    refreshStorage();
  };

  // Copiar Slot
  const handleConfirmCopy = () => {
    if (!copySourceSlotId || !copyTargetSlotId || copySourceSlotId === copyTargetSlotId) {
      showToast('error', 'Selecione um slot de destino diferente da origem.');
      return;
    }

    const updated = duplicateSlot(copySourceSlotId, copyTargetSlotId);
    setSlots(updated);

    // Se o destino for a base ativa atual, sincroniza no estado
    if (copyTargetSlotId === activeSlotId) {
      const targetSlot = updated.find(s => s.id === copyTargetSlotId);
      if (targetSlot) {
        onProjectsChange(targetSlot.data.projects);
        onWeaponsChange(targetSlot.data.weaponComparisons);
      }
    }

    showToast('success', 'Base de dados duplicada com sucesso!');
    setCopySourceSlotId(null);
    refreshStorage();
  };

  // Excluir / Limpar Slot
  const handleConfirmDelete = () => {
    if (!deleteConfirmSlotId) return;

    const updated = clearSlot(deleteConfirmSlotId);
    setSlots(updated);

    // Se a base limpa for a base ativa, limpa os projetos atuais
    if (deleteConfirmSlotId === activeSlotId) {
      onProjectsChange([]);
      onWeaponsChange({});
    }

    showToast('info', 'Slot de base de dados redefinido e esvaziado.');
    setDeleteConfirmSlotId(null);
    refreshStorage();
  };

  // Exportar Excel
  const handleExportExcel = (slot: DatabaseSlot) => {
    try {
      exportSlotToExcel(slot);
      showToast('success', `Planilha Excel (.xlsx) exportada para "${slot.name}".`);
    } catch (e: any) {
      showToast('error', 'Falha ao exportar Excel: ' + (e.message || 'Erro desconhecido'));
    }
  };

  // Seleção de Arquivo Excel para Importação
  const handleSelectExcelFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsProcessingFile(true);
    setFilePreview(null);

    try {
      const parsed = await parseExcelToSlotData(file);
      setFilePreview(parsed);
      showToast('info', `Planilha pré-analisada: ${parsed.summary.teamsCount} equipes encontradas.`);
    } catch (err: any) {
      showToast('error', 'Erro ao ler planilha: ' + (err.message || 'Formato incompatível'));
      setSelectedFile(null);
    } finally {
      setIsProcessingFile(false);
    }
  };

  // Confirmar Importação de Excel no Slot
  const handleConfirmImportExcel = () => {
    if (!excelTargetSlotId || !filePreview) return;

    const targetSlot = slots.find(s => s.id === excelTargetSlotId);
    if (!targetSlot) return;

    let finalProjects: CalculationProject[] = [];
    let finalWeapons: Record<string, CharacterWeaponComparison> = {};

    if (importMode === 'overwrite') {
      finalProjects = filePreview.projects;
      finalWeapons = filePreview.weaponComparisons;
    } else {
      // Mesclar: adiciona mantendo existentes
      finalProjects = [...targetSlot.data.projects, ...filePreview.projects];
      finalWeapons = { ...targetSlot.data.weaponComparisons, ...filePreview.weaponComparisons };
    }

    const updated = updateSlotData(excelTargetSlotId, finalProjects, finalWeapons);
    setSlots(updated);

    // Se o slot for o ativo no momento, atualiza a aplicação imediatamente
    if (excelTargetSlotId === activeSlotId) {
      onProjectsChange(finalProjects);
      onWeaponsChange(finalWeapons);
    }

    showToast(
      'success',
      `Importação concluída! ${filePreview.summary.teamsCount} equipes adicionadas à ${targetSlot.name}.`
    );

    setExcelTargetSlotId(null);
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    refreshStorage();
  };

  // Cálculo de Gráfico de Rosca (Donut Chart SVG)
  const donutRadius = 40;
  const donutCircumference = 2 * Math.PI * donutRadius;
  const usedMB = (storageStats.totalUsedBytes / (1024 * 1024)).toFixed(2);
  const maxMB = (storageStats.maxBytes / (1024 * 1024)).toFixed(2);

  return (
    <div className="space-y-6">

      {/* Feedback Toast */}
      {feedback && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl text-xs font-mono font-bold animate-fade-in backdrop-blur-md border ${
          feedback.type === 'success' 
            ? 'bg-slate-900/95 border-emerald-500/60 text-emerald-300'
            : feedback.type === 'error'
              ? 'bg-slate-900/95 border-rose-500/60 text-rose-300'
              : 'bg-slate-900/95 border-cyan-500/60 text-cyan-300'
        }`}>
          {feedback.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          {feedback.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-400" />}
          {feedback.type === 'info' && <Info className="w-4 h-4 text-cyan-400" />}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* 1. HEADER & INDICADOR DE ARMAZENAMENTO (Estilo Genshin Optimizer) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Card Superior Esquerdo: Configurações & Suporte */}
        <div className="lg:col-span-6 p-5 sm:p-6 rounded-3xl bg-[#090e17] border border-slate-800 flex flex-col justify-between space-y-4 shadow-xl">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                <Database className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-cinzel">
                Bases de Dados & Armazenamento
              </h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              O Astralys permite alternar entre múltiplos slots de banco de dados locais. Cada base possui suas próprias equipes, rotações, artefatos e comparativos de armas com suporte nativo a importação e exportação de planilhas Excel (<code className="text-cyan-300 font-mono">.xlsx</code>).
            </p>
          </div>

          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-2 text-xs font-mono text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Base Ativa: <strong className="text-emerald-300">{slots.find(s => s.id === activeSlotId)?.name || 'Database 1'}</strong></span>
            </div>

            <button
              type="button"
              onClick={refreshStorage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer text-xs"
              title="Recalcular espaço e atualizar métricas"
            >
              <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
              <span>Sincronizar Slots</span>
            </button>
          </div>
        </div>

        {/* Card Superior Direito: Donut Chart de Armazenamento */}
        <div className="lg:col-span-6 p-5 sm:p-6 rounded-3xl bg-[#090e17] border border-slate-800 shadow-xl flex flex-col sm:flex-row items-center gap-6">
          
          {/* SVG Donut Chart */}
          <div className="relative w-32 h-32 flex-shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              {/* Círculo de fundo */}
              <circle
                cx="50"
                cy="50"
                r={donutRadius}
                fill="transparent"
                stroke="#1e293b"
                strokeWidth="12"
              />
              {/* Anel de Progresso Usado */}
              <circle
                cx="50"
                cy="50"
                r={donutRadius}
                fill="transparent"
                stroke="#06b6d4"
                strokeWidth="12"
                strokeDasharray={`${(storageStats.percentUsed / 100) * donutCircumference} ${donutCircumference}`}
                strokeDashoffset="0"
                strokeLinecap="round"
                className="transition-all duration-500 ease-out"
              />
            </svg>

            {/* Texto Central da Rosca */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-base font-black text-white font-mono leading-none">
                {storageStats.percentUsed}%
              </span>
              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-mono mt-1 font-bold">
                Ocupado
              </span>
            </div>
          </div>

          {/* Detalhamento de Uso Lateral */}
          <div className="flex-1 space-y-2.5 w-full">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400 font-bold flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
                <span>Espaço Local Storage:</span>
              </span>
              <span className="text-slate-200 font-bold">
                <strong className="text-cyan-300">{usedMB} MB</strong> / {maxMB} MB
              </span>
            </div>

            {/* Lista com cores de cada Database */}
            <div className="space-y-1.5 pt-1">
              {storageStats.slotsUsage.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-[11px] font-mono">
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                    <span className={`truncate ${item.isActive ? 'font-bold text-emerald-300' : 'text-slate-400'}`}>
                      {item.name} {item.isActive && '(Ativa)'}
                    </span>
                  </div>
                  <span className="text-slate-400 flex-shrink-0">
                    {(item.sizeBytes / 1024).toFixed(1)} KB ({item.percent}%)
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* 2. GRID DE SLOTS DE BASES DE DADOS (Database Cards) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Slots de Bancos de Dados Disponíveis ({slots.length})</span>
          </h4>
          <span className="text-[11px] text-slate-500 font-mono">
            Alterne entre bases com 1 clique
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {slots.map((slot) => {
            const isActive = slot.id === activeSlotId;

            return (
              <div
                key={slot.id}
                className={`p-5 rounded-2xl border transition-all duration-200 space-y-4 relative ${
                  isActive
                    ? 'bg-gradient-to-b from-[#091520] to-[#0a101b] border-emerald-500/60 shadow-xl shadow-emerald-950/20 ring-1 ring-emerald-500/40'
                    : 'bg-[#090d16] border-slate-800 hover:border-slate-700/80 shadow-md'
                }`}
              >
                {/* Header do Card */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div 
                      className="w-9 h-9 rounded-xl flex items-center justify-center font-bold font-mono text-xs shadow-sm flex-shrink-0"
                      style={{ backgroundColor: `${slot.color}20`, border: `1px solid ${slot.color}60`, color: slot.color }}
                    >
                      {slot.id.replace('db_', '#')}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="font-bold text-sm text-white font-sans">
                          {slot.name}
                        </h5>
                        {isActive && (
                          <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            Base de Dados Atual
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {slot.description}
                      </p>
                    </div>
                  </div>

                  {/* Botão Mudar (se inativo) */}
                  {!isActive && (
                    <button
                      type="button"
                      onClick={() => handleSwitchActiveSlot(slot.id)}
                      className="px-3.5 py-1.5 rounded-xl font-bold text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-all cursor-pointer shadow-sm hover:scale-105"
                      title="Ativar esta base de dados"
                    >
                      Mudar
                    </button>
                  )}
                </div>

                {/* Métricas e Contadores Rápidos do Slot */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 font-mono text-center">
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase block">Personagens</span>
                    <strong className="text-xs text-slate-200">{slot.stats.characters}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase block">Equipes</span>
                    <strong className="text-xs text-cyan-300">{slot.stats.teams}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase block">Artefatos</span>
                    <strong className="text-xs text-amber-300">{slot.stats.artifacts}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase block">Armas</span>
                    <strong className="text-xs text-purple-300">{slot.stats.weapons}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase block">Rotações</span>
                    <strong className="text-xs text-emerald-300">{slot.stats.rotations}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase block">Tamanho</span>
                    <strong className="text-xs text-slate-400">{(slot.stats.sizeBytes / 1024).toFixed(0)}k</strong>
                  </div>
                </div>

                {/* Rodapé com Ações do Card */}
                <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-800/80 text-xs font-mono">
                  <div className="text-[10px] text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Modificado: {new Date(slot.lastModified).toLocaleDateString('pt-BR')}</span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Botão Copiar */}
                    <button
                      type="button"
                      onClick={() => {
                        setCopySourceSlotId(slot.id);
                        setCopyTargetSlotId(slots.find(s => s.id !== slot.id)?.id || 'db_2');
                      }}
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                      title="Copiar dados desta base para outro slot"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    {/* Botão Upload Excel */}
                    <button
                      type="button"
                      onClick={() => {
                        setExcelTargetSlotId(slot.id);
                        setSelectedFile(null);
                        setFilePreview(null);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-cyan-950 text-cyan-300 border border-slate-700 hover:border-cyan-500/40 transition-colors cursor-pointer"
                      title="Importar planilha Excel (.xlsx) neste slot"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload</span>
                    </button>

                    {/* Botão Download Excel */}
                    <button
                      type="button"
                      onClick={() => handleExportExcel(slot)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-emerald-950 text-emerald-300 border border-slate-700 hover:border-emerald-500/40 transition-colors cursor-pointer"
                      title="Exportar base completa para Excel (.xlsx)"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Excel</span>
                    </button>

                    {/* Botão Excluir / Limpar Slot */}
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmSlotId(slot.id)}
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 transition-colors cursor-pointer"
                      title="Limpar todos os dados deste slot"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* 3. MODAL: UPLOAD DE EXCEL (.xlsx / .csv) COM DROPZONE & PRÉ-VISUALIZAÇÃO */}
      {excelTargetSlotId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xl p-6 rounded-3xl bg-[#0a0f1d] border border-cyan-500/40 shadow-2xl space-y-5 animate-scale-up">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-cyan-400">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Importar Planilha Excel (.xlsx)</h4>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Destino: {slots.find(s => s.id === excelTargetSlotId)?.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setExcelTargetSlotId(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dropzone do Arquivo */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="p-6 rounded-2xl border-2 border-dashed border-slate-700 hover:border-cyan-400 bg-slate-950/60 hover:bg-slate-900/60 transition-all cursor-pointer text-center space-y-3"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleSelectExcelFile}
                className="hidden"
              />
              <FileUp className="w-8 h-8 text-cyan-400 mx-auto" />
              <div>
                <p className="text-xs font-bold text-white">
                  {selectedFile ? selectedFile.name : 'Clique para selecionar ou arraste o arquivo .xlsx'}
                </p>
                <p className="text-[11px] text-slate-400 font-mono mt-1">
                  Suporta planilhas multi-aba com abas: Equipes, Personagens, Armas e Rotações.
                </p>
              </div>
            </div>

            {/* Pré-Visualização das Abas Reconhecidas */}
            {filePreview && (
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 font-mono text-xs">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  Resumo dos Dados Identificados:
                </span>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Equipes</span>
                    <strong className="text-cyan-300 font-bold">{filePreview.summary.teamsCount}</strong>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Personagens</span>
                    <strong className="text-amber-300 font-bold">{filePreview.summary.charactersCount}</strong>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Armas</span>
                    <strong className="text-purple-300 font-bold">{filePreview.summary.weaponsCount}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Opções de Importação: Substituir vs Mesclar */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider block">
                Modo de Gravação no Slot:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setImportMode('overwrite')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    importMode === 'overwrite'
                      ? 'bg-rose-950/60 border-rose-500 text-white ring-1 ring-rose-500'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <strong className="text-xs block text-rose-300">Substituir Slot</strong>
                  <span className="text-[10px] text-slate-400 mt-0.5 block leading-tight">
                    Substitui todas as equipes antigas pelos dados da planilha.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setImportMode('merge')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    importMode === 'merge'
                      ? 'bg-cyan-950/60 border-cyan-500 text-white ring-1 ring-cyan-500'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <strong className="text-xs block text-cyan-300">Mesclar / Atualizar</strong>
                  <span className="text-[10px] text-slate-400 mt-0.5 block leading-tight">
                    Mantém as equipes atuais e adiciona as novas da planilha.
                  </span>
                </button>
              </div>
            </div>

            {/* Botões de Ação do Modal */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setExcelTargetSlotId(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!filePreview || isProcessingFile}
                onClick={handleConfirmImportExcel}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-lg shadow-cyan-600/30 flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Confirmar Importação</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 4. MODAL: CONFIRMAÇÃO DE CÓPIA ENTRE SLOTS */}
      {copySourceSlotId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md p-6 rounded-3xl bg-[#0a0f1d] border border-cyan-500/40 shadow-2xl space-y-4">
            <h4 className="font-bold text-white text-sm">Duplicar Base de Dados</h4>
            <p className="text-xs text-slate-400">
              Selecione o slot de destino onde deseja colar a cópia de <strong>{slots.find(s => s.id === copySourceSlotId)?.name}</strong>:
            </p>

            <div className="space-y-2">
              {slots.filter(s => s.id !== copySourceSlotId).map(s => (
                <label 
                  key={s.id}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                    copyTargetSlotId === s.id
                      ? 'bg-cyan-950/60 border-cyan-500 text-white'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400'
                  }`}
                >
                  <span className="text-xs font-bold font-mono">{s.name} ({s.stats.teams} equipes)</span>
                  <input
                    type="radio"
                    name="copyTarget"
                    checked={copyTargetSlotId === s.id}
                    onChange={() => setCopyTargetSlotId(s.id)}
                    className="accent-cyan-400"
                  />
                </label>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setCopySourceSlotId(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmCopy}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 cursor-pointer shadow-md"
              >
                Duplicar Agora
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL: CONFIRMAÇÃO DE EXCLUSÃO DE SLOT */}
      {deleteConfirmSlotId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md p-6 rounded-3xl bg-[#0a0f1d] border border-rose-500/50 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              <h4 className="font-bold text-white text-sm">Limpar Base de Dados?</h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Você está prestes a apagar todas as equipes, personagens e armas de <strong>{slots.find(s => s.id === deleteConfirmSlotId)?.name}</strong>. Esta ação não poderá ser desfeita localmente.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDeleteConfirmSlotId(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 cursor-pointer shadow-md shadow-rose-600/30"
              >
                Sim, Limpar Base
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
