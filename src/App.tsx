import React, { useState, useEffect } from 'react';
import { Header, ActiveTab } from './components/Header';
import { LandingPage } from './components/LandingPage';
import { InfographicGenerator } from './components/InfographicGenerator';
import { ERCalculator } from './components/ERCalculator';
import { DamageAnalyzer } from './components/DamageAnalyzer';
import { WeaponComparator } from './components/WeaponComparator';
import { DashboardsPage } from './components/DashboardsPage';
import { ProjectVault } from './components/ProjectVault';
import { LoginPage } from './components/LoginPage';
import { ProfilePage } from './components/ProfilePage';
import { AuthModal } from './components/AuthModal';
import { AuthProvider, useAuth } from './context/AuthContext';
import { fetchCloudProjects, saveCloudProject, deleteCloudProject, syncLocalProjectsWithCloud } from './services/projectApi';
import { ERTransferPayload, InfographicCardData } from './types/infographic';
import { CharacterWeaponComparison, WeaponOption } from './types/weaponComparison';
import { CalculationProject } from './types/projectVault';
import { DEFAULT_CALCULATION_PROJECTS, PLACEHOLDER_PROJECT } from './data/defaultProjects';
import { CHARACTERS_DATABASE } from './data/characters';
import { getWeaponData } from './data/weapons';
import { DamageAnalysisResult } from './types/damageBreakdown';
import { generateTimelineFromDamageResult } from './engines/timelineEngine';
import { generateScenariosFromCalculation } from './engines/scenarioEngine';

