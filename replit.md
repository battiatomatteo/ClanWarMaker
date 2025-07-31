# CWL Manager - Clash of Clans CWL Management System

## Overview

This is a web application designed to manage Clan War League (CWL) for Clash of Clans. The system allows players to register for CWL events, enables clan administrators to manage participants, and provides tools for exporting data and generating messages. The application is built with a modern full-stack architecture using React, Express, and PostgreSQL.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **UI Library**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens
- **State Management**: TanStack Query (React Query) for server state
- **Form Handling**: React Hook Form with Zod validation
- **Build Tool**: Vite for development and bundling

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM
- **Database**: Neon PostgreSQL (configured but can use any PostgreSQL instance)
- **Validation**: Zod schemas shared between client and server
- **Session Storage**: In-memory storage with file persistence fallback

### Project Structure
- `/client` - React frontend application
- `/server` - Express.js backend API
- `/shared` - Shared TypeScript schemas and types
- `/migrations` - Database migration files

## Key Components

### Database Schema
The application uses three main tables:
- **player_registrations**: Stores player registration data (name, Town Hall level)
- **clans**: Manages clan information (name, participants, league)
- **cwl_messages**: Stores generated CWL messages

### API Endpoints
- `GET/POST /api/player-registrations` - Player registration management
- `DELETE /api/player-registrations` - Clear all registrations
- `GET/POST /api/clans` - Clan management
- `POST /api/generate-message` - Generate CWL messages
- `POST /api/export-pdf` - Export data to PDF
- `GET /api/clash-players/:clanTag` - Fetch Clash of Clans player data

### Frontend Pages
- **Home Page**: Welcome page with clan information and navigation
- **Player Registration**: Form for players to register for CWL
- **Admin Panel**: Management interface for administrators
- **404 Page**: Error handling for unknown routes

## Data Flow

1. **Player Registration**: Players submit registration forms which are validated on both client and server
2. **Data Storage**: Registration data is stored in PostgreSQL via Drizzle ORM
3. **Admin Management**: Administrators can view registrations, manage clans, and export data
4. **PDF Generation**: System can generate PDF reports of CWL data
5. **Real-time Updates**: React Query manages cache invalidation and real-time data updates

## External Dependencies

### Core Dependencies
- **Database**: Neon PostgreSQL serverless database
- **UI Components**: Extensive Radix UI component library
- **Validation**: Zod for runtime type checking and validation
- **PDF Generation**: PDFKit for server-side PDF creation
- **Date Handling**: date-fns for date manipulation

### Development Tools
- **TypeScript**: Full type safety across the stack
- **Drizzle Kit**: Database migrations and schema management
- **ESBuild**: Fast bundling for production builds
- **Replit Integration**: Special plugins for Replit development environment

## Deployment Strategy

### Development
- Uses Vite dev server with HMR (Hot Module Replacement)
- Express server runs with tsx for TypeScript execution
- Development and production modes configured via NODE_ENV

### Production Build
- Frontend: Vite builds static assets to `/dist/public`
- Backend: ESBuild bundles server code to `/dist/index.js`
- Single production command starts the Express server serving both API and static files

### Database Management
- Drizzle Kit handles schema migrations
- Database URL configured via environment variable
- Automatic UUID generation for primary keys
- Timestamp tracking for all records

### Key Architectural Decisions

**Monorepo Structure**: Single repository with client/server/shared separation allows for code sharing and simplified deployment while maintaining clear boundaries.

**Shared Schema Approach**: Using Zod schemas in the `/shared` directory ensures type safety and validation consistency between frontend and backend.

**Memory + File Storage**: Hybrid storage approach with automatic JSON persistence. Registrations are saved to `data/registrazioni.json` and restored on server restart, eliminating data loss while maintaining development simplicity.

**Component-First UI**: Shadcn/ui provides a comprehensive, customizable component system that maintains consistency while allowing for easy theming and modifications.

**Query-Based State Management**: TanStack Query eliminates the need for complex client-side state management by focusing on server state synchronization and caching.

## Recent Changes: Latest modifications with dates

### 31 Luglio 2025 - Sistema Persistenza Dati
- ✅ **Persistenza automatica**: Dati registrazioni salvati in file JSON (data/registrazioni.json)
- ✅ **Ripristino al riavvio**: Registrazioni vengono caricate automaticamente all'avvio del server
- ✅ **Indicatori stato file**: Interfaccia admin mostra stato persistenza in tempo reale
- ✅ **Cancellazione controllata**: Pulsante admin svuota sia memoria che file persistente
- ✅ **Logging migliorato**: Console mostra operazioni di salvataggio e caricamento dati

### 30 Luglio 2025 - Miglioramenti Admin Panel
- ✅ **Sistema gestione player tra clan**: Aggiunta sezione per scambiare player tra liste prima del PDF
- ✅ **Miglioramento API Clash of Clans**: Aggiunta gestione errori dettagliata e debugging
- ✅ **Interfaccia ricerca clan migliorata**: Istruzioni chiare per trovare il tag clan
- ✅ **Funzionalità drag & drop**: Player possono essere spostati tra clan e riordinati
- ✅ **Configurazione API key**: Integrata gestione chiave API Clash of Clans