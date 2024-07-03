# LMStudio Summarizer Chrome Extension

## Descrizione

LMStudio Summarizer è un'estensione per Chrome progettata per riassumere il contenuto delle pagine web. Utilizza un modello di linguaggio avanzato per generare riassunti chiari e concisi del testo presente sulla pagina. L'estensione offre anche la possibilità di valutare il numero di caratteri e di token presenti nel testo della pagina prima di generare il riassunto.

## Funzionalità

- **Riassunto del testo**: Riassume il contenuto della pagina web corrente.
- **Valutazione del testo**: Calcola il numero di caratteri e di token presenti nel testo della pagina.
- **Personalizzazione**: Consente di impostare la temperatura del modello, la dimensione del carattere e la famiglia di font per il riassunto generato.

## Come Utilizzarlo

1. **Apri l'estensione**: Clicca sull'icona dell'estensione nella barra degli strumenti di Chrome per aprire l'interfaccia dell'estensione.
2. **Inserisci il prompt**: Digita il prompt nel campo di testo. Il prompt predefinito è "summarize this page in English".
3. **Imposta i parametri**:
    - **Temperature**: Seleziona la temperatura del modello (Strict, Average, Creative).
    - **Font Size**: Seleziona la dimensione del carattere (Small, Medium, Large).
    - **Font Family**: Seleziona la famiglia di font (Arial, Times New Roman, Courier New, Georgia, Verdana).
4. **Valuta il testo**:
    - Clicca su "Evaluate" per calcolare il numero di caratteri e token nel testo della pagina corrente. I risultati verranno visualizzati sotto i controlli.
5. **Genera il riassunto**:
    - Clicca su "Submit" per generare il riassunto del contenuto della pagina. Il riassunto verrà visualizzato nel riquadro sottostante.
    - Puoi interrompere la generazione del riassunto cliccando su "Stop".

## Installazione

Per installare l'estensione su Chrome, segui questi passaggi:

1. **Clona o scarica il repository**: Assicurati di avere una copia locale dei file dell'estensione (inclusi `popup.html` e `popup.js`).
2. **Apri Chrome** e vai a `chrome://extensions/`.
3. **Attiva la modalità sviluppatore**: In alto a destra, attiva la modalità sviluppatore.
4. **Carica l'estensione non pacchettizzata**: Clicca su "Carica estensione non pacchettizzata" e seleziona la cartella che contiene i file dell'estensione.
5. **Utilizza l'estensione**: L'estensione dovrebbe ora apparire nella barra degli strumenti di Chrome. Clicca sull'icona per iniziare a usarla.

## Avvio di LMStudio

Per utilizzare correttamente l'estensione, è necessario che il server LMStudio sia in esecuzione. Segui questi passaggi per lanciare LMStudio:

1. **Scarica LMStudio**: Vai al sito ufficiale di LMStudio e scarica l'ultima versione disponibile.
2. **Scarica il modello**: Scarica il modello di linguaggio necessario per generare i riassunti. Il modello e' preferibile che sia piccolo, ma con una lunghezza di contesto maggiore di 8K se possibile. Con 10K token ho ottenuto buoni risultati con 8G di Vram, di piu' rischia di non stare nella vram o di essere troppo lento.
4. **Lancia il server**: Esegui il comando per avviare LMStudio come server.
   
