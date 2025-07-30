import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Info, Save, CheckCircle } from "lucide-react";
import { insertPlayerRegistrationSchema, type InsertPlayerRegistration } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export default function PlayerPage() {
  const [showSuccess, setShowSuccess] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertPlayerRegistration>({
    resolver: zodResolver(insertPlayerRegistrationSchema),
    defaultValues: {
      playerName: "",
      thLevel: "",
    },
  });

  const registerPlayerMutation = useMutation({
    mutationFn: async (data: InsertPlayerRegistration) => {
      const response = await apiRequest("POST", "/api/player-registrations", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Registrazione completata",
        description: "La tua registrazione è stata salvata con successo!",
      });
      form.reset();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      queryClient.invalidateQueries({ queryKey: ["/api/player-registrations"] });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante la registrazione.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertPlayerRegistration) => {
    registerPlayerMutation.mutate(data);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="bg-primary rounded-full p-3 inline-block mb-4">
              <UserPlus className="text-white h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Registrazione Player CWL</h2>
            <p className="text-gray-600">Inserisci i tuoi dati per partecipare alla Clan War League</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="playerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Player</FormLabel>
                    <FormControl>
                      <Input placeholder="Inserisci il tuo nome player" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="thLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Livello Town Hall</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona il tuo livello TH" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Array.from({ length: 17 }, (_, i) => i + 1).map((th) => (
                          <SelectItem key={th} value={`th${th}`}>
                            TH{th}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1 text-sm">
                    <p className="font-medium">Informazioni importanti:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>La registrazione è obbligatoria per partecipare</li>
                      <li>I dati verranno utilizzati per organizzare le liste CWL</li>
                      <li>Assicurati che il nome corrisponda al tuo account Clash of Clans</li>
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>

              <Button 
                type="submit" 
                className="w-full"
                disabled={registerPlayerMutation.isPending}
              >
                <Save className="mr-2 h-4 w-4" />
                {registerPlayerMutation.isPending ? "Registrazione..." : "Registra Player"}
              </Button>
            </form>
          </Form>

          {/* Success Message */}
          {showSuccess && (
            <Alert className="mt-6 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 font-medium">
                Registrazione completata con successo!
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
