/**
 * Serviço de Persistência na Nuvem para Planilhas e Projetos do Astralys
 * Sincroniza os cálculos com o banco de dados MySQL via API FastAPI
 */

import { CalculationProject } from '../types/projectVault';
import { getApiBaseUrl, getAuthHeaders, getStoredToken } from './auth';

interface BackendProjectResponse {
  id: string;
  usuario_id: string;
  nome: string;
  character_name: string;
  role: string;
  version: string;
  author: string;
  dados: any;
  is_public: boolean;
  criado_em: string;
  atualizado_em: string;
}

const mapBackendToProject = (item: BackendProjectResponse): CalculationProject => {
  return {
    ...item.dados,
    id: item.id,
    title: item.nome || item.dados?.title || 'Projeto sem título',
    carryName: item.character_name || item.dados?.carryName || 'Personagem',
    createdAt: item.criado_em || item.dados?.createdAt || new Date().toISOString(),
    updatedAt: item.atualizado_em || item.dados?.updatedAt || new Date().toISOString(),
  };
};

const mapProjectToBackend = (project: CalculationProject, isPublic = false) => {
  return {
    id: project.id,
    nome: project.title,
    character_name: project.carryName || 'Personagem',
    role: 'Main DPS',
    version: '1.0',
    author: project.sheetOrigin || 'Astralys',
    dados: project,
    is_public: isPublic
  };
};

/**
 * Busca todos os projetos do usuário logado salvos no banco de dados
 */
export const fetchCloudProjects = async (): Promise<CalculationProject[]> => {
  const token = getStoredToken();
  if (!token) return [];

  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}/astralys/projetos`, {
    method: 'GET',
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new Error('Falha ao carregar projetos da nuvem.');
  }

  const data: BackendProjectResponse[] = await response.json();
  return data.map(mapBackendToProject);
};

/**
 * Salva ou atualiza um projeto específico no banco de dados na nuvem
 */
export const saveCloudProject = async (project: CalculationProject, isPublic = false): Promise<CalculationProject> => {
  const token = getStoredToken();
  if (!token) {
    throw new Error('Usuário não autenticado. Faça login para salvar na nuvem.');
  }

  const baseUrl = getApiBaseUrl();
  const payload = mapProjectToBackend(project, isPublic);

  const response = await fetch(`${baseUrl}/astralys/projetos`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: 'Erro ao salvar projeto' }));
    throw new Error(err.detail || 'Falha ao salvar projeto na nuvem.');
  }

  const data: BackendProjectResponse = await response.json();
  return mapBackendToProject(data);
};

/**
 * Exclui um projeto do banco de dados na nuvem
 */
export const deleteCloudProject = async (projectId: string): Promise<void> => {
  const token = getStoredToken();
  if (!token) return;

  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}/astralys/projetos/${projectId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new Error('Falha ao excluir projeto da nuvem.');
  }
};

/**
 * Sincroniza em lote todos os projetos locais (localStorage) com o banco de dados
 */
export const syncLocalProjectsWithCloud = async (
  localProjects: CalculationProject[]
): Promise<CalculationProject[]> => {
  const token = getStoredToken();
  if (!token) return localProjects;

  const baseUrl = getApiBaseUrl();
  const payload = {
    projetos: localProjects.map(p => mapProjectToBackend(p))
  };

  const response = await fetch(`${baseUrl}/astralys/projetos/sync`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    console.warn('Erro ao sincronizar projetos em lote na nuvem.');
    return localProjects;
  }

  const data: BackendProjectResponse[] = await response.json();
  return data.map(mapBackendToProject);
};