export { type ActiveTab };

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('landing');
  const [erPayload, setErPayload] = useState<ERTransferPayload | null>(null);
  const [teamForER, setTeamForER] = useState<{
    characterNames: string[];
    rotationDuration?: number;
  } | null>(null);
  const [cardDataFromDamage, setCardDataFromDamage] = useState<InfographicCardData | null>(null);
  const [calcForAnalyzer, setCalcForAnalyzer] = useState<DamageAnalysisResult | null>(null);

  const { isAuthenticated, user, setSyncStatus } = useAuth();

  // Calculation Projects State (Astralys Vault & Dashboards)
  const [projects, setProjects] = useState<CalculationProject[]>(() => {
    try {
      const saved = localStorage.getItem('astralys_saved_projects');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Filtra times padrão hardcoded caso o usuário não tenha criado projetos próprios ainda
          const userOnly = parsed.filter(p => !p.id.startsWith('proj-mavuika') && !p.id.startsWith('proj-flins'));
          if (userOnly.length > 0) return userOnly;
        }
      }
    } catch (e) {
      console.warn('Failed to load projects from localStorage:', e);
    }
    return [PLACEHOLDER_PROJECT];
  });

  const [activeProjectId, setActiveProjectId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('astralys_saved_projects');
      if (saved) {
        const parsed = JSON.parse(saved);
        const userOnly = parsed.filter((p: any) => !p.id.startsWith('proj-mavuika') && !p.id.startsWith('proj-flins'));
        if (userOnly.length > 0) return userOnly[0].id;
      }
    } catch {}
    return PLACEHOLDER_PROJECT.id;
  });

  React.useEffect(() => {
    try {
      localStorage.setItem('astralys_saved_projects', JSON.stringify(projects));
    } catch (e) {
      console.warn('Failed to save projects to localStorage:', e);
    }
  }, [projects]);

  // Sincronização automática com a nuvem quando o usuário estiver autenticado no SSO
  useEffect(() => {
    if (isAuthenticated && user) {
      let isMounted = true;
      const loadCloud = async () => {
        try {
          setSyncStatus('syncing');
          const cloudProjects = await fetchCloudProjects();
          if (isMounted) {
            if (cloudProjects.length > 0) {
              setProjects(prev => {
                const map = new Map<string, CalculationProject>();
                prev.forEach(p => map.set(p.id, p));
                cloudProjects.forEach(cp => map.set(cp.id, cp));
                return Array.from(map.values());
              });
            } else if (projects.length > 0) {
              await syncLocalProjectsWithCloud(projects);
            }
            setSyncStatus('synced');
          }
        } catch (e) {
          if (isMounted) {
            console.warn('Erro ao sincronizar projetos da nuvem:', e);
            setSyncStatus('error');
          }
        }
      };
      loadCloud();
      return () => {
        isMounted = false;
      };
    }
  }, [isAuthenticated, user?.id]);

  // Weapon Comparisons State (empty by default until user decides to add from Damage Analyzer)
  const [weaponComparisons, setWeaponComparisons] = useState<Record<string, CharacterWeaponComparison>>(() => {
    try {
      const saved = localStorage.getItem('astralys_weapon_comparisons');
      if (!saved) return {};
      const parsed = JSON.parse(saved) as Record<string, CharacterWeaponComparison>;
      
      // Auto-sanitize saved comparisons: strictly filter out weapons that do not match the character's weapon type
      Object.keys(parsed).forEach(charName => {
        const charInfo = CHARACTERS_DATABASE.find(c => c.name.toLowerCase() === charName.toLowerCase());
        if (charInfo && charInfo.weapon && charInfo.weapon !== 'None') {
          const expectedType = charInfo.weapon;
          const filteredWeapons = (parsed[charName].weapons || []).filter(w => {
            const lookup = getWeaponData(w.name);
            return !lookup || lookup.type === expectedType;
          });
          parsed[charName].weapons = filteredWeapons;
          if (filteredWeapons.length > 0) {
            const baseDpr = filteredWeapons[0].dpr || 1;
            filteredWeapons.forEach(w => {
              w.percentageOfBaseline = parseFloat(((w.dpr / baseDpr) * 100).toFixed(1));
            });
            parsed[charName].baselineWeaponId = filteredWeapons[0].id;
          }
        }
      });
      return parsed;
    } catch {
      return {};
    }
  });

  // Save to localStorage
  React.useEffect(() => {
    try {
      localStorage.setItem('astralys_weapon_comparisons', JSON.stringify(weaponComparisons));
    } catch (e) {
      console.warn('Failed to save weapon comparisons:', e);
    }
  }, [weaponComparisons]);

  const handleAddWeaponToComparison = (
    charName: string,
    weaponData: {
      name: string;
      refinement?: string;
      dpr: number;
      dps: number;
      rarity?: 3 | 4 | 5;
      notes?: string;
      subStatType?: WeaponOption['subStatType'];
      subStatValue?: number;
      baseAtk?: number;
    },
    rotationDuration?: number,
    carryArchetype?: string
  ) => {
    const charInfo = CHARACTERS_DATABASE.find(c => c.name.toLowerCase() === charName.toLowerCase());
    const cleanName = weaponData.name.trim();
    const weaponLookup = getWeaponData(cleanName);

    // Enforce Weapon Type: A character can strictly equip only weapons of their weapon type (e.g. Mavuika only Claymores)
    if (charInfo && charInfo.weapon && charInfo.weapon !== 'None' && weaponLookup && weaponLookup.type !== charInfo.weapon) {
      console.warn(`[Astralys] Tipo de arma incompatível: ${charName} (${charInfo.weapon}) não pode equipar ${weaponLookup.name} (${weaponLookup.type}).`);
      return;
    }

    setWeaponComparisons(prev => {
      const existing = prev[charName];
      const ref = weaponData.refinement || 'R1';
      const finalName = weaponLookup?.name || cleanName;
      const weaponId = `w-${charName.toLowerCase()}-${finalName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${ref}`;

      const newOption: WeaponOption = {
        id: weaponId,
        name: finalName,
        refinement: ref,
        rarity: weaponData.rarity || weaponLookup?.rarity || 5,
        baseAtk: weaponData.baseAtk || weaponLookup?.baseAtk || 510,
        subStatType: weaponData.subStatType || weaponLookup?.subStatType || 'CR',
        subStatValue: weaponData.subStatValue || weaponLookup?.subStatValue || 27.6,
        passiveEffect: weaponLookup?.passiveEffect || 'Cálculo de Rotação (Análise de Dano)',
        dpr: Math.round(weaponData.dpr),
        dps: Math.round(weaponData.dps),
        percentageOfBaseline: 100,
        isBaseline: false,
        notes: weaponData.notes || 'Calculado via Análise de Dano'
      };

      if (!existing || existing.weapons.length === 0) {
        newOption.isBaseline = true;
        return {
          ...prev,
          [charName]: {
            characterName: charName,
            characterElement: charInfo?.element || 'Pyro',
            carryArchetype: carryArchetype || `${charName.toUpperCase()} WEAPON SHOWDOWN`,
            baselineWeaponId: weaponId,
            rotationDuration: rotationDuration || 20,
            weapons: [newOption]
          }
        };
      }

      // Filter out existing weapon with same name and refinement
      const filtered = existing.weapons.filter(w => !(w.name.toLowerCase() === cleanName.toLowerCase() && w.refinement === ref));
      const updatedWeapons = [...filtered, newOption];

      // Maintain or assign baseline
      let baseline = updatedWeapons.find(w => w.id === existing.baselineWeaponId);
      if (!baseline) {
        baseline = updatedWeapons[0];
      }
      baseline.isBaseline = true;
      const baseDpr = baseline.dpr || 1;

      updatedWeapons.forEach(w => {
        w.percentageOfBaseline = parseFloat(((w.dpr / baseDpr) * 100).toFixed(1));
        w.isBaseline = w.id === baseline!.id;
      });

      updatedWeapons.sort((a, b) => b.dpr - a.dpr);

      return {
        ...prev,
        [charName]: {
          ...existing,
          rotationDuration: rotationDuration || existing.rotationDuration,
          baselineWeaponId: baseline.id,
          weapons: updatedWeapons
        }
      };
    });
  };

  const handleRemoveWeaponFromComparison = (charName: string, weaponId: string) => {
    setWeaponComparisons(prev => {
      const existing = prev[charName];
      if (!existing) return prev;

      const remaining = existing.weapons.filter(w => w.id !== weaponId);
      if (remaining.length === 0) {
        const copy = { ...prev };
        delete copy[charName];
        return copy;
      }

      let baseline = remaining.find(w => w.id === existing.baselineWeaponId) || remaining[0];
      baseline.isBaseline = true;
      const baseDpr = baseline.dpr || 1;

      remaining.forEach(w => {
        w.percentageOfBaseline = parseFloat(((w.dpr / baseDpr) * 100).toFixed(1));
        w.isBaseline = w.id === baseline!.id;
      });
      remaining.sort((a, b) => b.dpr - a.dpr);

      return {
        ...prev,
        [charName]: {
          ...existing,
          baselineWeaponId: baseline.id,
          weapons: remaining
        }
      };
    });
  };

  const handleAddMultipleVariantsToComparison = (variants: DamageAnalysisResult[]) => {
    if (!variants || variants.length === 0) return;
    const carry = variants[0].characters[0];
    if (!carry) return;
    const carryName = carry.name;
    const charInfo = CHARACTERS_DATABASE.find(c => c.name.toLowerCase() === carryName.toLowerCase());
    const expectedType = charInfo?.weapon;

    // Filter variants to only include weapons compatible with carry weapon type
    const validVariants = variants.filter(v => {
      const char = v.characters[0];
      const cleanWeaponName = char?.weapon;
      if (!cleanWeaponName) return true;
      const lookup = getWeaponData(cleanWeaponName);
      return !lookup || !expectedType || expectedType === 'None' || lookup.type === expectedType;
    });

    if (validVariants.length === 0) return;

    const newWeapons: WeaponOption[] = validVariants.map((v, idx) => {
      const char = v.characters[0];
      const cleanWeaponName = char?.weapon || `Arma ${idx + 1}`;
      const weaponLookup = getWeaponData(cleanWeaponName);
      const finalName = weaponLookup?.name || cleanWeaponName;
      const weaponId = `w-${carryName.toLowerCase()}-${finalName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${idx}`;

      return {
        id: weaponId,
        name: finalName,
        refinement: 'R1',
        rarity: weaponLookup?.rarity || 5,
        baseAtk: weaponLookup?.baseAtk || 510,
        subStatType: weaponLookup?.subStatType || 'CR',
        subStatValue: weaponLookup?.subStatValue || 27.6,
        passiveEffect: weaponLookup?.passiveEffect || 'Importado de Planilha de Cálculos',
        dpr: v.totalDpr,
        dps: v.dps,
        percentageOfBaseline: 100,
        isBaseline: idx === 0,
        notes: v.variantLabel || `Variante ${idx + 1}`
      };
    });

    const baseline = newWeapons[0];
    const baseDpr = baseline.dpr || 1;
    newWeapons.forEach(w => {
      w.percentageOfBaseline = parseFloat(((w.dpr / baseDpr) * 100).toFixed(1));
      w.isBaseline = w.id === baseline.id;
    });
    newWeapons.sort((a, b) => b.dpr - a.dpr);

    setWeaponComparisons(prev => ({
      ...prev,
      [carryName]: {
        characterName: carryName,
        characterElement: charInfo?.element || 'Pyro',
        carryArchetype: `${carryName.toUpperCase()} WEAPON SHOWDOWN`,
        baselineWeaponId: baseline.id,
        rotationDuration: variants[0].rotationDuration || 20,
        weapons: newWeapons
      }
    }));
  };

  const handleClearComparisons = (charName?: string) => {
    if (charName) {
      setWeaponComparisons(prev => {
        const copy = { ...prev };
        delete copy[charName];
        return copy;
      });
    } else {
      setWeaponComparisons({});
    }
  };

  // Check URL hash for shared card (#card=...)
  React.useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash && hash.startsWith('#card=')) {
        try {
          const encoded = hash.replace('#card=', '');
          const json = decodeURIComponent(escape(atob(encoded)));
          const parsed = JSON.parse(json);
          if (parsed.characters && parsed.carryArchetype) {
            setCardDataFromDamage(parsed);
            setActiveTab('generator');
          }
        } catch (e) {
          console.warn('Could not load card from URL hash:', e);
        }
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const handleTransferER = (payload: ERTransferPayload) => {
    setErPayload(payload);
    setActiveTab('generator');
  };

  const handleSendTeamToER = (characterNames: string[], rotationDuration?: number) => {
    setTeamForER({ characterNames, rotationDuration });
    setActiveTab('er');
  };

  const handleExportDamageToCard = (cardData: InfographicCardData) => {
    setCardDataFromDamage(cardData);
    setActiveTab('generator');
  };

  const currentProject = projects.find(p => p.id === activeProjectId) || projects[0] || PLACEHOLDER_PROJECT;

  const handleSelectProject = (project: CalculationProject) => {
    setActiveProjectId(project.id);
    setActiveTab('dashboards');
  };

  const handleSaveProject = (project: CalculationProject) => {
    setProjects(prev => {
      const idx = prev.findIndex(p => p.id === project.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = project;
        return copy;
      }
      return [project, ...prev];
    });

    if (isAuthenticated) {
      saveCloudProject(project).catch(err => {
        console.warn('Falha ao sincronizar salvamento na nuvem:', err);
      });
    }
  };

  const handleDeleteProject = (projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
    if (activeProjectId === projectId) {
      const remaining = projects.filter(p => p.id !== projectId);
      if (remaining.length > 0) {
        setActiveProjectId(remaining[0].id);
      }
    }
    if (isAuthenticated) {
      deleteCloudProject(projectId).catch(err => {
        console.warn('Falha ao excluir projeto na nuvem:', err);
      });
    }
  };

  const handleDuplicateProject = (project: CalculationProject) => {
    const duplicated: CalculationProject = {
      ...project,
      id: `proj-${Date.now()}`,
      title: `${project.title} (Cópia)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setProjects(prev => [duplicated, ...prev]);
    setActiveProjectId(duplicated.id);

    if (isAuthenticated) {
      saveCloudProject(duplicated).catch(err => {
        console.warn('Falha ao salvar duplicata na nuvem:', err);
      });
    }
  };

  const handleRestoreDefaultProjects = () => {
    setProjects(DEFAULT_CALCULATION_PROJECTS);
    setActiveProjectId(DEFAULT_CALCULATION_PROJECTS[0].id);
  };

  const handleSaveCalculationToVault = (calc: DamageAnalysisResult) => {
    const carry = calc.characters[0]?.name || 'Personagem';
    const newProj: CalculationProject = {
      id: `proj-${Date.now()}`,
      title: calc.title || `${carry} - Rotação de Combate`,
      description: `Importado em ${new Date().toLocaleDateString('pt-BR')} com ${calc.characters.length} personagens.`,
      carryName: carry,
      teamNames: calc.characters.map(c => c.name),
      totalDpr: calc.totalDpr,
      dps: calc.dps,
      rotationDuration: calc.rotationDuration,
      comboNotation: calc.comboNotation,
      tags: [carry, 'Personalizado', `${calc.rotationDuration}s`],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      calculation: calc,
      timeline: generateTimelineFromDamageResult(calc),
      scenarios: generateScenariosFromCalculation(calc)
    };
    setProjects(prev => [newProj, ...prev]);
    setActiveProjectId(newProj.id);

    if (isAuthenticated) {
      saveCloudProject(newProj).catch(err => {
        console.warn('Falha ao persistir cálculo no banco de dados:', err);
      });
    }
  };

  const handleOpenCalculationInDashboards = (calc?: DamageAnalysisResult) => {
    if (calc) {
      handleSaveCalculationToVault(calc);
    }
    setActiveTab('dashboards');
  };

  return (
    <div className="min-h-screen bg-[#060a12] text-slate-100 flex flex-col font-sans selection:bg-ametist-500 selection:text-white antialiased">
      {/* Sticky Header with Navigation and Astralys Branding */}
      <Header 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'landing' && (
          <LandingPage setActiveTab={setActiveTab} />
        )}

        {activeTab === 'dashboards' && currentProject && (
          <DashboardsPage
            currentProject={currentProject}
            availableProjects={projects}
            onSelectProject={handleSelectProject}
            onOpenDamageAnalyzer={() => setActiveTab('damage')}
            onOpenERCalculator={(team, duration) => handleSendTeamToER(team, duration)}
            onOpenWeaponComparator={() => setActiveTab('weapons')}
            onExportToCard={handleExportDamageToCard}
            onOpenVault={() => setActiveTab('vault')}
            onSaveProject={handleSaveProject}
          />
        )}

        {activeTab === 'vault' && (
          <ProjectVault
            projects={projects}
            activeProjectId={activeProjectId}
            onSelectProject={handleSelectProject}
            onOpenInDamageAnalyzer={(proj) => {
              setCalcForAnalyzer(proj.calculation);
              setActiveTab('damage');
            }}
            onSaveProject={handleSaveProject}
            onDeleteProject={handleDeleteProject}
            onDuplicateProject={handleDuplicateProject}
            onRestoreDefaults={handleRestoreDefaultProjects}
          />
        )}

        {activeTab === 'generator' && (
          <InfographicGenerator 
            erPayload={erPayload} 
            onClearPayload={() => setErPayload(null)} 
            onOpenER={() => setActiveTab('er')} 
            onSendTeamToER={handleSendTeamToER}
            externalCardData={cardDataFromDamage}
            onClearExternalCardData={() => setCardDataFromDamage(null)}
          />
        )}

        {activeTab === 'weapons' && (
          <WeaponComparator 
            comparisons={weaponComparisons}
            onUpdateComparisons={setWeaponComparisons}
            onClearComparisons={handleClearComparisons}
            onInjectToCard={(partialCard) => {
              if (cardDataFromDamage) {
                setCardDataFromDamage({
                  ...cardDataFromDamage,
                  ...partialCard,
                  metrics: {
                    ...cardDataFromDamage.metrics,
                    ...(partialCard.metrics || {})
                  }
                });
              }
              setActiveTab('generator');
            }}
            onOpenDamageAnalyzer={() => setActiveTab('damage')}
          />
        )}

        {activeTab === 'damage' && (
          <DamageAnalyzer 
            onExportToCard={handleExportDamageToCard}
            onSendTeamToER={handleSendTeamToER}
            onOpenWeaponComparator={() => setActiveTab('weapons')}
            weaponComparisons={weaponComparisons}
            onAddWeaponToComparison={handleAddWeaponToComparison}
            onRemoveWeaponFromComparison={handleRemoveWeaponFromComparison}
            onAddMultipleVariantsToComparison={handleAddMultipleVariantsToComparison}
            onSaveToVault={handleSaveCalculationToVault}
            onOpenWarRoom={handleOpenCalculationInDashboards}
            externalCalculation={calcForAnalyzer}
            onClearExternalCalculation={() => setCalcForAnalyzer(null)}
          />
        )}

        {activeTab === 'er' && (
          <ERCalculator 
            onTransferER={handleTransferER} 
            abyssLevel={100}
            initialTeam={teamForER}
            onClearInitialTeam={() => setTeamForER(null)}
          />
        )}

        {activeTab === 'login' && (
          <LoginPage onNavigate={setActiveTab} />
        )}

        {activeTab === 'profile' && (
          <ProfilePage
            projects={projects}
            setProjects={setProjects}
            weaponComparisons={weaponComparisons}
            setWeaponComparisons={setWeaponComparisons}
            onNavigate={setActiveTab}
            onSelectProject={handleSelectProject}
          />
        )}
      </main>

      {/* Clean Modern Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-md py-6 text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-cinzel font-bold text-ametist-400 tracking-wider">ASTRALYS</span>
            <span>•</span>
            <span>Genshin Impact Theorycrafting & Rotações</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Versão 2.4.0</span>
            <span>•</span>
            <span>Meta 6.7 Natlan & Snezhnaya</span>
            <span>•</span>
            <span className="text-emerald-400">Lunaris.moe API Ready</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
      <AuthModal />
    </AuthProvider>
  );
};

export default App;

