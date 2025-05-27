import React, { useState, useEffect } from 'react';
import { apiCalls } from '../utils/api';

function Instances() {
  const [instances, setInstances] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    apiKey: ''
  });

  useEffect(() => {
    console.log('useEffect acionado. Chamando loadInstances...');
    loadInstances();
  }, []);

  const loadInstances = async () => {
    console.log('Iniciando loadInstances...');
    try {
      console.log('Chamando apiCalls.getInstances()...');
      const response = await apiCalls.getInstances();
      console.log('Resposta do webhook:', response.data);
      
      // Verifica se response.data existe e é um objeto
      if (!response.data || typeof response.data !== 'object' || Object.keys(response.data).length === 0) {
        console.error('Formato de dados inválido ou vazio:', response.data);
        setInstances([]);
        return;
      }

      // Processa cada instância diretamente do objeto retornado
      const instancesObject = response.data;
      console.log('Objeto de instâncias bruto:', instancesObject);
      
      // Converte o objeto em um array de instâncias
      const instancesArray = Object.entries(instancesObject).map(([key, value]) => {
        try {
          console.log(`Tentando parsear instância com chave ${key}:`, value);
          const instance = JSON.parse(value);
          console.log(`Instância parseada com sucesso ${key}:`, instance);
          return instance;
        } catch (parseError) {
          console.error(`Erro ao parsear instância ${key}:`, parseError);
          return null;
        }
      }).filter(instance => instance !== null);

      console.log('Instâncias processadas (antes de setar o estado):', instancesArray);
      setInstances(instancesArray);
      console.log('Estado de instâncias atualizado.');
    } catch (error) {
      console.error('Erro geral ao carregar instâncias:', error);
      setInstances([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiCalls.saveInstance(formData);
      setShowForm(false);
      setFormData({ name: '', url: '', apiKey: '' });
      loadInstances();
    } catch (error) {
      console.error('Erro ao salvar instância:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja deletar esta instância?')) {
      try {
        await apiCalls.deleteInstance(id);
        loadInstances();
      } catch (error) {
        console.error('Erro ao deletar instância:', error);
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Instâncias Evolution API</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
        >
          Nova Instância
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-xl font-bold mb-4">Adicionar Instância</h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Nome da Instância
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  URL do Servidor
                </label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({...formData, url: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="https://evolution.exemplo.com"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  API Key
                </label>
                <input
                  type="text"
                  value={formData.apiKey}
                  onChange={(e) => setFormData({...formData, apiKey: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {instances.map((instance) => (
          <div key={instance.id} className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-bold text-lg mb-2">{instance.name}</h3>
            <p className="text-gray-600 text-sm mb-1">URL: {instance.url}</p>
            <p className="text-gray-600 text-sm mb-3">API Key: {instance.apiKey.substring(0, 20)}...</p>
            <div className="flex justify-between">
              <span className={`px-2 py-1 rounded text-xs ${instance.status === 'connected' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {instance.status === 'connected' ? 'Conectado' : 'Desconectado'}
              </span>
              <button
                onClick={() => handleDelete(instance.id)}
                className="text-red-500 hover:text-red-700"
              >
                Deletar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Instances; 