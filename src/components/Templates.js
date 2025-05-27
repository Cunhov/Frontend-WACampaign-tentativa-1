import React, { useState, useEffect } from 'react';
import { apiCalls } from '../utils/api';
import MessageEditor from './MessageEditor';

function Templates() {
  const [templates, setTemplates] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    messages: []
  });
  const [filter, setFilter] = useState('');
  const [sortBy, setSortBy] = useState('name');

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      console.log('Iniciando loadTemplates...');
      const response = await apiCalls.getTemplates();
      console.log('Resposta da API (templates):', response.data);
      
      // Verifica se a resposta tem o formato esperado do n8n
      if (response.data && typeof response.data === 'object') {
        // Se for um objeto com a propriedade templates
        if (response.data.templates && Array.isArray(response.data.templates)) {
          setTemplates(response.data.templates);
        } 
        // Se for um objeto com chaves que começam com "template:"
        else if (Object.keys(response.data).some(key => key.startsWith('template:'))) {
          const templatesArray = Object.entries(response.data)
            .filter(([key]) => key.startsWith('template:'))
            .map(([_, value]) => {
              try {
                return typeof value === 'string' ? JSON.parse(value) : value;
              } catch (e) {
                console.error('Erro ao parsear template:', e);
                return null;
              }
            })
            .filter(template => template !== null);
          setTemplates(templatesArray);
        }
        // Se for um array direto
        else if (Array.isArray(response.data)) {
          setTemplates(response.data);
        } else {
          console.error('Formato de resposta inválido:', response.data);
          setTemplates([]);
        }
      } else {
        console.error('Formato de resposta inválido:', response.data);
        setTemplates([]);
      }
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
      setTemplates([]);
      alert('Erro ao carregar templates: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTemplate) {
        await apiCalls.updateTemplate(editingTemplate.id, formData);
        alert('Template atualizado com sucesso!');
      } else {
        await apiCalls.saveTemplate(formData);
        alert('Template criado com sucesso!');
      }
      await loadTemplates(); // Recarrega os templates antes de fechar o formulário
      setShowForm(false);
      setEditingTemplate(null);
      setFormData({
        name: '',
        description: '',
        messages: []
      });
    } catch (error) {
      console.error('Erro ao salvar template:', error);
      alert('Erro ao salvar template: ' + (error.response?.data?.message || error.message));
    }
  };

  const startEditTemplate = (template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description,
      messages: template.messages || []
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja deletar este template?')) {
      try {
        await apiCalls.deleteTemplate(id);
        loadTemplates();
      } catch (error) {
        console.error('Erro ao deletar template:', error);
        alert('Erro ao deletar template: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const filteredAndSortedTemplates = templates
    .filter(template =>
      template.name.toLowerCase().includes(filter.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Templates</h1>
        <button
          onClick={() => {
            setEditingTemplate(null);
            setFormData({
              name: '',
              description: '',
              messages: []
            });
            setShowForm(true);
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Novo Template
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Filtrar por nome
            </label>
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Digite para filtrar..."
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Ordenar por
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="name">Nome (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              {editingTemplate ? 'Editar Template' : 'Novo Template'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Nome do Template
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="3"
                />
              </div>

              <MessageEditor
                onSave={(messages) => setFormData({ ...formData, messages })}
                initialMessages={formData.messages}
              />

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingTemplate(null);
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  {editingTemplate ? 'Atualizar' : 'Criar'} Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAndSortedTemplates.map((template) => (
          <div
            key={template.id}
            className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-gray-800">{template.name}</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => startEditTemplate(template)}
                  className="p-2 text-blue-500 hover:text-blue-700 transition-colors"
                  title="Editar template"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDelete(template.id)}
                  className="p-2 text-red-500 hover:text-red-700 transition-colors"
                  title="Deletar template"
                >
                  🗑️
                </button>
              </div>
            </div>

            {template.description && (
              <p className="text-gray-600 mb-4">{template.description}</p>
            )}

            <div className="space-y-2">
              <div className="text-sm text-gray-500">
                {template.messages?.length || 0} mensagem(ns)
              </div>
              {template.messages?.map((message, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-2 text-sm text-gray-600"
                >
                  <span>•</span>
                  <span>{message.type}</span>
                  {message.delay > 0 && (
                    <span className="text-gray-400">
                      (delay: {message.delay}s)
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {filteredAndSortedTemplates.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Nenhum template encontrado com os filtros aplicados.
        </div>
      )}
    </div>
  );
}

export default Templates; 