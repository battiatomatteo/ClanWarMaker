import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Settings, FileText, Download, Trash2, RefreshCw, Users, PlusCircle, ArrowLeftRight, ArrowUp, ArrowDown, Edit, Eye, Star } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { ClashPlayer, PlayerRegistration } from "@shared/schema";

interface ClanForm {
  name: string;
  participants: number;
  league: string;
}

interface ClanWithPlayers extends ClanForm {
  id: string;
  players: PlayerRegistration[];
}

interface ClanHomeInfo {
  id: string;
  name: string;
  description: string;
  tag?: string;
  league?: string;
  activeMembers?: string;
  winRate?: string;
  requirements?: string;
  nextCwlInfo?: string;
  isActive: boolean;
}

export default function AdminPage() {
  const [clans, setClans] = useState<ClanForm[]>([]);
  const [clansWithPlayers, setClansWithPlayers] = useState<ClanWithPlayers[]>([]);
  const [generatedMessage, setGeneratedMessage] = useState("");
  const [selectedClanTag, setSelectedClanTag] = useState("");
  const [showPlayerManager, setShowPlayerManager] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ClanForm>({
    defaultValues: {
      name: "",
      participants: 15,
      league: "",
    },
  });

  // Fetch player registrations
  const { data: registrations = [] } = useQuery<PlayerRegistration[]>({
    queryKey: ["/api/player-registrations"],
  });

  // Fetch file status
  const { data: fileStatus } = useQuery<{content: string, isEmpty: boolean}>({
    queryKey: ["/api/registrations-file"],
    refetchInterval: 5000, // Aggiorna ogni 5 secondi
  });

  // Fetch clash players
  const { data: clashPlayers = [], isLoading: isLoadingPlayers, error: clashError, refetch: refetchPlayers } = useQuery<ClashPlayer[]>({
    queryKey: ["/api/clash-players", selectedClanTag],
    enabled: !!selectedClanTag,
    retry: false,
  });

  // Clear registrations mutation
  const clearRegistrationsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", "/api/player-registrations");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Successo",
        description: "Registrazioni cancellate con successo",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/player-registrations"] });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Errore durante la cancellazione delle registrazioni",
        variant: "destructive",
      });
    },
  });

  // Generate message mutation
  const generateMessageMutation = useMutation({
    mutationFn: async (clansData: ClanForm[]) => {
      const response = await apiRequest("POST", "/api/generate-message", { clans: clansData });
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedMessage(data.message);
      toast({
        title: "Messaggio generato",
        description: "Il messaggio CWL è stato generato con successo",
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Errore durante la generazione del messaggio",
        variant: "destructive",
      });
    },
  });

  // Export PDF mutation
  const exportPdfMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest("POST", "/api/export-pdf", { message });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = "cwl-message.pdf";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    },
    onSuccess: () => {
      toast({
        title: "PDF esportato",
        description: "Il PDF è stato scaricato con successo",
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Errore durante l'esportazione del PDF",
        variant: "destructive",
      });
    },
  });

  const addClan = (data: ClanForm) => {
    setClans([...clans, data]);
    form.reset();
  };

  const removeClan = (index: number) => {
    setClans(clans.filter((_, i) => i !== index));
  };

  // Gestione player tra liste
  const assignPlayersToClans = () => {
    if (clans.length === 0) {
      toast({
        title: "Errore",
        description: "Aggiungi almeno un clan prima di assegnare i player",
        variant: "destructive",
      });
      return;
    }

    const newClansWithPlayers: ClanWithPlayers[] = clans.map((clan, index) => ({
      ...clan,
      id: `clan-${index}`,
      players: []
    }));

    // Distribuisci i player registrati tra i clan
    registrations.forEach((player, index) => {
      const clanIndex = index % clans.length;
      newClansWithPlayers[clanIndex].players.push(player);
    });

    setClansWithPlayers(newClansWithPlayers);
    setShowPlayerManager(true);
  };

  const movePlayer = (playerId: string, fromClanId: string, toClanId: string) => {
    setClansWithPlayers(prev => {
      const updated = [...prev];
      const fromClan = updated.find(c => c.id === fromClanId);
      const toClan = updated.find(c => c.id === toClanId);
      
      if (fromClan && toClan) {
        const playerIndex = fromClan.players.findIndex(p => p.id === playerId);
        if (playerIndex !== -1) {
          const player = fromClan.players.splice(playerIndex, 1)[0];
          toClan.players.push(player);
        }
      }
      
      return updated;
    });
  };

  const movePlayerUp = (clanId: string, playerIndex: number) => {
    if (playerIndex === 0) return;
    
    setClansWithPlayers(prev => {
      const updated = [...prev];
      const clan = updated.find(c => c.id === clanId);
      if (clan) {
        const players = [...clan.players];
        [players[playerIndex], players[playerIndex - 1]] = [players[playerIndex - 1], players[playerIndex]];
        clan.players = players;
      }
      return updated;
    });
  };

  const movePlayerDown = (clanId: string, playerIndex: number) => {
    setClansWithPlayers(prev => {
      const updated = [...prev];
      const clan = updated.find(c => c.id === clanId);
      if (clan && playerIndex < clan.players.length - 1) {
        const players = [...clan.players];
        [players[playerIndex], players[playerIndex + 1]] = [players[playerIndex + 1], players[playerIndex]];
        clan.players = players;
      }
      return updated;
    });
  };

  const handleGenerateMessage = () => {
    const dataToUse = showPlayerManager && clansWithPlayers.length > 0 ? clansWithPlayers : clans;
    
    if (dataToUse.length === 0) {
      toast({
        title: "Errore",
        description: "Aggiungi almeno un clan prima di generare il messaggio",
        variant: "destructive",
      });
      return;
    }
    
    if (showPlayerManager) {
      generateMessageFromAssignedPlayers();
    } else {
      generateMessageMutation.mutate(clans);
    }
  };

  const generateMessageFromAssignedPlayers = () => {
    let message = "";
    
    clansWithPlayers.forEach((clan) => {
      message += `${clan.league}\n\n`;
      message += `${clan.name} ${clan.participants} partecipanti\n\n`;
      
      clan.players.forEach((player, index) => {
        message += `${index + 1}) ${player.playerName} ${player.thLevel}\n`;
      });
      
      const missingPlayers = Math.max(0, clan.participants - clan.players.length);
      if (missingPlayers > 0) {
        message += `\nMancano ancora ${missingPlayers} player\n`;
      }
      
      message += "\n---\n\n";
    });
    
    setGeneratedMessage(message);
    toast({
      title: "Messaggio generato",
      description: "Il messaggio CWL è stato generato con successo",
    });
  };

  const handleExportPdf = () => {
    if (!generatedMessage) {
      toast({
        title: "Errore",
        description: "Genera prima un messaggio da esportare",
        variant: "destructive",
      });
      return;
    }
    exportPdfMutation.mutate(generatedMessage);
  };

  const handleClearRegistrations = () => {
    if (window.confirm("Sei sicuro di voler cancellare tutte le registrazioni?")) {
      clearRegistrationsMutation.mutate();
    }
  };

  const getTHBadgeColor = (thLevel: number) => {
    if (thLevel >= 15) return "bg-blue-100 text-blue-800";
    if (thLevel >= 12) return "bg-green-100 text-green-800";
    if (thLevel >= 9) return "bg-yellow-100 text-yellow-800";
    return "bg-gray-100 text-gray-800";
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Admin Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Pannello Amministratore</h2>
              <p className="text-gray-600">Gestisci clan, genera messaggi CWL e visualizza statistiche player</p>
            </div>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={handleClearRegistrations}
                disabled={clearRegistrationsMutation.isPending || registrations.length === 0}
                className="bg-warning text-white hover:bg-yellow-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {clearRegistrationsMutation.isPending ? "Cancellando..." : "Svuota Registrazioni"}
              </Button>
              <Button
                onClick={handleExportPdf}
                disabled={exportPdfMutation.isPending || !generatedMessage}
                className="bg-error text-white hover:bg-red-600"
              >
                <Download className="mr-2 h-4 w-4" />
                Esporta PDF
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CWL Message Builder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5" />
            Creazione Messaggio CWL
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Form Section */}
            <div className="space-y-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(addClan)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome Clan</FormLabel>
                          <FormControl>
                            <Input placeholder="Eclipse" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="participants"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Partecipanti</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="15" 
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="league"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lega</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleziona Lega" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Bronze League">Bronze League</SelectItem>
                              <SelectItem value="Silver League">Silver League</SelectItem>
                              <SelectItem value="Gold League">Gold League</SelectItem>
                              <SelectItem value="Crystal League">Crystal League</SelectItem>
                              <SelectItem value="Master League">Master League</SelectItem>
                              <SelectItem value="Champion League">Champion League</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Aggiungi Clan
                  </Button>
                </form>
              </Form>

              {/* Added Clans List */}
              {clans.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold">Clan Aggiunti:</h4>
                  {clans.map((clan, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                      <span>{clan.name} - {clan.participants} partecipanti - {clan.league}</span>
                      <Button variant="outline" size="sm" onClick={() => removeClan(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                <Button 
                  onClick={assignPlayersToClans}
                  disabled={clans.length === 0 || registrations.length === 0}
                  className="w-full"
                  variant="outline"
                >
                  <ArrowLeftRight className="mr-2 h-4 w-4" />
                  Gestisci Player tra Clan
                </Button>
                
                <Button 
                  onClick={handleGenerateMessage}
                  disabled={generateMessageMutation.isPending}
                  className="w-full"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Genera Messaggio
                </Button>
              </div>
            </div>

            {/* Preview Section */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                <FileText className="mr-2 h-4 w-4" />
                Anteprima Messaggio
              </h4>
              <div className="bg-white rounded border p-4 font-mono text-sm min-h-[200px]">
                {generatedMessage ? (
                  <pre className="whitespace-pre-wrap">{generatedMessage}</pre>
                ) : (
                  <div className="text-gray-600 italic">Il messaggio apparirà qui dopo aver inserito i dati del clan...</div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Player Management Section */}
      {showPlayerManager && clansWithPlayers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <ArrowLeftRight className="mr-2 h-5 w-5" />
                Gestione Player tra Clan
              </div>
              <Button
                variant="outline"
                onClick={() => setShowPlayerManager(false)}
              >
                Chiudi
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {clansWithPlayers.map((clan) => (
                <Card key={clan.id} className="border-2">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">
                      {clan.name} - {clan.league}
                    </CardTitle>
                    <p className="text-sm text-gray-600">
                      {clan.players.length}/{clan.participants} player
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {clan.players.map((player, index) => (
                        <div key={player.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-sm">{index + 1}.</span>
                            <div>
                              <div className="font-medium">{player.playerName}</div>
                              <div className="text-xs text-gray-600">{player.thLevel}</div>
                            </div>
                          </div>
                          <div className="flex space-x-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => movePlayerUp(clan.id, index)}
                              disabled={index === 0}
                              className="p-1 h-6 w-6"
                            >
                              <ArrowUp className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => movePlayerDown(clan.id, index)}
                              disabled={index === clan.players.length - 1}
                              className="p-1 h-6 w-6"
                            >
                              <ArrowDown className="h-3 w-3" />
                            </Button>
                            <Select
                              onValueChange={(toClanId) => movePlayer(player.id, clan.id, toClanId)}
                            >
                              <SelectTrigger className="h-6 w-16 text-xs">
                                <SelectValue placeholder="→" />
                              </SelectTrigger>
                              <SelectContent>
                                {clansWithPlayers
                                  .filter(c => c.id !== clan.id)
                                  .map(targetClan => (
                                    <SelectItem key={targetClan.id} value={targetClan.id}>
                                      {targetClan.name}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      ))}
                      {clan.players.length === 0 && (
                        <div className="text-center text-gray-500 py-4 text-sm">
                          Nessun player assegnato
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="mt-6 text-center">
              <Button
                onClick={handleGenerateMessage}
                className="bg-green-600 hover:bg-green-700"
              >
                <FileText className="mr-2 h-4 w-4" />
                Genera Messaggio con Liste Personalizzate
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Player Statistics Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5" />
            Statistiche Player (API Clash of Clans)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex space-x-4">
                <Input
                  placeholder="Inserisci tag clan (es. #ABCD1234 o ABCD1234)"
                  value={selectedClanTag}
                  onChange={(e) => setSelectedClanTag(e.target.value.toUpperCase())}
                  className="w-64"
                />
                <Button
                  onClick={() => refetchPlayers()}
                  disabled={isLoadingPlayers || !selectedClanTag}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {isLoadingPlayers ? "Caricamento..." : "Cerca Clan"}
                </Button>
              </div>
              <div className="text-sm text-gray-600">
                {clashPlayers.length} player trovati
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <h5 className="font-medium text-blue-800 mb-2">Come trovare il tag del clan:</h5>
              <ol className="text-sm text-blue-700 space-y-1">
                <li>1. Apri Clash of Clans</li>
                <li>2. Vai alla pagina del tuo clan</li>
                <li>3. Il tag è sotto il nome del clan (es. #2YG9CLCCV)</li>
                <li>4. Copia e incolla qui (con o senza #)</li>
              </ol>
              <div className="mt-2 pt-2 border-t border-blue-200">
                <p className="text-xs text-blue-600 font-medium">💡 Su Render:</p>
                <p className="text-xs text-blue-600">
                  <a 
                    href="/api/server-info" 
                    target="_blank" 
                    className="underline hover:text-blue-800"
                  >
                    Clicca qui per vedere l'IP del server
                  </a> e aggiungerlo alla tua API key
                </p>
              </div>
            </div>
          </div>

          {/* Error message for API */}
          {clashError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h5 className="font-medium text-red-800 mb-2">Errore nella ricerca clan:</h5>
              <p className="text-sm text-red-700">
                {(() => {
                  if (clashError instanceof Error) {
                    if (clashError.message.includes('403') || clashError.message.includes('non autorizzata')) {
                      return "API Key non autorizzata per questo IP";
                    }
                    if (clashError.message.includes('404') || clashError.message.includes('non trovato')) {
                      return "Clan non trovato. Verifica che il tag sia corretto.";
                    }
                    if (clashError.message.includes('JSON') || clashError.message.includes('token')) {
                      return "Errore di comunicazione con l'API. Riprova tra qualche momento.";
                    }
                    return clashError.message;
                  }
                  return "Errore sconosciuto";
                })()}
              </p>
              <div className="text-xs text-red-600 mt-2 space-y-1">
                <p>• Verifica che il tag clan sia corretto (es. #2YG9CLCCV)</p>
                <p>• Su Render: aggiungi l'IP del server alla tua API key su https://developer.clashofclans.com</p>
                <p>• Controlla che CLASH_API_KEY sia configurata nelle variabili ambiente</p>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tag</TableHead>
                  <TableHead>TH</TableHead>
                  <TableHead>Stelle War</TableHead>
                  <TableHead>Coppe Attuali</TableHead>
                  <TableHead>Max Coppe</TableHead>
                  <TableHead>Trofei Leggenda</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clashPlayers.map((player: ClashPlayer, index) => (
                  <TableRow key={player.tag || index}>
                    <TableCell className="font-medium">{player.name}</TableCell>
                    <TableCell className="font-mono text-sm">{player.tag}</TableCell>
                    <TableCell>
                      <Badge className={getTHBadgeColor(player.townHallLevel)}>
                        TH{player.townHallLevel}
                      </Badge>
                    </TableCell>
                    <TableCell>{player.warStars}</TableCell>
                    <TableCell>{player.trophies}</TableCell>
                    <TableCell>{player.bestTrophies}</TableCell>
                    <TableCell>{player.legendStatistics?.legendTrophies || 0}</TableCell>
                  </TableRow>
                ))}
                {clashPlayers.length === 0 && !isLoadingPlayers && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500">
                      {selectedClanTag ? "Nessun player trovato per questo clan" : "Inserisci un tag clan per visualizzare i player"}
                    </TableCell>
                  </TableRow>
                )}
                {isLoadingPlayers && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500">
                      Caricamento dati...
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Registrations Summary */}
          <div className="mt-6 grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-semibold text-blue-800">Registrazioni Attuali</h5>
                  <p className="text-blue-600 text-sm">{registrations.length} player registrati</p>
                  <p className="text-xs text-blue-500 mt-1">
                    💾 Dati salvati automaticamente in file persistente
                  </p>
                </div>
                <div className="text-sm text-blue-600">
                  <div>Ultimo aggiornamento: {new Date().toLocaleString()}</div>
                  <div className="text-xs mt-1">
                    File: data/registrazioni.json
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <h5 className="font-semibold text-green-800">Stato Persistenza</h5>
              <div className="text-sm text-green-700">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${fileStatus?.isEmpty === false ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  <span>File dati: {fileStatus?.isEmpty === false ? 'Contiene dati' : 'Vuoto'}</span>
                </div>
                <div className="text-xs mt-2 text-green-600">
                  I dati vengono salvati automaticamente ad ogni registrazione e ripristinati al riavvio del server.
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sezione Visualizzazione Registrazioni */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Eye className="mr-2 h-5 w-5" />
            Player Registrati ({registrations.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {registrations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <p>Nessun player registrato al momento</p>
              <p className="text-sm mt-2">I player si registreranno usando il modulo sulla homepage</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Nome Player</TableHead>
                    <TableHead>Town Hall</TableHead>
                    <TableHead>Data Registrazione</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registrations.map((reg, index) => (
                    <TableRow key={reg.id}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell className="font-medium">{reg.playerName}</TableCell>
                      <TableCell>
                        <Badge className={getTHBadgeColor(parseInt(reg.thLevel.replace('TH', '')))}>
                          {reg.thLevel}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {reg.registeredAt ? new Date(reg.registeredAt).toLocaleDateString('it-IT') : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          
          {/* Status File Persistence */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-medium text-blue-800">Stato Persistenza File</h5>
                <p className="text-sm text-blue-700">
                  {fileStatus?.isEmpty ? 
                    "File vuoto - Le registrazioni verranno salvate automaticamente" : 
                    `File contiene ${registrations.length} registrazioni salvate`
                  }
                </p>
              </div>
              <div className={`w-3 h-3 rounded-full ${fileStatus?.isEmpty ? 'bg-gray-400' : 'bg-green-500'}`} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sezione Gestione Informazioni Clan Homepage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Star className="mr-2 h-5 w-5" />
              Gestione Informazioni Clan Homepage
            </div>
            <Button
              onClick={() => {
                setIsEditingClanInfo(true);
                setEditingClanId(null);
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Aggiungi Clan
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <h5 className="font-medium text-yellow-800 mb-2">Informazioni per Homepage</h5>
              <p className="text-sm text-yellow-700">
                Qui puoi gestire le informazioni dei clan che appariranno sulla homepage. 
                Sostituisci le informazioni di Eclipse con quelle del tuo clan.
              </p>
            </div>

            {/* Form per aggiungere/modificare clan info */}
            {isEditingClanInfo && (
              <Card className="border-2 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-lg">
                    {editingClanId ? 'Modifica Informazioni Clan' : 'Aggiungi Nuovo Clan'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4 space-y-0">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Nome Clan *</label>
                        <Input placeholder="Eclipse" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Tag Clan</label>
                        <Input placeholder="#2YG9CLCCV" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Lega</label>
                        <Input placeholder="Master League I" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Membri Attivi</label>
                        <Input placeholder="35/50" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Win Rate</label>
                        <Input placeholder="85%" />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Descrizione Clan *</label>
                        <Textarea 
                          placeholder="Descrizione del clan..."
                          className="min-h-24"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Requisiti</label>
                        <Textarea 
                          placeholder="TH12+ per CWL, donazioni equilibrate..."
                          className="min-h-20"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Prossima CWL</label>
                        <Input placeholder="1-8 Febbraio 2025" />
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-3 mt-6">
                    <Button className="bg-green-600 hover:bg-green-700">
                      <Edit className="mr-2 h-4 w-4" />
                      {editingClanId ? 'Salva Modifiche' : 'Aggiungi Clan'}
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setIsEditingClanInfo(false);
                        setEditingClanId(null);
                      }}
                    >
                      Annulla
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Lista clan configurati (simulata per ora) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 border rounded-lg bg-green-50 border-green-200">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full" title="Attivo sulla homepage" />
                    <div>
                      <h4 className="font-medium">Eclipse</h4>
                      <p className="text-sm text-gray-600">#2YG9CLCCV - Master League I</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Clan competitivo con focus su CWL e war continue...
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsEditingClanInfo(true);
                      setEditingClanId('eclipse-default');
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-green-600 border-green-600"
                  >
                    <Star className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="text-center text-gray-500 py-4">
              <p className="text-sm">
                💡 Solo un clan può essere attivo sulla homepage alla volta
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
