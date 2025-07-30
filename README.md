# ClanWarMaker

Progetto con React 

Scopo del progetto :

Ricevere una o più liste suddvise per clan per la partecipazione alla cwl (clan war league)
Far creare un messaggio , dove al suo interno trovo da 1 a più liste di utente urdinate in base ad un ordine inpartito da un admin .

Il messaggio deve essere formato da : 
- NomeClan + numeroPartecipanti + nomeLega ( dati inseriti dall'admin)
    - esempio : Eclipse 15 partecipanti 
- lista ordinata dei partecipanti alla cwl,
    - esempio : "1)Baddy th17"
- ritorna alla fine di ogni lista il numero di partecipanti che mancano per qulla lista di quel clan 
    - esempio :  " mancano ancora 3 player "


Esempio di una lista :

GB CHAMP 3

Trimurti 
Raoul
Xale 02
Kando
Alien 
Alien 2
Baddy
David 
Rere 
Psyco
Inferno
Massimiliano
Maso 
Stas 
Ivan 
Ichigo

Suddivisione Pagine :

Pagina player :
I nomi dei partecipanti dovranno essere inseriti a mano in una oagina da ogni player , un input per il nome ed una select che va da "th1" a "th17" ed 
un bottone invio che salva i dati inseriti dall'utente .
La stringa formata dai dati inseriti dall'utente verrà salvata su un file listaIscrizioni.txt. 

Pagina Admin ( accessibile solo a certi utenti ):
In questa pagina verrà visualizzato un menu nel quale l'admin può inserire i dettagli del messaggio , esempio il numero di clan , il loro nomeLega ed i partecipanti ed in fine
un bottone dove stampa la lista/messaggio in un file pdf .
Potrà anche vedere in una tabella i dettagli di tutti i player presenti in un clan da lui inserito ( utilizza un'API di clash of clans ) , potrà vdere ad esmepio , nome , tag ,
livello th , stelle war , coppe attuali , massimo coppe raggiunte e trofei leggenda .
Botttone che svuota il file listaIscrizioni.txt.

Pagina menu principale :

Pagina iniziale dove verrà mostrato un menu principale, formato da :
- Descrizione del clan 
- Bottone che porta alla pagina Admin
- Bottone che porta alla pagina player
