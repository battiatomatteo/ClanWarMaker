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

  // Clash of Clans API integration
  app.get("/api/clash-players/:clanTag", async (req, res) => {
    try {
      const { clanTag } = req.params;
      const apiKey = process.env.CLASH_API_KEY || process.env.COC_API_KEY || "";
      
      if (!apiKey) {
        return res.status(500).json({ message: "API Key di Clash of Clans non configurata" });
      }
      
      const response = await fetch(`https://api.clashofclans.com/v1/clans/%23${clanTag.replace('#', '')}/members`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      const data = await response.json();
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
      console.error('Clash API Error:', error);
      res.status(500).json({ message: "Errore nel recupero dei dati da Clash of Clans API" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
