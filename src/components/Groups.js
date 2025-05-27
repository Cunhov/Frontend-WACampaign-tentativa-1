import React, { useState, useEffect } from 'react';
import { apiCalls } from '../utils/api';

function Groups() {
  const [instances, setInstances] = useState([]);
  const [selectedInstance, setSelectedInstance] = useState('');
  const [groups, setGroups] = useState([]);
  const [filter, setFilter] = useState('');
  const [adminOnly, setAdminOnly] = useState(false);
  const [loading, setLoading] = useState(false);
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

    } catch (error) {
      console.error('Erro geral ao carregar instâncias (Groups):', error);
      console.error('Detalhes do erro (Groups):', error.message, error.response?.data);
      setInstances([]);
    }
  };

  const loadGroups = async () => {
    if (!selectedInstance) return;
    
    console.log('Iniciando loadGroups para instância:', selectedInstance);
    setLoading(true);
    try {
      console.log('Chamando apiCalls.getGroups...');
      const response = await apiCalls.getGroups(selectedInstance);
      console.log('Resposta do webhook (Groups):', response.data);

      // Verificar múltiplos formatos de resposta
      let groupsArray = [];
      let debugInfo = {};

      if (response.data) {
        if (Array.isArray(response.data.groups)) {
          groupsArray = response.data.groups;
          debugInfo = response.data.debugInfo || {};
        } else if (Array.isArray(response.data)) {
          groupsArray = response.data;
        } else {
          console.error('Formato de dados inválido - grupos não encontrados:', response.data);
          setGroups([]);
          setLoading(false);
          return;
        }
      } else {
        console.error('Resposta inválida do webhook:', response);
        setGroups([]);
        setLoading(false);
        return;
      }

      console.log('Grupos processados (antes de setar o estado):', groupsArray);
      console.log('Debug info recebido:', debugInfo);
      
      // Log para inspecionar a propriedade isAdmin de alguns grupos
      console.log('Verificando isAdmin para os primeiros grupos:');
      groupsArray.slice(0, 5).forEach(group => {
        console.log(`Grupo: ${group.name}, ID: ${group.id}, isAdmin: ${group.isAdmin}, Tipo: ${typeof group.isAdmin}`);
      });

      // Calcular estatísticas
      const stats = {
        total: groupsArray.length,
        adminGroups: groupsArray.filter(g => g.isAdmin === true).length,
        memberGroups: groupsArray.filter(g => g.isAdmin !== true).length
      };
      
      console.log('Estatísticas calculadas:', stats);
      setStatistics(stats);
      setGroups(groupsArray);
      console.log('Estado de grupos atualizado.');

    } catch (error) {
      console.error('Erro geral ao carregar grupos:', error);
      alert('Erro ao carregar grupos: ' + (error.response?.data?.message || error.message));
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const updateGroupSettings = async (groupId, settings) => {
    try {
      console.log('Atualizando configurações do grupo:', groupId, settings);
      
      const response = await apiCalls.updateGroupSettings(selectedInstance, groupId, settings);
      console.log('Resposta da atualização:', response.data);
      
      if (response.data && response.data.success) {
        await loadGroups(); // Recarregar grupos após atualização
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
      const response = await apiCalls.updateGroupPhoto(selectedInstance, groupId, photo);
      console.log('Resposta da atualização de foto:', response.data);
      
      if (response.data && response.data.success) {
        await loadGroups();
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
      const response = await apiCalls.getGroupInviteLink(selectedInstance, groupId);
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

    const settingsToUpdate = {
      restrict: editForm.restrict,
      announce: editForm.announce,
    };

    if (isBulkEditingDetails) {
      settingsToUpdate.description = editForm.description;
      settingsToUpdate.name = editForm.newName;
    }

    try {
      for (const groupId of selectedGroups) {
        try {
          // Update group settings
          await updateGroupSettings(groupId, settingsToUpdate);
          
          // Update photo if one was selected
          if (selectedPhoto) {
            await updateGroupPhoto(groupId, selectedPhoto);
          }
          
          successCount++;
        } catch (error) {
          errorCount++;
          console.error(`Erro ao atualizar grupo ${groupId}:`, error);
        }
      }
      
      setSelectedGroups([]);
      setBulkEditMode(false);
      setSelectedPhoto(null); // Clear the selected photo
      
      if (errorCount === 0) {
        alert(`✅ ${successCount} grupos atualizados com sucesso!`);
      } else {
        alert(`Atualização concluída: ${successCount} sucessos, ${errorCount} erros`);
      }
    } catch (error) {
      console.error('Erro na atualização em massa:', error);
      alert('Erro na atualização em massa');
    }
  };

  const handleSelectGroup = (groupId) => {
    setSelectedGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const startEditGroup = (group) => {
    setEditingGroup(group);
    setEditForm({
      description: group.description || '',
      restrict: Boolean(group.restrict),
      announce: Boolean(group.announce),
      newName: group.name || ''
    });
    setEditMode(true);
  };

  const handleSaveEdit = async () => {
    if (!editingGroup) return;
    
    try {
      await updateGroupSettings(editingGroup.id, editForm);
      setEditMode(false);
      setEditingGroup(null);
      alert('Configurações do grupo atualizadas com sucesso!');
    } catch (error) {
      alert('Erro ao atualizar configurações: ' + (error.response?.data?.message || error.message));
    }
  };

  useEffect(() => {
    console.log('useEffect (Groups) acionado. selectedInstance:', selectedInstance);
    if (selectedInstance) {
      setGroups([]); // Limpar grupos anteriores
      setSelectedGroups([]); // Limpar seleções
      loadGroups();
    }
  }, [selectedInstance]);

  const filteredAndSortedGroups = groups
    .filter(group => {
      const matchesFilter = group.name.toLowerCase().includes(filter.toLowerCase());
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
    }
 else {
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
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        updateGroupPhoto(group.id, event.target.result);
                      };
                      reader.readAsDataURL(file);
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
              {group.participants.toLocaleString()} participantes
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
      const reader = new FileReader();
      reader.onload = (event) => {
        // Remove the data:image/... prefix from the base64 string
        const base64Data = event.target.result.split(',')[1];
        setSelectedPhoto(base64Data);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Grupos do WhatsApp</h2>
          {selectedInstance && (
            <div className="text-sm text-gray-600 mt-1">
              Total: {statistics.total} | Admin: {statistics.adminGroups} | Membro: {statistics.memberGroups}
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
              value={selectedInstance}
              onChange={(e) => setSelectedInstance(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="">Escolha uma instância</option>
              {instances.map((instance) => (
                <option key={instance.id} value={instance.id}>
                  {instance.name}
                </option>
              ))}
            </select>
          </div>

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
        </div>
      </div>

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

            {/* Opção de Mudar Foto */}
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

            {/* Opções de configuração do grupo */}
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

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-gray-600">Carregando grupos...</p>
        </div>
      ) : (
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
          
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
            {filteredAndSortedGroups.map((group) => (
              <GroupCard key={group.id} group={group} />
            ))}
          </div>
        </>
      )}

      {!loading && filteredAndSortedGroups.length === 0 && selectedInstance && (
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

      {/* Modal de Edição Individual */}
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