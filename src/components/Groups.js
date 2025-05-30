import React, { useState, useEffect } from 'react';
import { apiCalls } from '../utils/api';
import ToggleSwitch from './ToggleSwitch';
import { useGroups, useAllGroupsCache } from '../contexts/GroupContext'; // Importe os hooks

function Groups() {
  const [instances, setInstances] = useState([]);
  const [selectedInstanceId, setSelectedInstanceId] = useState(''); // Alterado para selectedInstanceId para clareza
  const [filter, setFilter] = useState('');
  const [adminOnly, setAdminOnly] = useState(false);
  const [sortBy, setSortBy] = useState('name'); // 'name', 'size'
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid', 'list'
  const [statistics, setStatistics] = useState({
    total: 0,
    adminGroups: 0,
    memberGroups: 0
  });
  const [editForm, setEditForm] = useState({
    description: '',
    restrict: false,
    announce: false,
    newName: ''
  });
  const [isIndividualEditingDescription, setIsIndividualEditingDescription] = useState(false);
  const [isBulkEditingDetails, setIsBulkEditingDetails] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  // Usar os hooks do GroupContext
  const { groups, isLoadingGroups: isGroupsLoadingForInstance, refreshGroupsForInstance } = useGroups(selectedInstanceId); // Grupos e refresh para a instância selecionada
  const { isLoadingGroups: isInitialLoading } = useAllGroupsCache(); // Estado de carregamento global inicial

  useEffect(() => {
    loadInstances();
  }, []);

  const loadInstances = async () => {
    console.log('Iniciando loadInstances (Groups)...');
    try {
      console.log('Chamando apiCalls.getInstances() em Groups...');
      const response = await apiCalls.getInstances();
      console.log('Resposta completa do webhook (Instances em Groups):', response);
      console.log('Dados da resposta do webhook (Instances em Groups):', response.data);
      
      if (!response.data || typeof response.data !== 'object' || Object.keys(response.data).length === 0) {
        console.error('Formato de dados inválido ou vazio (Instances em Groups):', response.data);
        console.log('Definindo instances como array vazio devido a dados inválidos/vazios.');
        setInstances([]);
        return;
      }

      const instancesObject = response.data;
      console.log('Objeto de instâncias bruto (Groups):', instancesObject);
      
      const instancesArray = Object.entries(instancesObject).map(([key, value]) => {
        try {
          console.log(`Tentando parsear instância com chave ${key} (Groups):`, value);
          const instance = JSON.parse(value);
          console.log(`Instância parseada com sucesso ${key} (Groups):`, instance);
          return instance;
        } catch (parseError) {
          console.error(`Erro ao parsear instância ${key} (Groups):`, parseError);
          console.error(`Valor que causou erro de parse para chave ${key}:`, value);
          return null;
        }
      }).filter(instance => instance !== null);

      console.log('Instâncias processadas (antes de setar o estado - Groups):', instancesArray);
      if (instancesArray.length === 0) {
        console.log('Nenhuma instância válida encontrada após parse. Definindo instances como array vazio.');
      }
      setInstances(instancesArray);
      console.log('Estado de instâncias atualizado (Groups).');

       // Selecionar a primeira instância por padrão se houver e não houver uma selecionada
      if (instancesArray.length > 0 && !selectedInstanceId) { // Usar selectedInstanceId aqui
        setSelectedInstanceId(instancesArray[0].id); // E setar o ID
      }

    } catch (error) {
      console.error('Erro geral ao carregar instâncias (Groups):', error);
      console.error('Detalhes do erro (Groups):', error.message, error.response?.data);
      setInstances([]);
    }
  };

  // Atualizar estatísticas sempre que a lista de grupos (do cache) mudar
  useEffect(() => {
    if (groups && groups.length > 0) {
       console.log('Lista de grupos do cache atualizada. Calculando estatísticas...');
       const stats = {
         total: groups.length,
         adminGroups: groups.filter(g => g.isAdmin === true).length,
         memberGroups: groups.filter(g => g.isAdmin !== true).length
       };

       console.log('Estatísticas calculadas:', stats);
       setStatistics(stats);
    } else {
       // Resetar estatísticas se não houver grupos para a instância selecionada
       setStatistics({ total: 0, adminGroups: 0, memberGroups: 0 });
    }
     // Limpar seleção de grupos ao mudar de instância ou se os grupos sumirem
     setSelectedGroups([]);

  }, [groups]); // Depende da lista de grupos fornecida pelo hook useGroups

  const updateGroupSettings = async (groupId, settings) => {
    try {
      console.log('Atualizando configurações do grupo:', groupId, settings);
      
      const response = await apiCalls.updateGroupSettings(selectedInstanceId, groupId, settings); // Usar selectedInstanceId
      console.log('Resposta da atualização:', response.data);
      
      if (response.data && response.data.success) {
        // Chamar a função do contexto para atualizar o cache APENAS para esta instância
        refreshGroupsForInstance(selectedInstanceId); 
        // Não precisa mais do loadGroups() local
        return true;
      }
 else {
        throw new Error(response.data?.message || 'Falha na atualização');
      }
    } catch (error) {
      console.error('Erro ao atualizar configurações do grupo:', error);
      throw error;
    }
  };

  const updateGroupPhoto = async (groupId, photo) => {
    try {
      console.log('Atualizando foto do grupo:', groupId);
      const response = await apiCalls.updateGroupPhoto(selectedInstanceId, groupId, photo); // Usar selectedInstanceId
      console.log('Resposta da atualização de foto:', response.data);
      
      if (response.data && response.data.success) {
        // Chamar a função do contexto para atualizar o cache
        refreshGroupsForInstance(selectedInstanceId);
        // Não precisa mais do loadGroups()
        alert('Foto do grupo atualizada com sucesso!');
      }
 else {
        throw new Error(response.data?.message || 'Falha na atualização da foto');
      }
    } catch (error) {
      console.error('Erro ao atualizar foto do grupo:', error);
      alert('Erro ao atualizar foto do grupo: ' + (error.response?.data?.message || error.message));
    }
  };

  const getInviteLink = async (groupId) => {
    try {
      console.log('Obtendo link de convite para grupo:', groupId);
      const response = await apiCalls.getGroupInviteLink(selectedInstanceId, groupId); // Usar selectedInstanceId
      console.log('Resposta do link de convite:', response.data);
      
      if (response.data && response.data.success && response.data.inviteLink) {
        await navigator.clipboard.writeText(response.data.inviteLink);
        alert('Link de convite copiado para a área de transferência!');
      }
 else {
        throw new Error(response.data?.message || 'Link de convite não encontrado');
      }
    } catch (error) {
      console.error('Erro ao obter link de convite:', error);
      alert('Erro ao obter link de convite: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleBulkUpdate = async () => {
    if (selectedGroups.length === 0) {
      alert('Selecione pelo menos um grupo');
      return;
    }

    const confirmUpdate = window.confirm(
      `Tem certeza que deseja atualizar ${selectedGroups.length} grupos com as configurações selecionadas?`
    );

    if (!confirmUpdate) return;

    let successCount = 0;
    let errorCount = 0;

    const settingsToUpdate = { // Inicializa com as settings de ToggleSwitch
      restrict: editForm.restrict,
      announce: editForm.announce,
      editInfo: false // Adicionar editInfo com valor padrão para bulk
    };

    if (isBulkEditingDetails) { // Adiciona name e description se a edição de detalhes estiver ativa
      if(editForm.newName) settingsToUpdate.name = editForm.newName; // Apenas adiciona se o campo não estiver vazio
      if(editForm.description) settingsToUpdate.description = editForm.description; // Apenas adiciona se o campo não estiver vazio
    }

     console.log('Payload de edição em massa:', settingsToUpdate);

    try {
      for (const groupId of selectedGroups) {
        try {
          // Update group settings
          // A apiCalls.updateGroupSettings já usa selectedInstance
          await apiCalls.updateGroupSettings(selectedInstanceId, groupId, settingsToUpdate); // Usar selectedInstanceId
          
          // Update photo if one was selected
          if (selectedPhoto) {
            // A updateGroupPhoto já usa selectedInstance
            await updateGroupPhoto(groupId, selectedPhoto); 
          }
          
          successCount++;
        } catch (error) {
          errorCount++;
          console.error(`Erro ao atualizar grupo ${groupId}:`, error);
        }
      }
      
      // Após a edição em massa, recarregar os grupos para a instância selecionada
      refreshGroupsForInstance(selectedInstanceId); 
      // Não precisa mais do loadGroups()

      setSelectedGroups([]);
      setBulkEditMode(false);
      setSelectedPhoto(null);
      setIsBulkEditingDetails(false); // Resetar estado da edição de detalhes em massa
      setEditForm({ description: '', restrict: false, announce: false, newName: '' }); // Resetar formulário

      if (errorCount === 0) {
        alert(`✅ ${successCount} grupos atualizados com sucesso!`);
      } else {
        alert(`Atualização concluída: ${successCount} sucessos, ${errorCount} erros`);
      }
    } catch (error) {
      console.error('Erro na atualização em massa:', error);
      alert('Erro na atualização em massa: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleSelectGroup = (groupId) => {
    setSelectedGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId) : [...prev, groupId]
    );
  };

  const startEditGroup = (group) => {
    setEditingGroup(group);
    setEditForm({
      description: group.description || '',
      restrict: Boolean(group.restrict) || false, // Garantir booleano
      announce: Boolean(group.announce) || false, // Garantir booleano
      newName: group.name || ''
    });
    setEditMode(true);
    setIsIndividualEditingDescription(false); // Começa com descrição não editando
  };

  const handleSaveEdit = async () => {
    if (!editingGroup || !selectedInstanceId) return; // Verificar selectedInstanceId
    
    try {
       const updatePayload = { // Payload para atualização individual
         restrict: editForm.restrict,
         announce: editForm.announce,
         editInfo: true, // Sempre True na edição individual via modal
         name: editForm.newName, // Incluir nome
         description: editForm.description // Incluir descrição
       };

       console.log('Payload de edição individual:', updatePayload);

      await updateGroupSettings(editingGroup.id, updatePayload); // Usa updateGroupSettings que chama a API
      // updateGroupSettings já chama refreshGroupsForInstance(selectedInstanceId) ao ter sucesso

      setEditMode(false);
      setEditingGroup(null);
      setIsIndividualEditingDescription(false);
      setEditForm({ description: '', restrict: false, announce: false, newName: '' }); // Resetar formulário
      alert('Configurações do grupo atualizadas com sucesso!');

    } catch (error) {
      alert('Erro ao atualizar configurações: ' + (error.response?.data?.message || error.message));
    }
  };

   const handleDeleteGroup = async (groupId) => {
     if (!selectedInstanceId) return;
     if (window.confirm('Tem certeza que deseja deletar este grupo?')) {
       try {
          // Assumindo que você tem uma apiCalls.deleteGroup(instanceId, groupId)
          // Se não tiver, precisará criar o endpoint no n8n e a função no api.js
         // await apiCalls.deleteGroup(selectedInstanceId, groupId);

         // *** Placeholder: Simular deleção e atualizar cache ***
         // Em um cenário real, você chamaria a API de deleção aqui.
         console.warn('Deleção de grupo não implementada no frontend/backend. Simulação de atualização de cache.');
         // Após a deleção bem-sucedida via API, chamar refresh:
         refreshGroupsForInstance(selectedInstanceId); 
         // Fim do Placeholder

         alert('Grupo deletado (simulação)! Cache atualizado.');
         setSelectedGroups([]); // Limpar seleção se o grupo deletado estava selecionado
       } catch (error) {
         console.error('Erro ao deletar grupo:', error);
         alert('Erro ao deletar grupo: ' + (error.response?.data?.message || error.message));
       }
     }
   };

  // Filtrar e ordenar os grupos OBTIDOS DO CACHE
  const filteredAndSortedGroups = groups
    .filter(group => {
      const matchesFilter = group.name.toLowerCase().includes(filter.toLowerCase());
      // A lógica de `isAdmin` agora é mais robusta (verifica explicitamente true)
      const matchesAdmin = !adminOnly || group.isAdmin === true;
      return matchesFilter && matchesAdmin;
    })
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'size') {
        return b.participants - a.participants;
      }
      return 0;
    });

  const handleSelectAllGroups = () => {
    if (selectedGroups.length === filteredAndSortedGroups.length && filteredAndSortedGroups.length > 0) {
      setSelectedGroups([]);
    } else {
      setSelectedGroups(filteredAndSortedGroups.map(group => group.id));
    }
  };

  const GroupCard = ({ group }) => (
    <div className={`bg-white p-4 rounded-lg shadow transition-all duration-200 hover:shadow-md ${
      selectedGroups.includes(group.id) ? 'ring-2 ring-blue-500' : ''
    }`}>
      {bulkEditMode && (
        <div className="mb-2">
          <input
            type="checkbox"
            checked={selectedGroups.includes(group.id)}
            onChange={() => handleSelectGroup(group.id)}
            className="mr-2 transform scale-110"
          />
        </div>
      )}
      
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div className="relative group">
            {group.pictureUrl ? (
              <img
                src={group.pictureUrl}
                alt={group.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-500 text-xl">👥</span>
              </div>
            )}
            {group.isAdmin && (
              <label className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                <span className="text-white text-xs">📷</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      if (file.size > 2 * 1024 * 1024) {
                        alert('Arquivo muito grande. Máximo 2MB.');
                        return;
                      }
                      // Chamar a função de atualização de foto do grupo, que usará a apiCalls e fará o refresh do cache
                      updateGroupPhoto(group.id, file); // Passar o FILE diretamente
                    }
                  }}
                />
              </label>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg mb-1 truncate" title={group.name}>
              {group.name}
            </h3>
            <p className="text-gray-600 text-sm">
              {(group.participants || 0).toLocaleString()} participantes
            </p>
            {group.description && (
              <p className="text-gray-500 text-xs mt-1 line-clamp-2" title={group.description}>
                {group.description}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex flex-col space-y-1 ml-2 flex-shrink-0">
          {group.isAdmin && (
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded font-medium">
              👑 Admin
            </span>
          )}
          <div className="flex flex-col space-y-1">
            <span className={`px-2 py-1 text-xs rounded text-center ${
              group.restrict 
                ? 'bg-red-100 text-red-800' 
                : 'bg-green-100 text-green-800'
            }`}>
              {group.restrict ? '🔒 Fechado' : '🔓 Aberto'}
            </span>
            <span className={`px-2 py-1 text-xs rounded text-center ${
              group.announce 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {group.announce ? '📢 Só Admin' : '💬 Todos'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-3">
        {group.isAdmin && (
          <>
            <button
              onClick={() => startEditGroup(group)}
              className="text-xs bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors"
              title="Editar configurações do grupo"
            >
              ✏️ Editar
            </button>
            <button
              onClick={() => getInviteLink(group.id)}
              className="text-xs bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition-colors"
              title="Copiar link de convite"
            >
              🔗 Link
            </button>
          </>
        )}
      </div>

      <p className="text-gray-400 text-xs mt-2 font-mono">
        ID: {group.id}
      </p>
    </div>
  );

  const handlePhotoSelect = (file) => {
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Arquivo muito grande. Máximo 2MB.');
        return;
      }
      setSelectedPhoto(file); // Apenas armazena o arquivo selecionado
      alert('Foto selecionada. Ela será aplicada ao aplicar a Edição em Massa.');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Grupos do WhatsApp</h2>
          {selectedInstanceId && !isGroupsLoadingForInstance && (
            <div className="text-sm text-gray-600 mt-1">
              Total: {statistics.total} | Admin: {statistics.adminGroups} | Membro: {statistics.memberGroups}
            </div>
          )}
          {selectedInstanceId && isGroupsLoadingForInstance && !isInitialLoading && (
            <div className="text-sm text-blue-600 mt-1 flex items-center">
              Carregando grupos para esta instância... <span className="ml-2 animate-spin">⚙️</span>
            </div>
          )}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setBulkEditMode(!bulkEditMode)}
            className={`px-4 py-2 rounded transition-colors ${
              bulkEditMode ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {bulkEditMode ? 'Cancelar Edição' : 'Edição em Massa'}
          </button>
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded transition-colors"
          >
            {viewMode === 'grid' ? '📋 Lista' : '⚏ Grade'}
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Selecione a Instância
            </label>
            <select
              value={selectedInstanceId}
              onChange={(e) => {
                setSelectedInstanceId(e.target.value);
                setSelectedGroups([]); // Limpar seleção ao mudar de instância
                setFilter(''); // Limpar filtro
                setAdminOnly(false); // Resetar filtro admin
              }}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
              disabled={isInitialLoading}
            >
              <option value="">Escolha uma instância</option>
              {instances.map((instance) => (
                <option key={instance.id} value={instance.id}>
                  {instance.name}
                </option>
              ))}
            </select>
          </div>

          {selectedInstanceId && !isGroupsLoadingForInstance && !isInitialLoading && (
            <>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Filtrar por nome
                </label>
                <input
                  type="text"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="Digite para filtrar..."
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Ordenar por
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="name">Nome (A-Z)</option>
                  <option value="size">Tamanho (Maior)</option>
                </select>
              </div>

              <div className="flex items-end">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={adminOnly}
                    onChange={(e) => setAdminOnly(e.target.checked)}
                    className="mr-2 transform scale-110"
                  />
                  <span className="text-gray-700">Apenas grupos onde sou admin ({statistics.adminGroups})</span>
                </label>
              </div>
            </>
          )}
        </div>
      </div>

      {selectedInstanceId && !isInitialLoading ? (
        <>
          {bulkEditMode && selectedGroups.length > 0 && (
            <div className="bg-yellow-50 p-4 rounded-lg shadow mb-6 border border-yellow-200">
              <h3 className="font-bold mb-4 text-yellow-800 text-lg">
                Edição em Massa ({selectedGroups.length} grupos selecionados)
              </h3>
              <div className="space-y-4">
                <button
                  onClick={() => setIsBulkEditingDetails(!isBulkEditingDetails)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded transition-colors text-gray-800 text-sm"
                >
                  {isBulkEditingDetails ? 'Ocultar Edição de Nome/Descrição' : 'Editar Nome/Descrição'}
                </button>

                {isBulkEditingDetails && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2">
                        Novo Nome
                      </label>
                      <input
                        type="text"
                        value={editForm.newName}
                        onChange={(e) => setEditForm({...editForm, newName: e.target.value})}
                        placeholder="Digite o novo nome do grupo..."
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2">
                        Nova Descrição
                      </label>
                      <textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                        rows="3"
                        maxLength={2048}
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        {editForm.description.length}/2048 caracteres
                      </div>
                    </div>
                  </div>
                )}

                <div className="border-t border-gray-200 pt-4 mt-4">
                  <label htmlFor="bulk-photo-upload" className="block text-gray-700 text-sm font-bold mb-2">
                    Mudar Foto (Aplica para todos selecionados)
                    {selectedPhoto && <span className="text-green-600 ml-2">✓ Foto selecionada</span>}
                  </label>
                  <div
                    className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md cursor-pointer hover:border-blue-500 transition-colors"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files[0];
                      handlePhotoSelect(file);
                    }}
                  >
                    <div className="space-y-1 text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="bulk-photo-upload"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                        >
                          <span>Faça upload de um arquivo</span>
                        </label>
                        <p className="pl-1">ou arraste e solte</p>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF até 2MB</p>
                    </div>
                    <input
                      id="bulk-photo-upload"
                      name="bulk-photo-upload"
                      type="file"
                      className="sr-only"
                      accept="image/*"
                      onChange={(e) => handlePhotoSelect(e.target.files[0])}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.restrict}
                      onChange={(e) => setEditForm({...editForm, restrict: e.target.checked})}
                      className="mr-2 transform scale-110"
                    />
                    <span className="text-gray-700">Apenas admin pode editar grupo</span>
                  </label>

                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.announce}
                      onChange={(e) => setEditForm({...editForm, announce: e.target.checked})}
                      className="mr-2 transform scale-110"
                    />
                    <span className="text-gray-700">Apenas admin pode enviar mensagens</span>
                  </label>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleBulkUpdate}
                    className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
                  >
                    Aplicar Alterações
                  </button>
                </div>
              </div>
            </div>
          )}

          {!isGroupsLoadingForInstance ? (
            <>
              {bulkEditMode && filteredAndSortedGroups.length > 0 && (
                <div className="mb-4">
                  <div className="bg-white p-3 rounded-lg shadow flex items-center justify-between">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedGroups.length === filteredAndSortedGroups.length && filteredAndSortedGroups.length > 0}
                        onChange={handleSelectAllGroups}
                        className="mr-2 transform scale-110"
                      />
                      <span className="font-medium">
                        Selecionar Todos ({selectedGroups.length}/{filteredAndSortedGroups.length})
                      </span>
                    </label>
                    {selectedGroups.length > 0 && (
                      <button
                        onClick={() => setSelectedGroups([])}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Limpar Seleção
                      </button>
                    )}
                  </div>
                </div>
              )}

              {filteredAndSortedGroups.length > 0 ? (
                <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
                  {filteredAndSortedGroups.map((group) => (
                    <GroupCard key={group.id} group={group} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-4">📱</div>
                  <p>Nenhum grupo encontrado com os filtros aplicados.</p>
                  {adminOnly && (
                    <p className="text-sm mt-2">
                      Tente desmarcar "Apenas grupos onde sou admin" para ver todos os grupos.
                    </p>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="mt-2 text-gray-600">Carregando grupos para esta instância...</p>
            </div>
          )}
        </>
      ) : (
        !isInitialLoading && (
          <div className="text-center py-8 text-gray-500">Selecione uma instância para ver os grupos.</div>
        )
      )}

      {editMode && editingGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Editar Grupo: {editingGroup.name}</h3>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-gray-700 text-sm font-bold">
                    Descrição
                  </label>
                  <button
                    onClick={() => setIsIndividualEditingDescription(!isIndividualEditingDescription)}
                    className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded transition-colors"
                  >
                    {isIndividualEditingDescription ? '✖️ Cancelar' : '✏️ Editar'}
                  </button>
                </div>
                {isIndividualEditingDescription ? (
                  <>
                    <textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                      rows="3"
                      maxLength={2048}
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      {editForm.description.length}/2048 caracteres
                    </div>
                  </>
                ) : (
                  <div className="px-3 py-2 border rounded-lg bg-gray-50">
                    {editingGroup.description || 'Sem descrição'}
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Apenas admin pode editar grupo</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.restrict}
                      onChange={(e) => setEditForm({...editForm, restrict: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Apenas admin pode enviar mensagens</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.announce}
                      onChange={(e) => setEditForm({...editForm, announce: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-4 mt-6">
              <button
                onClick={handleSaveEdit}
                className="flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
              >
                Salvar
              </button>
              <button
                onClick={() => {
                  setEditMode(false);
                  setEditingGroup(null);
                  setIsIndividualEditingDescription(false);
                }}
                className="flex-1 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Groups;