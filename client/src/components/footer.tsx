import { Shield, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-8 mt-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Shield className="h-5 w-5" />
              <span className="font-semibold">CWL Manager</span>
            </div>
            <p className="text-gray-400 text-sm">Sistema di gestione per Clan War League di Clash of Clans</p>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Funzionalità</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>Registrazione Player</li>
              <li>Gestione Clan</li>
              <li>Export PDF</li>
              <li>Statistiche Player</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Contatti</h4>
            <div className="space-y-2 text-sm text-gray-400">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>admin@cwlmanager.it</span>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-8 pt-4 text-center text-sm text-gray-400">
          <p>&copy; 2024 CWL Manager. Tutti i diritti riservati.</p>
        </div>
      </div>
    </footer>
  );
}
