import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Settings, FileText, Download, Trash2, RefreshCw, Users, PlusCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { ClashPlayer, PlayerRegistration } from "@shared/schema";

interface ClanForm {
  name: string;
  participants: number;
  league: string;
}

export default function AdminPage() {
  const [clans, setClans] = useState<ClanForm[]>([]);
  const [generatedMessage, setGeneratedMessage] = useState("");
  const [selectedClanTag, setSelectedClanTag] = useState("");
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

  // Fetch clash players
  const { data: clashPlayers = [], isLoading: isLoadingPlayers, refetch: refetchPlayers } = useQuery<ClashPlayer[]>({
    queryKey: ["/api/clash-players", selectedClanTag],
    enabled: !!selectedClanTag,
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

  const handleGenerateMessage = () => {
    if (clans.length === 0) {
      toast({
        title: "Errore",
        description: "Aggiungi almeno un clan prima di generare il messaggio",
        variant: "destructive",
      });
      return;
    }
    generateMessageMutation.mutate(clans);
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
                disabled={clearRegistrationsMutation.isPending}
                className="bg-warning text-white hover:bg-yellow-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Svuota Registrazioni
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

              <Button 
                onClick={handleGenerateMessage}
                disabled={generateMessageMutation.isPending}
                className="w-full"
              >
                <FileText className="mr-2 h-4 w-4" />
                Genera Messaggio
              </Button>
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

      {/* Player Statistics Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5" />
            Statistiche Player (API Clash of Clans)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex justify-between items-center">
            <div className="flex space-x-4">
              <Input
                placeholder="Inserisci tag clan (es. ABCD1234)"
                value={selectedClanTag}
                onChange={(e) => setSelectedClanTag(e.target.value)}
                className="w-64"
              />
              <Button
                onClick={() => refetchPlayers()}
                disabled={isLoadingPlayers}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Aggiorna Dati
              </Button>
            </div>
            <div className="text-sm text-gray-600">
              {clashPlayers.length} player trovati
            </div>
          </div>

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
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-semibold text-blue-800">Registrazioni Attuali</h5>
                <p className="text-blue-600 text-sm">{registrations.length} player registrati</p>
              </div>
              <div className="text-sm text-blue-600">
                Ultimo aggiornamento: {new Date().toLocaleString()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
