import { type PlayerRegistration, type InsertPlayerRegistration, type Clan, type InsertClan, type CwlMessage, type InsertCwlMessage } from "@shared/schema";
import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";

export interface IStorage {
  // Player registrations
  getPlayerRegistrations(): Promise<PlayerRegistration[]>;
  addPlayerRegistration(registration: InsertPlayerRegistration): Promise<PlayerRegistration>;
  clearPlayerRegistrations(): Promise<void>;
  
  // Clans
  getClans(): Promise<Clan[]>;
  addClan(clan: InsertClan): Promise<Clan>;
  
  // CWL Messages
  saveCwlMessage(message: InsertCwlMessage): Promise<CwlMessage>;
  
  // File operations
  saveToFile(filename: string, content: string): Promise<void>;
  readFromFile(filename: string): Promise<string>;
  clearFile(filename: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private playerRegistrations: Map<string, PlayerRegistration>;
  private clans: Map<string, Clan>;
  private cwlMessages: Map<string, CwlMessage>;
  private dataDir: string;

  constructor() {
    this.playerRegistrations = new Map();
    this.clans = new Map();
    this.cwlMessages = new Map();
    this.dataDir = path.join(process.cwd(), 'data');
    this.ensureDataDir();
  }

  private async ensureDataDir(): Promise<void> {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  }

  async getPlayerRegistrations(): Promise<PlayerRegistration[]> {
    return Array.from(this.playerRegistrations.values());
  }

  async addPlayerRegistration(insertRegistration: InsertPlayerRegistration): Promise<PlayerRegistration> {
    const id = randomUUID();
    const registration: PlayerRegistration = {
      ...insertRegistration,
      id,
      registeredAt: new Date(),
    };
    this.playerRegistrations.set(id, registration);
    
    // Also save to file
    const fileContent = `${registration.playerName} ${registration.thLevel}\n`;
    await this.appendToFile('listaIscrizioni.txt', fileContent);
    
    return registration;
  }

  async clearPlayerRegistrations(): Promise<void> {
    this.playerRegistrations.clear();
    await this.clearFile('listaIscrizioni.txt');
  }

  async getClans(): Promise<Clan[]> {
    return Array.from(this.clans.values());
  }

  async addClan(insertClan: InsertClan): Promise<Clan> {
    const id = randomUUID();
    const clan: Clan = {
      ...insertClan,
      id,
      createdAt: new Date(),
    };
    this.clans.set(id, clan);
    return clan;
  }

  async saveCwlMessage(insertMessage: InsertCwlMessage): Promise<CwlMessage> {
    const id = randomUUID();
    const message: CwlMessage = {
      ...insertMessage,
      id,
      createdAt: new Date(),
    };
    this.cwlMessages.set(id, message);
    return message;
  }

  async saveToFile(filename: string, content: string): Promise<void> {
    const filePath = path.join(this.dataDir, filename);
    await fs.writeFile(filePath, content, 'utf-8');
  }

  async readFromFile(filename: string): Promise<string> {
    const filePath = path.join(this.dataDir, filename);
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      return '';
    }
  }

  async clearFile(filename: string): Promise<void> {
    const filePath = path.join(this.dataDir, filename);
    await fs.writeFile(filePath, '', 'utf-8');
  }

  private async appendToFile(filename: string, content: string): Promise<void> {
    const filePath = path.join(this.dataDir, filename);
    await fs.appendFile(filePath, content, 'utf-8');
  }
}

export const storage = new MemStorage();
