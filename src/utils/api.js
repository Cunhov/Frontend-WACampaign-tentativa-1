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
        templateName: campaign.templateName,
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

  // Funções para envio de mídia em binário
  sendMediaMessage: (instanceId, groupId, file, caption = '') => {
    const formData = new FormData();
    
    // Adiciona o corpo da mensagem no mesmo formato das mensagens de texto
    const messageBody = {
      action: 'sendBulk',
      instanceId: instanceId,
      groupIds: [groupId],
      messages: [{
        id: Date.now(),
        type: file.type.startsWith('image/') ? 'image' :
              file.type.startsWith('video/') ? 'video' :
              file.type.startsWith('audio/') ? 'audio' : 'document',
        content: caption,
        options: null,
        mentionAll: false,
        delay: 0,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size
      }]
    };

    // Adiciona todos os campos ao FormData
    formData.append('action', 'sendMedia');
    formData.append('instanceId', instanceId);
    formData.append('groupId', groupId);
    formData.append('file', file);
    formData.append('body', JSON.stringify(messageBody));
    formData.append('messages', JSON.stringify(messageBody.messages));

    return api.post('/webhook/messages', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  sendBulkMediaMessages: async (instanceId, groupIds, files, options = {}) => {
    const formData = new FormData();
    
    // Adiciona o corpo da mensagem no mesmo formato das mensagens de texto
    const messageBody = {
      action: 'sendBulk',
      instanceId: instanceId,
      groupIds: groupIds,
      messages: files.map((file, index) => ({
        id: Date.now() + index,
        type: file.type.startsWith('image/') ? 'image' :
              file.type.startsWith('video/') ? 'video' :
              file.type.startsWith('audio/') ? 'audio' : 'document',
        content: '',
        options: null,
        mentionAll: false,
        delay: options.delayBetweenMessages || 0,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size
      }))
    };

    // Adiciona todos os campos ao FormData
    formData.append('action', 'sendBulkMedia');
    formData.append('instanceId', instanceId);
    formData.append('groupIds', JSON.stringify(groupIds));
    formData.append('body', JSON.stringify(messageBody));
    formData.append('messages', JSON.stringify(messageBody.messages));
    
    // Adiciona cada arquivo ao FormData
    files.forEach((file, index) => {
      formData.append(`file${index}`, file);
    });

    return api.post('/webhook/messages', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  updateGroupPhotoBinary: (instanceId, groupId, file) => {
    const formData = new FormData();
    
    // Adiciona o corpo da mensagem no mesmo formato
    const messageBody = {
      action: 'updatePhoto',
      instanceId: instanceId,
      groupId: groupId,
      photo: {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        timestamp: new Date().toISOString()
      }
    };

    // Adiciona todos os campos ao FormData
    formData.append('action', 'updatePhoto');
    formData.append('instanceId', instanceId);
    formData.append('groupId', groupId);
    formData.append('file', file);
    formData.append('body', JSON.stringify(messageBody));

    return api.post('/webhook/group-photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  // Modificar a função existente updateGroupPhoto para usar a nova versão binária
  updateGroupPhoto: (instanceId, groupId, photo) => {
    // Se a foto for um arquivo (File object), usa a versão binária
    if (photo instanceof File) {
      return apiCalls.updateGroupPhotoBinary(instanceId, groupId, photo);
    }
    // Se for base64, mantém o comportamento antigo
    return api.post('/webhook/group-photo', {
      action: 'update',
      instanceId,
      groupId,
      photo
    });
  },

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
  
  sendBulkMessages: async (instanceId, groupIds, messages, options = {}) => {
    console.log('Enviando mensagens em massa:', { 
      instanceId, 
      groupCount: groupIds.length, 
      messageCount: messages.length 
    });
    
    const response = await api.post('/webhook/messages', {
      action: 'sendBulk',
      instanceId,
      groupIds,
      messages,
      options: {
        delayBetweenMessages: 2000, // 2 segundos entre mensagens
        ...options
      }
    });
    
    return response;
  },

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