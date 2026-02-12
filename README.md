# 🔧 GestTecnici

> Sistema completo di gestione assistenza tecnica con app mobile cross-platform

[![TypeScript](https://img.shields.io/badge/TypeScript-98.5%25-blue)](https://www.typescriptlang.org/)
[![React Native](https://img.shields.io/badge/React%20Native-Expo-blueviolet)](https://expo.dev/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

## 📋 Indice

- [Panoramica](#-panoramica)
- [Funzionalità](#-funzionalità)
- [Tecnologie](#-tecnologie)
- [Prerequisiti](#-prerequisiti)
- [Installazione](#-installazione)
- [Configurazione](#-configurazione)
- [Utilizzo](#-utilizzo)
- [Struttura del Progetto](#-struttura-del-progetto)
- [Docker](#-docker)
- [Testing](#-testing)
- [Documentazione](#-documentazione)
- [Contribuire](#-contribuire)
- [Licenza](#-licenza)

## 🌟 Panoramica

**GestTecnici** è un'applicazione full-stack per la gestione dell'assistenza tecnica, progettata per ottimizzare il workflow dei tecnici sul campo. L'applicazione offre funzionalità di:

- Gestione appuntamenti e calendario
- Schede cliente complete
- Tracking interventi
- Sistema di backup automatico
- Sincronizzazione dati in tempo reale

## ✨ Funzionalità

### 📱 App Mobile
- **Calendario intelligente** - Gestione appuntamenti con visualizzazione ottimizzata
- **Schede cliente** - Anagrafica completa e storico interventi
- **Navigazione GPS** - Integrazione con mappe per raggiungere i clienti
- **Modalità offline** - Funzionamento anche senza connessione
- **Notifiche push** - Promemoria e aggiornamenti in tempo reale

### 🖥️ Backend
- **API RESTful** - Endpoint ben documentati e sicuri
- **Database relazionale** - Struttura ottimizzata con Drizzle ORM
- **Autenticazione** - Sistema sicuro di gestione utenti
- **Backup automatico** - Salvataggio periodico dei dati
- **Performance monitoring** - Tracking e ottimizzazione delle prestazioni

## 🛠️ Tecnologie

### Frontend (Mobile)
- **Framework**: React Native + Expo
- **UI Library**: NativeWind (Tailwind CSS per React Native)
- **Navigazione**: Expo Router (file-based routing)
- **State Management**: React Hooks + Context API
- **Styling**: Tailwind CSS

### Backend
- **Runtime**: Node.js
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Migrations**: Drizzle Kit
- **Type Safety**: TypeScript

### DevOps
- **Containerizzazione**: Docker + Docker Compose
- **Deployment**: Railway
- **Testing**: Jest + React Native Testing Library
- **Linting**: ESLint
- **Package Manager**: npm/pnpm

## 📦 Prerequisiti

Prima di iniziare, assicurati di avere installato:

- **Node.js** (v18 o superiore)
- **npm** o **pnpm** (v8+ raccomandato)
- **PostgreSQL** (v14 o superiore)
- **Docker** e **Docker Compose** (opzionale, per deployment)
- **Expo CLI** (opzionale, per sviluppo mobile)

### Installazione Expo CLI

```bash
npm install -g expo-cli
```

## 🚀 Installazione

### 1. Clona il repository

```bash
git clone https://github.com/webzoster-pompa/GestTecnici.git
cd GestTecnici
```

### 2. Installa le dipendenze

Usando npm:
```bash
npm install
```

Usando pnpm:
```bash
pnpm install
```

### 3. Configura il database

Crea un database PostgreSQL:
```bash
createdb gesttecnici
```

### 4. Esegui le migrations

```bash
npm run db:migrate
# oppure
pnpm db:migrate
```

## ⚙️ Configurazione

### Variabili d'ambiente

Crea un file `.env` nella root del progetto:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/gesttecnici

# Server
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d

# App
APP_NAME=GestTecnici
API_URL=http://localhost:3000
```

⚠️ **IMPORTANTE**: Non committare mai il file `.env` nel repository!

### File di configurazione disponibili

- `app.config.ts` - Configurazione Expo
- `drizzle.config.ts` - Configurazione database e migrations
- `tsconfig.json` - Configurazione TypeScript
- `tailwind.config.js` - Configurazione Tailwind CSS
- `.eslintrc.js` - Regole di linting

## 💻 Utilizzo

### Sviluppo

#### Avvia il backend

```bash
npm run server:dev
```

Il server sarà disponibile su `http://localhost:3000`

#### Avvia l'app mobile

```bash
npm run start
```

Questo comando aprirà Expo Developer Tools. Puoi poi:
- Premere `i` per aprire su iOS Simulator
- Premere `a` per aprire su Android Emulator
- Scansionare il QR code con l'app Expo Go sul tuo dispositivo

#### Sviluppo con hot reload

```bash
# Frontend
npm run start

# Backend
npm run server:watch
```

### Produzione

#### Build dell'app mobile

```bash
# iOS
npm run build:ios

# Android
npm run build:android
```

#### Deploy del backend

```bash
npm run build
npm run start:prod
```

## 📁 Struttura del Progetto

```
GestTecnici/
├── app/                    # App mobile (Expo Router)
│   ├── (tabs)/            # Navigazione tab principale
│   ├── _layout.tsx        # Layout root
│   └── index.tsx          # Homepage
├── components/             # Componenti React Native riutilizzabili
│   ├── ui/                # Componenti UI base
│   └── shared/            # Componenti condivisi
├── server/                 # Backend Node.js
│   ├── routes/            # Endpoint API
│   ├── controllers/       # Logica business
│   ├── middleware/        # Middleware Express
│   └── index.ts           # Entry point server
├── lib/                    # Librerie e utilities
│   ├── db/                # Configurazione database
│   └── utils/             # Funzioni helper
├── shared/                 # Codice condiviso frontend/backend
│   ├── types/             # Type definitions
│   └── constants/         # Costanti condivise
├── drizzle/               # Database migrations
├── assets/                # Risorse statiche (immagini, fonts)
├── hooks/                 # React hooks personalizzati
├── constants/             # Costanti applicazione
├── tests/                 # Test suite
├── docs/                  # Documentazione aggiuntiva
├── scripts/               # Script di utilità
├── .env.example           # Template variabili d'ambiente
├── .gitignore            # File da ignorare in Git
├── package.json          # Dipendenze e scripts
├── tsconfig.json         # Configurazione TypeScript
└── README.md             # Questo file
```

## 🐳 Docker

### Sviluppo con Docker Compose

```bash
# Avvia tutti i servizi
docker-compose up

# Avvia in background
docker-compose up -d

# Stop dei servizi
docker-compose down
```

### Build immagini Docker

```bash
# Frontend
docker build -f Dockerfile.frontend -t gesttecnici-frontend .

# Backend
docker build -f Dockerfile.backend -t gesttecnici-backend .
```

## 🧪 Testing

### Esegui tutti i test

```bash
npm test
```

### Test coverage

```bash
npm run test:coverage
```

### Test specifici

```bash
# Test regression
npm run test:regression

# Test performance
npm run test:performance
```

## 📚 Documentazione

Documentazione aggiuntiva disponibile nella cartella `/docs`:

- [DOCUMENTAZIONE.md](./DOCUMENTAZIONE.md) - Documentazione tecnica completa
- [PERFORMANCE_OPTIMIZATION.md](./PERFORMANCE_OPTIMIZATION.md) - Guide ottimizzazione
- [REGRESSION_TEST_REPORT.md](./REGRESSION_TEST_REPORT.md) - Report test
- [SCHEDA_CLIENTE_DEMO.md](./SCHEDA_CLIENTE_DEMO.md) - Esempi schede cliente
- [design.md](./design.md) - Scelte di design

## 🤝 Contribuire

Le contribuzioni sono benvenute! Per contribuire:

1. Fai un fork del progetto
2. Crea un branch per la tua feature (`git checkout -b feature/AmazingFeature`)
3. Commit delle modifiche (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Apri una Pull Request

### Linee guida

- Segui lo stile di codice esistente (ESLint)
- Aggiungi test per le nuove funzionalità
- Aggiorna la documentazione se necessario
- Assicurati che tutti i test passino

## 🔒 Sicurezza

### Best Practices

- ✅ Non committare mai file `.env` o credenziali
- ✅ Usa variabili d'ambiente per dati sensibili
- ✅ Mantieni le dipendenze aggiornate
- ✅ Esegui audit di sicurezza regolari

### Report vulnerabilità

Per segnalare vulnerabilità di sicurezza, contatta: [security@example.com](mailto:security@example.com)

## 🐛 Bug e Issues

Hai trovato un bug? Apri una [issue](https://github.com/webzoster-pompa/GestTecnici/issues) su GitHub!

## 📝 Licenza

Questo progetto è distribuito sotto licenza MIT. Vedi il file [LICENSE](LICENSE) per i dettagli.

## 👥 Autori

- **webzoster-pompa** - *Sviluppo iniziale* - [GitHub](https://github.com/webzoster-pompa)

## 🙏 Ringraziamenti

- Team Expo per il fantastico framework
- Community React Native
- Tutti i contributori del progetto

---

**Made with ❤️ in Italy**

Per domande o supporto, apri una issue o contattaci via email.
