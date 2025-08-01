import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPlayerRegistrationSchema, insertClanSchema, type ClashPlayer } from "@shared/schema";
import { z } from "zod";
import PDFDocument from "pdfkit";

export async function registerRoutes(app: Express): Promise<Server> {
  // Player registration endpoints
  app.get("/api/player-registrations", async (req, res) => {
    try {
      const registrations = await storage.getPlayerRegistrations();
      res.json(registrations);
    } catch (error) {
      res.status(500).json({ message: "Errore nel recupero delle registrazioni" });
    }
  });

  app.post("/api/player-registrations", async (req, res) => {
    try {
      const validatedData = insertPlayerRegistrationSchema.parse(req.body);
      const registration = await storage.addPlayerRegistration(validatedData);
      res.json(registration);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Dati non validi", errors: error.errors });
      } else {
        res.status(500).json({ message: "Errore durante la registrazione" });
      }
    }
  });

  app.delete("/api/player-registrations", async (req, res) => {
    try {
      await storage.clearPlayerRegistrations();
      res.json({ message: "Registrazioni cancellate con successo" });
    } catch (error) {
      res.status(500).json({ message: "Errore durante la cancellazione" });
    }
  });

  // Get registrations file content
  app.get("/api/registrations-file", async (req, res) => {
    try {
      const content = await storage.readFromFile('registrazioni.json');
      res.json({ content: content || '[]', isEmpty: !content || content.trim() === '[]' });
    } catch (error) {
      res.json({ content: '[]', isEmpty: true });
    }
  });

  // Clan endpoints
  app.get("/api/clans", async (req, res) => {
    try {
      const clans = await storage.getClans();
      res.json(clans);
    } catch (error) {
      res.status(500).json({ message: "Errore nel recupero dei clan" });
    }
  });

  app.post("/api/clans", async (req, res) => {
    try {
      const validatedData = insertClanSchema.parse(req.body);
      const clan = await storage.addClan(validatedData);
      res.json(clan);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Dati clan non validi", errors: error.errors });
      } else {
        res.status(500).json({ message: "Errore durante la creazione del clan" });
      }
    }
  });

  // CWL message generation
  app.post("/api/generate-message", async (req, res) => {
    try {
      const { clans } = req.body;
      const registrations = await storage.getPlayerRegistrations();
      
      let message = "";
      
      for (const clan of clans) {
        if (!clan.name || !clan.participants || !clan.league) continue;
        
        message += `${clan.league}\n\n`;
        message += `${clan.name} ${clan.participants} partecipanti\n\n`;
        
        // Get registered players for this clan (simplified - in real app you'd have clan assignment logic)
        const clanPlayers = registrations.slice(0, clan.participants);
        
        clanPlayers.forEach((player, index) => {
          message += `${index + 1}) ${player.playerName} ${player.thLevel}\n`;
        });
        
        const missingPlayers = Math.max(0, clan.participants - clanPlayers.length);
        if (missingPlayers > 0) {
          message += `\nMancano ancora ${missingPlayers} player\n`;
        }
        
        message += "\n---\n\n";
      }
      
      await storage.saveCwlMessage({ content: message });
      res.json({ message });
    } catch (error) {
      res.status(500).json({ message: "Errore nella generazione del messaggio" });
    }
  });

  // PDF export
  app.post("/api/export-pdf", async (req, res) => {
    try {
      const { message } = req.body;
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="cwl-message.pdf"');
      
      const doc = new PDFDocument();
      doc.pipe(res);
      
      doc.fontSize(16).text('Messaggio CWL', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(message);
      
      doc.end();
    } catch (error) {
      res.status(500).json({ message: "Errore nella generazione del PDF" });
    }
  });

  app.get("/api/clash-players/", (req, res) => {
    return res.status(400).json({
      message: "Tag clan mancante",
      details: "Devi specificare un tag clan nell'URL"
    });
  });

  // Clash of Clans API integration
  /*  app.get("/api/clash-players/:clanTag", async (req, res) => {
      try {
        const { clanTag } = req.params;
        if (!clanTag || clanTag.trim() === "") {
          return res.status(400).json({
            message: "Tag clan mancante",
            details: "Devi specificare un tag clan nell'URL"
          });
        }
              const apiKey = process.env.CLASH_API_KEY || process.env.COC_API_KEY || process.env.CLASH_API_KEY_2 || "";
        
        console.log('Clan tag richiesto:', clanTag);
        console.log('API Key presente:', !!apiKey);
        
        if (!apiKey) {
          return res.status(500).json({ 
            message: "API Key di Clash of Clans non configurata",
            details: "Configura CLASH_API_KEY nelle variabili d'ambiente"
          });
        }
        
        // Pulisci e formatta il tag clan
        const cleanTag = clanTag.replace(/[^A-Z0-9]/g, '').toUpperCase();
        const apiUrl = `https://api.clashofclans.com/v1/clans/%23${cleanTag}/members`;
        
        console.log('URL API:', apiUrl);
        
        const response = await fetch(apiUrl, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Accept': 'application/json'
          }
        });

        // Debug rapido: stampa la risposta come testo
        const debugText = await response.text();
        console.log('Risposta API (debug):', debugText);

        // Per continuare a usare la risposta come JSON, puoi fare:
        let data;
        try {
          data = JSON.parse(debugText);
        } catch (e) {
          return res.status(500).json({ 
            message: "Risposta non valida dall'API Clash of Clans",
            details: debugText
          });
        }
        
        console.log('Risposta API status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Errore API Response:', errorText);
          
          if (response.status === 404) {
            return res.status(404).json({ 
              message: "Clan non trovato", 
              details: `Il tag clan "${clanTag}" non esiste o non è valido`
            });
          }
          
          if (response.status === 403) {
            return res.status(403).json({ 
              message: "API Key non valida o non autorizzata",
              details: "Verifica che la tua API Key sia corretta e autorizzata per questo IP"
            });
          }
          
          throw new Error(`API Error: ${response.status} - ${errorText}`);
        }
        
        data = await response.json();
        console.log('Dati ricevuti:', data.items?.length || 0, 'membri');
        
        if (!data.items || !Array.isArray(data.items)) {
          return res.status(500).json({ 
            message: "Formato dati API non valido",
            details: "La risposta dell'API non contiene la lista dei membri"
          });
        }
        
        const players: ClashPlayer[] = data.items.map((member: any) => ({
          name: member.name,
          tag: member.tag,
          townHallLevel: member.townHallLevel,
          warStars: member.warStars || 0,
          trophies: member.trophies,
          bestTrophies: member.bestTrophies,
          legendStatistics: member.legendStatistics
        }));
        
        res.json(players);
      } catch (error) {
        console.error('Clash API Error completo:', error);
        res.status(500).json({ 
          message: "Errore nel recupero dei dati da Clash of Clans API",
          details: error instanceof Error ? error.message : "Errore sconosciuto"
        });
      }
    });*/

    app.get("/api/clash-players/:clanTag", async (req, res) => {
    try {
      const { clanTag } = req.params;
      if (!clanTag || clanTag.trim() === "") {
        return res.status(400).json({
          message: "Tag clan mancante",
          details: "Devi specificare un tag clan nell'URL"
        });
      }
      const apiKey = process.env.CLASH_API_KEY || process.env.COC_API_KEY || process.env.CLASH_API_KEY_2 || "";

      if (!apiKey) {
        return res.status(500).json({ 
          message: "API Key di Clash of Clans non configurata",
          details: "Configura CLASH_API_KEY nelle variabili d'ambiente"
        });
      }

      // Pulisci solo il # iniziale, se presente
      const cleanTag = clanTag.replace(/^#/, '').toUpperCase();
      const apiUrl = `https://api.clashofclans.com/v1/clans/%23${cleanTag}/members`;

      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json'
        }
      });

      const debugText = await response.text();
      let data;
      try {
        data = JSON.parse(debugText);
      } catch (e) {
        return res.status(500).json({ 
          message: "Risposta non valida dall'API Clash of Clans",
          details: debugText
        });
      }

      if (!response.ok) {
        if (response.status === 404) {
          return res.status(404).json({ 
            message: "Clan non trovato", 
            details: `Il tag clan "${clanTag}" non esiste o non è valido`
          });
        }
        if (response.status === 403) {
          return res.status(403).json({ 
            message: "API Key non valida o non autorizzata",
            details: "Verifica che la tua API Key sia corretta e autorizzata per questo IP"
          });
        }
        return res.status(response.status).json({
          message: "Errore nel recupero dei dati da Clash of Clans API",
          details: debugText
        });
      }

      if (!data.items || !Array.isArray(data.items)) {
        return res.status(500).json({ 
          message: "Formato dati API non valido",
          details: "La risposta dell'API non contiene la lista dei membri"
        });
      }

      const players: ClashPlayer[] = data.items.map((member: any) => ({
        name: member.name,
        tag: member.tag,
        townHallLevel: member.townHallLevel,
        warStars: member.warStars || 0,
        trophies: member.trophies,
        bestTrophies: member.bestTrophies,
        legendStatistics: member.legendStatistics
      }));

      res.json(players);
    } catch (error) {
      console.error('Clash API Error completo:', error);
      res.status(500).json({ 
        message: "Errore nel recupero dei dati da Clash of Clans API",
        details: error instanceof Error ? error.message : "Errore sconosciuto"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
