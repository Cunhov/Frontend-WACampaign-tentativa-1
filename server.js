const express = require('express');
const path = require('path');
const cron = require('node-cron');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Increase payload limit for image uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, 'build')));

// Cronjob para verificar campanhas agendadas a cada minuto
cron.schedule('* * * * *', async () => {
  try {
    console.log('Iniciando verificação de campanhas agendadas...');
    console.log('Webhook URL:', process.env.REACT_APP_N8N_WEBHOOK_URL);
    
    const response = await axios.post(`${process.env.REACT_APP_N8N_WEBHOOK_URL}/webhook/campaigns`, {
      action: 'check_scheduled_campaigns'
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.REACT_APP_N8N_API_KEY}`
      }
    });
    
    console.log('Resposta do webhook:', response.data);
    console.log('Verificação de campanhas agendadas executada com sucesso');
  } catch (error) {
    console.error('Erro ao verificar campanhas agendadas:', error.message);
    if (error.response) {
      console.error('Detalhes do erro:', {
        status: error.response.status,
        data: error.response.data
      });
    }
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log('Cronjob de verificação de campanhas ativado');
}); 