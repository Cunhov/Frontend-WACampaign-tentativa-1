#!/bin/bash

# Limpar diretórios e arquivos desnecessários
echo "Limpando diretórios e arquivos desnecessários..."
rm -rf node_modules
rm -rf build
rm -rf .git
rm -rf .vscode
rm -rf .idea
rm -f .env
rm -f .DS_Store
rm -f *.log

# Instalar todas as dependências necessárias
echo "Instalando todas as dependências..."
npm install --legacy-peer-deps
npm install -g react-scripts
npm install luxon react-icons react-datetime-picker react-calendar react-clock --legacy-peer-deps

# Criar build do React
echo "Criando build do React..."
npm run build

# Criar arquivo zip
echo "Criando arquivo zip..."
zip -r deploy.zip . -x "node_modules/*" ".git/*" ".vscode/*" ".idea/*" "*.log" ".DS_Store" "prepare-deploy.sh"

echo "Arquivo deploy.zip criado com sucesso!" 