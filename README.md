# CWL Manager - Clash of Clans CWL Management System

Sistema di gestione per Clan War League di Clash of Clans costruito con React e Express.

## Funzionalità

- **Registrazione Player**: Form per registrare i player con nome e livello Town Hall
- **Pannello Admin**: Gestione clan, creazione messaggi CWL, esportazione PDF
- **API Clash of Clans**: Integrazione per visualizzare statistiche player
- **Interfaccia Italiana**: Completamente localizzata in italiano

## Deployment su Render

1. Connetti questo repository a Render
2. Usa le seguenti impostazioni:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment**: Node.js
   - **Plan**: Free

## Struttura Progetto

- `client/` - Frontend React con Vite
- `server/` - Backend Express.js 
- `shared/` - Schemi TypeScript condivisi
- `render.yaml` - Configurazione Render

## API Esterne

Per utilizzare l'integrazione Clash of Clans, impostare la variabile d'ambiente:
- `CLASH_API_KEY` o `COC_API_KEY` - API key di Clash of Clans

## Local Development

```bash
npm install
npm run dev
```

L'applicazione sarà disponibile su `http://localhost:5000`