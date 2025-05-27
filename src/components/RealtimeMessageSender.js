import React, { useState } from 'react';
import { apiCalls } from '../utils/api';
import MessageEditor from './MessageEditor';

const RealtimeMessageSender = ({ instanceId, groups }) => {
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState('');

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(filter.toLowerCase())
  );

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
      await apiCalls.sendBulkMessages(instanceId, selectedGroups, messages);
      alert('Mensagens enviadas com sucesso!');
      setMessages([]);
    } catch (error) {
      console.error('Erro ao enviar mensagens:', error);
      alert('Erro ao enviar mensagens: ' + (error.response?.data?.message || error.message));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Enviar Mensagens em Tempo Real</h2>
        
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filtrar grupos..."
              className="w-full max-w-md px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={handleSelectAll}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {selectedGroups.length === filteredGroups.length ? 'Desselecionar Todos' : 'Selecionar Todos'}
            </button>
          </div>

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
        </div>

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