import React, { useState, useRef } from 'react';
import { FiPlus, FiTrash2, FiImage, FiFile, FiVideo, FiMusic, FiList, FiUsers, FiType } from 'react-icons/fi';

const MessageEditor = ({ onSave, initialMessages = [] }) => {
  const [messages, setMessages] = useState(initialMessages);
  const [selectedMessageIndex, setSelectedMessageIndex] = useState(null);
  const fileInputRef = useRef(null);

  const messageTypes = {
    text: { icon: <FiType />, label: 'Texto' },
    image: { icon: <FiImage />, label: 'Imagem' },
    video: { icon: <FiVideo />, label: 'Vídeo' },
    audio: { icon: <FiMusic />, label: 'Áudio' },
    document: { icon: <FiFile />, label: 'Documento' },
    button: { icon: <FiList />, label: 'Botões' },
    list: { icon: <FiList />, label: 'Lista' },
    contact: { icon: <FiUsers />, label: 'Contato' }
  };

  const addMessage = (type) => {
    const newMessage = {
      id: Date.now(),
      type,
      content: '',
      options: type === 'button' ? [] : null,
      mentionAll: false,
      delay: 0
    };
    setMessages([...messages, newMessage]);
    setSelectedMessageIndex(messages.length);
  };

  const removeMessage = (index) => {
    const newMessages = messages.filter((_, i) => i !== index);
    setMessages(newMessages);
    if (selectedMessageIndex === index) {
      setSelectedMessageIndex(null);
    } else if (selectedMessageIndex > index) {
      setSelectedMessageIndex(selectedMessageIndex - 1);
    }
  };

  const updateMessage = (index, field, value) => {
    const newMessages = [...messages];
    newMessages[index] = { ...newMessages[index], [field]: value };
    setMessages(newMessages);
  };

  const handleFileUpload = (type, event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newMessages = [...messages];
        newMessages[selectedMessageIndex] = {
          ...newMessages[selectedMessageIndex],
          content: e.target.result,
          fileName: file.name
        };
        setMessages(newMessages);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    console.log('MessageEditor: handleSave chamado.');
    console.log('MessageEditor: Salvando mensagens:', messages);
    onSave(messages);
    console.log('MessageEditor: onSave chamado.');
  };

  const renderMessageEditor = (message, index) => {
    switch (message.type) {
      case 'text':
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={`mentionAll-${index}`}
                checked={message.mentionAll}
                onChange={(e) => updateMessage(index, 'mentionAll', e.target.checked)}
                className="form-checkbox h-4 w-4 text-blue-600"
              />
              <label htmlFor={`mentionAll-${index}`} className="text-sm text-gray-700">
                Mencionar todos os membros
              </label>
            </div>
            <textarea
              value={message.content}
              onChange={(e) => updateMessage(index, 'content', e.target.value)}
              className="w-full h-32 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Digite sua mensagem..."
            />
          </div>
        );

      case 'button':
        return (
          <div className="space-y-4">
            <textarea
              value={message.content}
              onChange={(e) => updateMessage(index, 'content', e.target.value)}
              className="w-full h-24 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Digite o texto dos botões (um por linha)..."
            />
            <div className="space-y-2">
              {message.content.split('\n').map((button, i) => (
                <div key={i} className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">{i + 1}.</span>
                  <input
                    type="text"
                    value={button}
                    onChange={(e) => {
                      const buttons = message.content.split('\n');
                      buttons[i] = e.target.value;
                      updateMessage(index, 'content', buttons.join('\n'));
                    }}
                    className="flex-1 p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={`Botão ${i + 1}`}
                  />
                </div>
              ))}
            </div>
          </div>
        );

      case 'list':
        return (
          <div className="space-y-4">
            <input
              type="text"
              value={message.content}
              onChange={(e) => updateMessage(index, 'content', e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Título da lista"
            />
            <textarea
              value={message.options?.join('\n') || ''}
              onChange={(e) => updateMessage(index, 'options', e.target.value.split('\n'))}
              className="w-full h-32 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Digite os itens da lista (um por linha)..."
            />
          </div>
        );

      case 'contact':
        return (
          <div className="space-y-4">
            <input
              type="text"
              value={message.content}
              onChange={(e) => updateMessage(index, 'content', e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Nome do contato"
            />
            <input
              type="tel"
              value={message.phone || ''}
              onChange={(e) => updateMessage(index, 'phone', e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Número do telefone"
            />
          </div>
        );

      default:
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Clique para fazer upload</span> ou arraste e solte
                  </p>
                  <p className="text-xs text-gray-500">
                    {message.type === 'image' && 'PNG, JPG ou GIF (MAX. 2MB)'}
                    {message.type === 'video' && 'MP4 ou MOV (MAX. 16MB)'}
                    {message.type === 'audio' && 'MP3 ou OGG (MAX. 16MB)'}
                    {message.type === 'document' && 'PDF, DOC, DOCX (MAX. 16MB)'}
                  </p>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept={
                    message.type === 'image' ? 'image/*' :
                    message.type === 'video' ? 'video/*' :
                    message.type === 'audio' ? 'audio/*' :
                    '.pdf,.doc,.docx'
                  }
                  onChange={(e) => handleFileUpload(message.type, e)}
                />
              </label>
            </div>
            {message.fileName && (
              <div className="text-sm text-gray-600">
                Arquivo selecionado: {message.fileName}
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Editor de Mensagens</h2>
        <button
          type="button"
          onClick={handleSave}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Salvar Mensagens
        </button>
      </div>

      <div className="space-y-6">
        {messages.map((message, index) => (
          <div
            key={message.id}
            className={`p-4 border rounded-lg ${
              selectedMessageIndex === index ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
            }`}
          >
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center space-x-2">
                <span className="text-gray-600">{messageTypes[message.type].icon}</span>
                <span className="font-medium">{messageTypes[message.type].label}</span>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={message.delay}
                  onChange={(e) => updateMessage(index, 'delay', parseInt(e.target.value) || 0)}
                  className="w-20 p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Delay (s)"
                  min="0"
                />
                <button
                  onClick={() => removeMessage(index)}
                  className="p-2 text-red-500 hover:text-red-700 transition-colors"
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>
            {renderMessageEditor(message, index)}
          </div>
        ))}

        <div className="flex flex-wrap gap-2">
          {Object.entries(messageTypes).map(([type, { icon, label }]) => (
            <button
              key={type}
              onClick={() => addMessage(type)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {icon}
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MessageEditor; 