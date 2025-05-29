import React, { useState, useEffect } from 'react';
import { apiCalls } from '../utils/api';
import RealtimeMessageSender from './RealtimeMessageSender';

function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [instances, setInstances] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [groupSortBy, setGroupSortBy] = useState('name');
  const [groupFilter, setGroupFilter] = useState('');
  const [campaignFilter, setCampaignFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('scheduledAt');
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [selectedCampaigns, setSelectedCampaigns] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    instanceId: '',
    templateId: '',
    groupIds: [],
    scheduledDate: '',
    scheduledTime: ''
  });
  const [showRealtimeSender, setShowRealtimeSender] = useState(false);

  useEffect(() => {
    console.log('useEffect (Campaigns) acionado. Chamando funcoes de carregamento...');
    loadCampaigns();
    loadInstances();
    loadTemplates();
  }, []);

  const loadCampaigns = async () => {
    console.log('Iniciando loadCampaigns...');
    try {
      console.log('Chamando apiCalls.getCampaigns()...');
      const response = await apiCalls.getCampaigns();
      console.log('Resposta do webhook (Campaigns):', response.data);

      if (!response.data || typeof response.data !== 'object' || Object.keys(response.data).length === 0) {
        console.error('Formato de dados inválido ou vazio (Campaigns):', response.data);
        setCampaigns([]);
        return;
      }

      const campaignsObject = response.data;
      console.log('Objeto de campanhas bruto:', campaignsObject);
      
      const campaignsArray = Object.entries(campaignsObject).map(([key, value]) => {
        try {
          console.log(`Tentando parsear campanha com chave ${key}:`, value);
          const campaign = JSON.parse(value);
          console.log(`Campanha parseada com sucesso ${key}:`, campaign);
          return campaign;
        } catch (parseError) {
          console.error(`Erro ao parsear campanha ${key}:`, parseError);
          return null;
        }
      }).filter(campaign => campaign !== null);

      console.log('Campanhas processadas (antes de setar o estado):', campaignsArray);
      setCampaigns(campaignsArray);
      console.log('Estado de campanhas atualizado.');
    } catch (error) {
      console.error('Erro geral ao carregar campanhas:', error);
      setCampaigns([]);
    }
  };

  const loadInstances = async () => {
    console.log('Iniciando loadInstances (Campaigns)...');
    try {
      console.log('Chamando apiCalls.getInstances()...');
      const response = await apiCalls.getInstances();
      console.log('Resposta do webhook (Instances in Campaigns):', response.data);

      if (!response.data || typeof response.data !== 'object' || Object.keys(response.data).length === 0) {
        console.error('Formato de dados inválido ou vazio (Instances in Campaigns):', response.data);
        setInstances([]);
        return;
      }

      const instancesObject = response.data;
      console.log('Objeto de instâncias bruto (Campaigns):', instancesObject);
      
      const instancesArray = Object.entries(instancesObject).map(([key, value]) => {
        try {
          console.log(`Tentando parsear instância com chave ${key} (Campaigns):`, value);
          const instance = JSON.parse(value);
          console.log(`Instância parseada com sucesso ${key} (Campaigns):`, instance);
          return instance;
        } catch (parseError) {
          console.error(`Erro ao parsear instância ${key} (Campaigns):`, parseError);
          return null;
        }
      }).filter(instance => instance !== null);

      console.log('Instâncias processadas (antes de setar o estado - Campaigns):', instancesArray);
      setInstances(instancesArray);
      console.log('Estado de instâncias atualizado (Campaigns).');
    } catch (error) {
      console.error('Erro geral ao carregar instâncias (Campaigns):', error);
      setInstances([]);
    }
  };

  const loadTemplates = async () => {
    console.log('Iniciando loadTemplates (Campaigns)...');
    try {
      console.log('Chamando apiCalls.getTemplates()...');
      const response = await apiCalls.getTemplates();
      console.log('Resposta do webhook (Templates in Campaigns):', response.data);

      if (!response.data || typeof response.data !== 'object' || Object.keys(response.data).length === 0) {
        console.error('Formato de dados inválido ou vazio (Templates in Campaigns):', response.data);
        setTemplates([]);
        return;
      }

      const templatesObject = response.data;
      console.log('Objeto de templates bruto (Campaigns):', templatesObject);
      
      const templatesArray = Object.entries(templatesObject).map(([key, value]) => {
        try {
          console.log(`Tentando parsear template com chave ${key} (Campaigns):`, value);
          const template = JSON.parse(value);
          console.log(`Template parseado com sucesso ${key} (Campaigns):`, template);
          return template;
        } catch (parseError) {
          console.error(`Erro ao parsear template ${key} (Campaigns):`, parseError);
          return null;
        }
      }).filter(template => template !== null);

      console.log('Templates processados (antes de setar o estado - Campaigns):', templatesArray);
      setTemplates(templatesArray);
      console.log('Estado de templates atualizado (Campaigns).');
    } catch (error) {
      console.error('Erro geral ao carregar templates (Campaigns):', error);
      setTemplates([]);
    }
  };

  const loadGroups = async (instanceId) => {
    console.log('Iniciando loadGroups para instância (Campaigns):', instanceId);
    try {
      setLoadingGroups(true);
      console.log('Chamando apiCalls.getGroups...');
      const response = await apiCalls.getGroups(instanceId);
      console.log('Resposta do webhook (Groups in Campaigns):', response.data);

      if (!response.data || !Array.isArray(response.data.groups)) {
        console.error('Formato de dados inválido ou array de grupos ausente (Groups in Campaigns):', response.data);
        setGroups([]);
        return;
      }

      const groupsArray = response.data.groups;
      console.log('Grupos processados (antes de setar o estado - Campaigns):', groupsArray);
      setGroups(groupsArray);
      console.log('Estado de grupos atualizado (Campaigns).');

    } catch (error) {
      console.error('Erro geral ao carregar grupos (Campaigns):', error);
      setGroups([]);
    } finally {
      setLoadingGroups(false);
    }
  };

  const startEditCampaign = (campaign) => {
    const scheduledDate = new Date(campaign.scheduledAt);
    setEditingCampaign(campaign);
    setFormData({
      name: campaign.name,
      instanceId: campaign.instanceId,
      templateId: campaign.templateId,
      groupIds: campaign.groupIds || [],
      scheduledDate: scheduledDate.toISOString().split('T')[0],
      scheduledTime: scheduledDate.toTimeString().slice(0, 5)
    });
    setShowForm(true);
    
    // Carregar grupos da instância
    if (campaign.instanceId) {
      loadGroups(campaign.instanceId);
    }
  };

  const duplicateCampaign = (campaign) => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    setEditingCampaign(null);
    setFormData({
      name: `${campaign.name} - Cópia`,
      instanceId: campaign.instanceId,
      templateId: campaign.templateId,
      groupIds: campaign.groupIds || [],
      scheduledDate: tomorrow.toISOString().split('T')[0],
      scheduledTime: now.toTimeString().slice(0, 5)
    });
    setShowForm(true);
    
    if (campaign.instanceId) {
      loadGroups(campaign.instanceId);
    }
  };

  const handleBulkStatusUpdate = async (newStatus) => {
    if (selectedCampaigns.length === 0) {
      alert('Selecione pelo menos uma campanha');
      return;
    }

    try {
      for (const campaignId of selectedCampaigns) {
        await apiCalls.updateCampaignStatus(campaignId, newStatus);
      }
      setSelectedCampaigns([]);
      setBulkEditMode(false);
      loadCampaigns();
      alert(`${selectedCampaigns.length} campanhas atualizadas para status: ${newStatus}`);
    } catch (error) {
      console.error('Erro na atualização em massa:', error);
      alert('Erro na atualização em massa');
    }
  };

  const handleBulkReschedule = async (newDate, newTime) => {
    if (selectedCampaigns.length === 0 || !newDate || !newTime) {
      alert('Selecione campanhas e defina nova data/hora');
      return;
    }

    try {
      const newScheduledAt = new Date(`${newDate}T${newTime}`).toISOString();
      
      for (const campaignId of selectedCampaigns) {
        await apiCalls.updateCampaign(campaignId, { scheduledAt: newScheduledAt });
      }
      
      setSelectedCampaigns([]);
      setBulkEditMode(false);
      loadCampaigns();
      alert(`${selectedCampaigns.length} campanhas reagendadas`);
    } catch (error) {
      console.error('Erro no reagendamento em massa:', error);
      alert('Erro no reagendamento em massa');
    }
  };

  const handleSelectCampaign = (campaignId) => {
    setSelectedCampaigns(prev => 
      prev.includes(campaignId) 
        ? prev.filter(id => id !== campaignId)
        : [...prev, campaignId]
    );
  };

  const sortedAndFilteredGroups = groups
    .filter(group =>
      group.name.toLowerCase().includes(groupFilter.toLowerCase())
    )
    .sort((a, b) => {
      if (groupSortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (groupSortBy === 'participants') {
        return b.participants - a.participants;
      }
      return 0;
    });

  const filteredAndSortedCampaigns = campaigns
    .filter(campaign => {
      const matchesName = campaign.name.toLowerCase().includes(campaignFilter.toLowerCase());
      const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
      return matchesName && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'scheduledAt') {
        return new Date(a.scheduledAt) - new Date(b.scheduledAt);
      } else if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'status') {
        return a.status.localeCompare(b.status);
      }
      return 0;
    });

  useEffect(() => {
    if (formData.instanceId) {
      loadGroups(formData.instanceId);
    }
  }, [formData.instanceId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const scheduledAt = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`);
      const campaignData = {
        name: formData.name,
        instanceId: formData.instanceId,
        templateId: formData.templateId,
        groupIds: formData.groupIds,
        scheduledAt: scheduledAt.toISOString()
      };
      
      console.log('Campaign data being sent:', campaignData);
      console.log('GroupIds:', campaignData.groupIds);
      
      if (!campaignData.groupIds || campaignData.groupIds.length === 0) {
        alert('Por favor, selecione pelo menos um grupo');
        return;
      }
      
      if (editingCampaign) {
        await apiCalls.updateCampaign(editingCampaign.id, campaignData);
        alert('Campanha atualizada com sucesso!');
      } else {
        await apiCalls.scheduleCampaign(campaignData);
        alert('Campanha agendada com sucesso!');
      }
      
      setShowForm(false);
      setEditingCampaign(null);
      setFormData({
        name: '',
        instanceId: '',
        templateId: '',
        groupIds: [],
        scheduledDate: '',
        scheduledTime: ''
      });
      loadCampaigns();
    } catch (error) {
      console.error('Erro ao salvar campanha:', error);
      alert('Erro ao salvar campanha: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja deletar esta campanha?')) {
      try {
        await apiCalls.deleteCampaign(id);
        loadCampaigns();
      } catch (error) {
        console.error('Erro ao deletar campanha:', error);
      }
    }
  };

  const toggleGroup = (groupId) => {
    const newGroupIds = formData.groupIds.includes(groupId)
      ? formData.groupIds.filter(id => id !== groupId)
      : [...formData.groupIds, groupId];
    setFormData({ ...formData, groupIds: newGroupIds });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Campanhas</h1>
        <div className="flex space-x-4">
          <button
            onClick={() => setShowRealtimeSender(!showRealtimeSender)}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            {showRealtimeSender ? 'Voltar para Campanhas' : 'Enviar Mensagens em Tempo Real'}
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Nova Campanha
          </button>
        </div>
      </div>

      {showRealtimeSender ? (
        <RealtimeMessageSender
          instanceId={formData.instanceId}
          groups={groups}
        />
      ) : (
        <>
          {/* Filtros e Ordenação */}
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Filtrar por nome
                </label>
                <input
                  type="text"
                  value={campaignFilter}
                  onChange={(e) => setCampaignFilter(e.target.value)}
                  placeholder="Digite para filtrar..."
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Filtrar por status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="all">Todos</option>
                  <option value="pending">Pendente</option>
                  <option value="sent">Enviada</option>
                  <option value="error">Erro</option>
                </select>
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Ordenar por
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="scheduledAt">Data de Agendamento</option>
                  <option value="name">Nome</option>
                  <option value="status">Status</option>
                </select>
              </div>

              <div className="flex items-end">
                <div className="text-gray-700 text-sm">
                  Total: {filteredAndSortedCampaigns.length} campanhas
                </div>
              </div>
            </div>
          </div>

          {/* Edição em Massa */}
          {bulkEditMode && selectedCampaigns.length > 0 && (
            <BulkEditPanel 
              selectedCampaigns={selectedCampaigns}
              onStatusUpdate={handleBulkStatusUpdate}
              onReschedule={handleBulkReschedule}
              onCancel={() => {
                setSelectedCampaigns([]);
                setBulkEditMode(false);
              }}
            />
          )}

          {/* Modal do Formulário */}
          {showForm && (
            <CampaignForm
              formData={formData}
              setFormData={setFormData}
              instances={instances}
              templates={templates}
              groups={groups}
              loadingGroups={loadingGroups}
              groupSortBy={groupSortBy}
              setGroupSortBy={setGroupSortBy}
              groupFilter={groupFilter}
              setGroupFilter={setGroupFilter}
              sortedAndFilteredGroups={sortedAndFilteredGroups}
              toggleGroup={toggleGroup}
              onSubmit={handleSubmit}
              onCancel={() => {
                setShowForm(false);
                setEditingCampaign(null);
              }}
              isEditing={!!editingCampaign}
            />
          )}

          {/* Lista de Campanhas */}
          <div className="grid grid-cols-1 gap-4">
            {filteredAndSortedCampaigns.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                bulkEditMode={bulkEditMode}
                selectedCampaigns={selectedCampaigns}
                onSelect={handleSelectCampaign}
                onEdit={startEditCampaign}
                onDuplicate={duplicateCampaign}
                onDelete={handleDelete}
              />
            ))}
          </div>

          {filteredAndSortedCampaigns.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Nenhuma campanha encontrada com os filtros aplicados.
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Componente do Card da Campanha
const CampaignCard = ({ campaign, bulkEditMode, selectedCampaigns, onSelect, onEdit, onDuplicate, onDelete }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'sent': return 'bg-green-100 text-green-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'sent': return 'Enviada';
      case 'error': return 'Erro';
      default: return 'Desconhecido';
    }
  };

  return (
    <div className={`bg-white p-4 rounded-lg shadow ${selectedCampaigns.includes(campaign.id) ? 'ring-2 ring-blue-500' : ''}`}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          {bulkEditMode && (
            <input
              type="checkbox"
              checked={selectedCampaigns.includes(campaign.id)}
              onChange={() => onSelect(campaign.id)}
              className="mr-3"
            />
          )}
          <div className="inline-block">
            <h3 className="font-bold text-lg">{campaign.name}</h3>
            <p className="text-gray-600 text-sm">
              Agendada para: {new Date(campaign.scheduledAt).toLocaleString('pt-BR')}
            </p>
            <p className="text-gray-600 text-sm">
              {campaign.groupIds?.length || 0} grupos | Template: {campaign.templateName || 'N/A'}
            </p>
            {campaign.sentCount > 0 && (
              <p className="text-gray-600 text-sm">
                Enviadas: {campaign.sentCount} de {campaign.groupIds?.length || 0}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded text-sm ${getStatusColor(campaign.status)}`}>
            {getStatusText(campaign.status)}
          </span>
          
          {!bulkEditMode && (
            <div className="flex gap-1">
              <button
                onClick={() => onEdit(campaign)}
                className="text-blue-500 hover:text-blue-700 px-2 py-1 text-sm"
                title="Editar"
              >
                ✏️
              </button>
              <button
                onClick={() => onDuplicate(campaign)}
                className="text-green-500 hover:text-green-700 px-2 py-1 text-sm"
                title="Duplicar"
              >
                📋
              </button>
              <button
                onClick={() => onDelete(campaign.id)}
                className="text-red-500 hover:text-red-700 px-2 py-1 text-sm"
                title="Deletar"
              >
                🗑️
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Componente do Painel de Edição em Massa
const BulkEditPanel = ({ selectedCampaigns, onStatusUpdate, onReschedule, onCancel }) => {
  const [bulkDate, setBulkDate] = useState('');
  const [bulkTime, setBulkTime] = useState('');

  return (
    <div className="bg-yellow-50 p-4 rounded-lg shadow mb-6">
      <h3 className="font-bold mb-4">Edição em Massa ({selectedCampaigns.length} campanhas selecionadas)</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Alterar Status
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => onStatusUpdate('pending')}
              className="bg-yellow-500 text-white px-3 py-1 rounded text-sm"
            >
              Pendente
            </button>
            <button
              onClick={() => onStatusUpdate('sent')}
              className="bg-green-500 text-white px-3 py-1 rounded text-sm"
            >
              Enviada
            </button>
            <button
              onClick={() => onStatusUpdate('error')}
              className="bg-red-500 text-white px-3 py-1 rounded text-sm"
            >
              Erro
            </button>
          </div>
        </div>
        
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Reagendar
          </label>
          <div className="flex gap-2">
            <input
              type="date"
              value={bulkDate}
              onChange={(e) => setBulkDate(e.target.value)}
              className="px-2 py-1 border rounded text-sm"
            />
            <input
              type="time"
              value={bulkTime}
              onChange={(e) => setBulkTime(e.target.value)}
              className="px-2 py-1 border rounded text-sm"
            />
            <button
              onClick={() => onReschedule(bulkDate, bulkTime)}
              className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
            >
              Aplicar
            </button>
          </div>
        </div>
        
        <div className="flex items-end">
          <button
            onClick={onCancel}
            className="bg-gray-500 text-white px-4 py-2 rounded"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

// Componente do Formulário de Campanha
const CampaignForm = ({ 
  formData, 
  setFormData, 
  instances, 
  templates, 
  groups, 
  loadingGroups,
  groupSortBy,
  setGroupSortBy,
  groupFilter,
  setGroupFilter,
  sortedAndFilteredGroups,
  toggleGroup,
  onSubmit,
  onCancel,
  isEditing
}) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
    <div className="bg-white p-6 rounded-lg w-full max-w-2xl my-8">
      <h3 className="text-xl font-bold mb-4">
        {isEditing ? 'Editar Campanha' : 'Agendar Campanha'}
      </h3>
      <form onSubmit={onSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Nome da Campanha
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Instância
            </label>
            <select
              value={formData.instanceId}
              onChange={(e) => setFormData({...formData, instanceId: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              required
            >
              <option value="">Selecione</option>
              {instances.map((instance) => (
                <option key={instance.id} value={instance.id}>
                  {instance.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Template
            </label>
            <select
              value={formData.templateId}
              onChange={(e) => setFormData({...formData, templateId: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              required
            >
              <option value="">Selecione</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Data
            </label>
            <input
              type="date"
              value={formData.scheduledDate}
              onChange={(e) => setFormData({...formData, scheduledDate: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Hora
            </label>
            <input
              type="time"
              value={formData.scheduledTime}
              onChange={(e) => setFormData({...formData, scheduledTime: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              required
            />
          </div>
        </div>

        {groups.length > 0 && (
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Grupos ({formData.groupIds.length} selecionados)
            </label>
            {loadingGroups ? (
              <div className="text-center text-gray-500">Carregando grupos...</div>
            ) : (
              <>
                <div className="mb-2 flex gap-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-1">Ordenar por:</label>
                    <select
                      value={groupSortBy}
                      onChange={(e) => setGroupSortBy(e.target.value)}
                      className="px-2 py-1 border rounded"
                    >
                      <option value="name">Nome</option>
                      <option value="participants">Participantes</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-gray-700 text-sm font-bold mb-1">Filtrar:</label>
                    <input
                      type="text"
                      value={groupFilter}
                      onChange={(e) => setGroupFilter(e.target.value)}
                      placeholder="Filtrar grupos..."
                      className="w-full px-2 py-1 border rounded"
                    />
                  </div>
                </div>

                {/* Botão Selecionar Todos/Limpar Seleção */}
                {sortedAndFilteredGroups.length > 0 && (
                  <div className="mb-2 flex items-center justify-between bg-gray-50 p-2 rounded">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.groupIds.length === sortedAndFilteredGroups.length && sortedAndFilteredGroups.length > 0}
                        onChange={() => {
                          if (formData.groupIds.length === sortedAndFilteredGroups.length && sortedAndFilteredGroups.length > 0) {
                            setFormData({ ...formData, groupIds: [] });
                          } else {
                            setFormData({ ...formData, groupIds: sortedAndFilteredGroups.map(g => g.id) });
                          }
                        }}
                        className="mr-2 transform scale-110"
                      />
                      <span className="font-medium">
                        Selecionar Todos ({formData.groupIds.length}/{sortedAndFilteredGroups.length})
                      </span>
                    </label>
                    {formData.groupIds.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, groupIds: [] })}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Limpar Seleção
                      </button>
                    )}
                  </div>
                )}

                <div className="border rounded-lg p-3 max-h-48 overflow-y-auto">
                  {sortedAndFilteredGroups.map((group) => (
                    <label key={group.id} className="flex items-center mb-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.groupIds.includes(group.id)}
                        onChange={() => toggleGroup(group.id)}
                        className="mr-2"
                      />
                      <span className="text-sm">{group.name} ({group.participants} participantes)</span>
                      {group.isAdmin && (
                        <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                          Admin
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            {isEditing ? 'Salvar Alterações' : 'Agendar'}
          </button>
        </div>
      </form>
    </div>
  </div>
);

export default Campaigns;