import React, { createContext, useState, useEffect, useContext } from 'react';
import { apiCalls } from '../utils/api';

const GroupContext = createContext();

export const GroupProvider = ({ children }) => {
  const [cachedGroups, setCachedGroups] = useState({}); // { instanceId: [group1, group2, ...], ... }
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const [groupLoadError, setGroupLoadError] = useState(null);

  // Função para carregar grupos para uma instância específica e atualizar o cache
  const refreshGroupsForInstance = async (instanceId) => {
    if (!instanceId) return;
    console.log(`GroupProvider: Atualizando cache de grupos para instância: ${instanceId}`);
    // Opcional: Adicionar um estado de carregamento por instância se necessário, mas para simplicidade, usaremos o global por enquanto.
    // setIsLoadingGroups(true); // Isso pode causar um spinner global para cada refresh
    try {
      const groupsResponse = await apiCalls.getGroups(instanceId);
      if (groupsResponse.data && Array.isArray(groupsResponse.data.groups)) {
        setCachedGroups(prevCache => ({
          ...prevCache,
          [instanceId]: groupsResponse.data.groups
        }));
        console.log(`GroupProvider: Cache de grupos para instância ${instanceId} atualizado com ${groupsResponse.data.groups.length} grupos.`);
      } else {
        console.warn(`GroupProvider: Resposta de atualização de grupos inválida ou sem array 'groups' para instância ${instanceId}:`, groupsResponse.data);
        setCachedGroups(prevCache => ({ ...prevCache, [instanceId]: [] })); // Limpar ou definir vazio em caso de erro/resposta inválida
      }
    } catch (error) {
      console.error(`GroupProvider: Erro ao atualizar cache de grupos para instância ${instanceId}:`, error);
      // Manter dados antigos ou definir como vazio em caso de erro
      setCachedGroups(prevCache => ({ ...prevCache, [instanceId]: [] }));
      // Poderia setar um erro específico por instância se necessário
    } finally {
      // setIsLoadingGroups(false); // Se usou o global acima
      console.log(`GroupProvider: Atualização de cache para instância ${instanceId} concluída.`);
    }
  };

  useEffect(() => {
    const loadAllGroups = async () => {
      console.log('GroupProvider: Iniciando pré-carregamento de todos os grupos para todas as instâncias...');
      setIsLoadingGroups(true);
      setGroupLoadError(null);
      const allGroups = {};

      try {
        // 1. Carregar todas as instâncias
        console.log('GroupProvider: Carregando instâncias...');
        const instancesResponse = await apiCalls.getInstances();
        console.log('GroupProvider: Resposta bruta de instâncias:', instancesResponse);

        const instancesObject = instancesResponse.data || {};
        console.log('GroupProvider: Objeto de dados de instâncias:', instancesObject);

        const instancesArray = Object.values(instancesObject)
          .map(value => {
            try {
              console.log('GroupProvider: Tentando parsear valor de instância:', value);
              const parsedValue = JSON.parse(value);
              console.log('GroupProvider: Valor de instância parseado:', parsedValue);
              return parsedValue;
            } catch (parseError) {
              console.error('GroupProvider: Erro ao parsear valor de instância:', value, parseError);
              return null;
            }
          })
          .filter(instance => {
             const isValid = instance !== null && instance.id;
             if (!isValid) {
                 console.warn('GroupProvider: Instância inválida encontrada (null ou sem ID):', instance);
             }
             return isValid;
          });

        console.log('GroupProvider: Instâncias válidas processadas:', instancesArray);

        console.log(`GroupProvider: Encontradas ${instancesArray.length} instâncias válidas para carregar grupos.`);

        // 2. Para cada instância, carregar seus grupos
        // Usar Promise.all para carregar grupos de todas as instâncias em paralelo
        await Promise.all(instancesArray.map(async (instance) => {
           if (instance.id) {
            try {
              console.log(`GroupProvider: Carregando grupos para instância: ${instance.id}`);
              const groupsResponse = await apiCalls.getGroups(instance.id);
               // A resposta de getGroups já é { groups: [], total: N }
              if (groupsResponse.data && Array.isArray(groupsResponse.data.groups)) {
                 allGroups[instance.id] = groupsResponse.data.groups;
                 console.log(`GroupProvider: Carregados ${groupsResponse.data.groups.length} grupos para instância ${instance.id}`);
              } else {
                 console.warn(`GroupProvider: Resposta de grupos inválida ou sem array 'groups' para instância ${instance.id}:`, groupsResponse.data);
                 allGroups[instance.id] = []; // Garantir que a instância tenha uma entrada vazia no cache
              }
            } catch (groupError) {
              console.error(`GroupProvider: Erro ao carregar grupos para instância ${instance.id}:`, groupError);
              allGroups[instance.id] = []; // Em caso de erro, garantir entrada vazia
            }
          } else {
             console.warn('GroupProvider: Instância encontrada sem ID válido durante o loop de carregamento de grupos:', instance);
          }
        }));

        console.log('GroupProvider: Pré-carregamento de grupos finalizado. Cache:', allGroups);
        setCachedGroups(allGroups);

      } catch (error) {
        console.error('GroupProvider: Erro geral durante o pré-carregamento de grupos:', error);
        setGroupLoadError('Erro ao carregar grupos.');
      } finally {
        setIsLoadingGroups(false);
        console.log('GroupProvider: Pré-carregamento de grupos concluído.');
      }
    };

    loadAllGroups();
  }, []); // Executar apenas uma vez ao montar o componente

  // O valor fornecido pelo contexto agora inclui a função de refresh
  return (
    <GroupContext.Provider value={{ cachedGroups, isLoadingGroups, groupLoadError, refreshGroupsForInstance }}>
      {children}
    </GroupContext.Provider>
  );
};

// Hook personalizado para usar o contexto de grupos
export const useGroups = (instanceId) => {
  const context = useContext(GroupContext);
  if (context === undefined) {
    throw new Error('useGroups must be used within a GroupProvider');
  }
  // Retorna a lista de grupos para a instância especificada e o estado global de carregamento/erro
  return {
    groups: context.cachedGroups[instanceId] || [],
    isLoadingGroups: context.isLoadingGroups, // Indica se o carregamento GERAL inicial ainda está acontecendo
    groupLoadError: context.groupLoadError,
    refreshGroupsForInstance: context.refreshGroupsForInstance, // Expõe a função de refresh
  };
};

// Hook para acessar todo o cache e a função de refresh
export const useAllGroupsCache = () => {
    const context = useContext(GroupContext);
    if (context === undefined) {
        throw new Error('useAllGroupsCache must be used within a GroupProvider');
    }
    return {
        cachedGroups: context.cachedGroups, // O objeto cache { instanceId: [...groups] }
        isLoadingGroups: context.isLoadingGroups, // Indica se o carregamento GERAL inicial ainda está acontecendo
        groupLoadError: context.groupLoadError,
        refreshGroupsForInstance: context.refreshGroupsForInstance, // Expõe a função de refresh
    };
}; 