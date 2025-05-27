import axios from 'axios';

const API_URL = 'https://aplicativos-n8n.m23la1.easypanel.host';
const API_KEY = process.env.REACT_APP_N8N_API_KEY;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
  }
});

export const apiCalls = {
  // Autenticação
  login: (username, password) => 
    api.post('/webhook/auth', { 
      action: 'login', 
      username, 
      password 
    }),
  
  // Instâncias
  getInstances: () => 
    api.post('/webhook/instances', { 
      action: 'list' 
    }),
  
  saveInstance: (instance) => 
    api.post('/webhook/instances', { 
      action: 'save', 
      instance 
    }),
  
  deleteInstance: (id) => 
    api.post('/webhook/instances', { 
      action: 'delete', 
      id 
    }),
  
  // Templates
  getTemplates: () => 
    api.post('/webhook/templates', { 
      action: 'list' 
    }),
  
  saveTemplate: (template) => 
    api.post('/webhook/templates', { 
      action: 'save', 
      template 
    }),
  
  updateTemplate: (id, template) =>
    api.post('/webhook/templates', {
      action: 'update',
      id,
      template
    }),
  
  deleteTemplate: (id) => 
    api.post('/webhook/templates', { 
      action: 'delete', 
      id 
    }),
  
  // Grupos
  getGroups: (instanceId) => {
    console.log('API Call: getGroups para instância:', instanceId);
    return api.post('/webhook/groups', { 
      action: 'list', 
      instanceId 
    }).then(response => {
      console.log('API Response: getGroups:', response.data);
      return response;
    });
  },
  
  // Campanhas - CORREÇÃO AQUI
  scheduleCampaign: (campaign) => 
    api.post('/webhook/campaigns', { 
      action: 'schedule', 
      campaign: {
        name: campaign.name,
        instanceId: campaign.instanceId,
        templateId: campaign.templateId,
        groupIds: campaign.groupIds,
        scheduledAt: campaign.scheduledAt
      }
    }),
  
  getCampaigns: () => 
    api.post('/webhook/campaigns', { 
      action: 'list' 
    }),
  
  deleteCampaign: (id) => 
    api.post('/webhook/campaigns', { 
      action: 'delete', 
      id 
    }),

  // Novas funções para Grupos
  updateGroupSettings: (instanceId, groupId, settings) =>
    api.post('/webhook/group-settings', {
      action: 'update',
      instanceId,
      groupId,
      settings
    }),

  updateGroupPhoto: (instanceId, groupId, photo) =>
    api.post('/webhook/group-photo', {
      action: 'update',
      instanceId,
      groupId,
      photo: photo // The photo is now just the base64 data without the prefix
    }),

  getGroupInviteLink: (instanceId, groupId) =>
    api.post('/webhook/group-invite', {
      action: 'get',
      instanceId,
      groupId
    }),

  // Novas funções para Campanhas
  updateCampaign: (campaignId, campaignData) =>
    api.post('/webhook/campaigns', {
      action: 'update',
      id: campaignId,
      campaign: campaignData
    }),

  updateCampaignStatus: (campaignId, status) =>
    api.post('/webhook/campaigns', {
      action: 'updateStatus',
      id: campaignId,
      status: status
    }),

  // Novas funções para envio de mensagens
  sendMessages: (instanceId, groupId, messages) =>
    api.post('/webhook/messages', {
      action: 'send',
      instanceId,
      groupId,
      messages
    }),

  sendBulkMessages: (instanceId, groupIds, messages) =>
    api.post('/webhook/messages', {
      action: 'sendBulk',
      instanceId,
      groupIds,
      messages
    }),

  // Função para enviar mensagem em tempo real
  sendRealtimeMessage: (instanceId, groupId, message) =>
    api.post('/webhook/messages', {
      action: 'sendRealtime',
      instanceId,
      groupId,
      message
    }),
};

export default api; 