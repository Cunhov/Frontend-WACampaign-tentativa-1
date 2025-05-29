import React, { useState, useEffect } from 'react';
import { apiCalls } from '../utils/api';
import MessageEditor from './MessageEditor';

const RealtimeMessageSender = () => {
  const [instances, setInstances] = useState([]);
  const [selectedInstance, setSelectedInstance] = useState('');
  const [groups, setGroups] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState('');
  const [minParticipants, setMinParticipants] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [filterInput, setFilterInput] = useState('');
  const [minParticipantsInput, setMinParticipantsInput] = useState('');

  useEffect(() => {
    // Carregar instâncias ao montar
    const loadInstances = async () => {
      try {
        const response = await apiCalls.getInstances();
        if (response.data && typeof response.data === 'object') {
          const instancesArray = Object.entries(response.data).map(([key, value]) => {
            try {
              return JSON.parse(value);
            } catch {
              return null;
            }
          }).filter(Boolean);
          setInstances(instancesArray);
        } else {
          setInstances([]);
        }
      } catch {
        setInstances([]);
      }
    };
    loadInstances();
  }, []);

  useEffect(() => {
    // Carregar grupos ao selecionar instância
    const loadGroups = async () => {
      if (!selectedInstance) {
        setGroups([]);
        setSelectedGroups([]);
        return;
      }
      setLoadingGroups(true);
      try {
        const response = await apiCalls.getGroups(selectedInstance);
        if (response.data && Array.isArray(response.data.groups)) {
          setGroups(response.data.groups);
        } else if (Array.isArray(response.data)) {
          setGroups(response.data);
        } else {
          setGroups([]);
        }
        setSelectedGroups([]);
      } catch {
        setGroups([]);
        setSelectedGroups([]);
      } finally {
        setLoadingGroups(false);
      }
    };
    loadGroups();
  }, [selectedInstance]);

  const filteredGroups = groups
    .filter(group =>
      group.name.toLowerCase().includes(filter.toLowerCase()) &&
      (minParticipants === '' || group.participants >= parseInt(minParticipants))
    )
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'participants') {
        return b.participants - a.participants;
      }
      return 0;
    });

  const handleGroupSelect = (groupId) => {
    setSelectedGroups(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const handleSelectAll = () => {
    if (selectedGroups.length === filteredGroups.length) {
      setSelectedGroups([]);
    } else {
      setSelectedGroups(filteredGroups.map(group => group.id));
    }
  };

  const handleSendMessages = async () => {
    if (!selectedInstance) {
      alert('Selecione uma instância');
      return;
    }
    if (selectedGroups.length === 0) {
      alert('Selecione pelo menos um grupo');
      return;
    }
    if (messages.length === 0) {
      alert('Adicione pelo menos uma mensagem');
      return;
    }

    const confirmSend = window.confirm(
      `Tem certeza que deseja enviar ${messages.length} mensagem(ns) para ${selectedGroups.length} grupo(s)?`
    );
    if (!confirmSend) return;

    setSending(true);
    try {
      // Separar mensagens de texto e mídia
      const textMessages = messages.filter(msg => msg.type === 'text');
      const mediaMessages = messages.filter(msg => 
        ['image', 'video', 'audio', 'document'].includes(msg.type)
      );

      // Enviar mensagens de texto
      if (textMessages.length > 0) {
        await apiCalls.sendBulkMessages(selectedInstance, selectedGroups, textMessages);
      }

      // Enviar mensagens de mídia
      if (mediaMessages.length > 0) {
        const mediaFiles = mediaMessages.map(msg => msg.content);
        await apiCalls.sendBulkMediaMessages(selectedInstance, selectedGroups, mediaFiles);
      }

      alert('Mensagens enviadas com sucesso!');
      setMessages([]);
    } catch (error) {
      console.error('Erro ao enviar mensagens:', error);
      alert('Erro ao enviar mensagens: ' + (error.response?.data?.message || error.message));
    } finally {
      setSending(false);
    }
  };

  // Filtro aplicado só ao clicar
  const applyFilters = () => {
    setFilter(filterInput);
    setMinParticipants(minParticipantsInput);
  };
  const clearFilters = () => {
    setFilterInput('');
    setMinParticipantsInput('');
    setFilter('');
    setMinParticipants('');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Enviar Mensagens em Tempo Real</h2>
        {/* Seleção de Instância */}
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">Selecione a Instância</label>
          <select
            value={selectedInstance}
            onChange={e => setSelectedInstance(e.target.value)}
            className="w-full max-w-md px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Escolha uma instância</option>
            {instances.map(instance => (
              <option key={instance.id} value={instance.id}>{instance.name}</option>
            ))}
          </select>
        </div>
        {/* Filtro e Seleção de Grupos */}
        {selectedInstance && (
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 items-end">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-1">Filtrar por nome</label>
                <input
                  type="text"
                  value={filterInput}
                  onChange={(e) => setFilterInput(e.target.value)}
                  placeholder="Filtrar grupos..."
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-1">Mínimo de participantes</label>
                <input
                  type="number"
                  min="0"
                  value={minParticipantsInput}
                  onChange={(e) => setMinParticipantsInput(e.target.value)}
                  placeholder="Ex: 50"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-1">Ordenar por</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="name">Nome (A-Z)</option>
                  <option value="participants">Participantes (Maior)</option>
                </select>
              </div>
              <div className="flex flex-col gap-2 mt-2 md:mt-0">
                <button
                  onClick={applyFilters}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Filtrar
                </button>
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Limpar
                </button>
                <button
                  onClick={handleSelectAll}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  {selectedGroups.length === filteredGroups.length ? 'Desselecionar Todos' : 'Selecionar Todos'}
                </button>
              </div>
            </div>
            {loadingGroups ? (
              <div className="text-center text-gray-500">Carregando grupos...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto p-2">
                {filteredGroups.map(group => (
                  <div
                    key={group.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedGroups.includes(group.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                    onClick={() => handleGroupSelect(group.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                        {group.pictureUrl ? (
                          <img
                            src={group.pictureUrl}
                            alt={group.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-gray-500">👥</span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{group.name}</h3>
                        <p className="text-sm text-gray-500">
                          {group.participants.toLocaleString()} participantes
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        <MessageEditor
          onSave={setMessages}
          initialMessages={messages}
        />
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSendMessages}
            disabled={sending || selectedGroups.length === 0 || messages.length === 0}
            className={`px-6 py-3 rounded-lg text-white font-medium ${
              sending || selectedGroups.length === 0 || messages.length === 0
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600'
            } transition-colors`}
          >
            {sending ? 'Enviando...' : 'Enviar Mensagens'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RealtimeMessageSender; 