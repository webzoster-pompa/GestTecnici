# 🤝 Guida al Contributo

Grazie per il tuo interesse nel contribuire a **GestTecnici**! Apprezziamo molto qualsiasi tipo di contributo, dalle correzioni di bug alle nuove funzionalità.

## 📋 Indice

- [Codice di Condotta](#codice-di-condotta)
- [Come Contribuire](#come-contribuire)
- [Setup Ambiente di Sviluppo](#setup-ambiente-di-sviluppo)
- [Workflow di Sviluppo](#workflow-di-sviluppo)
- [Linee Guida per il Codice](#linee-guida-per-il-codice)
- [Commit Messages](#commit-messages)
- [Pull Request](#pull-request)
- [Testing](#testing)
- [Documentazione](#documentazione)

## 📜 Codice di Condotta

Partecipando a questo progetto, ti impegni a mantenere un ambiente rispettoso e inclusivo. Ti chiediamo di:

- Essere rispettoso e costruttivo nelle discussioni
- Accettare critiche costruttive con professionalità
- Concentrarti su ciò che è meglio per la community
- Mostrare empatia verso altri membri della community

## 🚀 Come Contribuire

Ci sono diversi modi per contribuire:

### 🐛 Segnalazione Bug

1. Controlla se il bug è già stato segnalato nelle [Issues](https://github.com/webzoster-pompa/GestTecnici/issues)
2. Se non esiste, crea una nuova issue usando il template "Bug Report"
3. Includi:
   - Descrizione chiara del problema
   - Passi per riprodurre il bug
   - Comportamento atteso vs comportamento attuale
   - Screenshot (se applicabile)
   - Versione dell'app e sistema operativo

### ✨ Richiesta Funzionalità

1. Controlla se la funzionalità è già stata richiesta
2. Crea una nuova issue usando il template "Feature Request"
3. Descrivi:
   - Il problema che la funzionalità risolverebbe
   - La soluzione proposta
   - Alternative considerate
   - Eventuali mockup o esempi

### 💻 Contributi al Codice

1. Fork il repository
2. Crea un branch per la tua modifica
3. Implementa le modifiche
4. Aggiungi test
5. Assicurati che tutti i test passino
6. Invia una Pull Request

## 🛠️ Setup Ambiente di Sviluppo

### Prerequisiti

- Node.js v18+
- PostgreSQL v14+
- Git
- Editor con supporto TypeScript (VS Code raccomandato)

### Installazione

```bash
# 1. Fork e clona il repository
git clone https://github.com/TUO-USERNAME/GestTecnici.git
cd GestTecnici

# 2. Aggiungi il repository upstream
git remote add upstream https://github.com/webzoster-pompa/GestTecnici.git

# 3. Installa le dipendenze
npm install

# 4. Copia il file .env.example
cp .env.example .env

# 5. Configura le variabili d'ambiente
# Modifica .env con i tuoi valori

# 6. Setup database
createdb gesttecnici
npm run db:migrate

# 7. Avvia il progetto in modalità sviluppo
npm run dev
```

### VS Code Extensions Consigliate

- ESLint
- Prettier
- TypeScript and JavaScript Language Features
- React Native Tools
- Expo Tools

## 🔄 Workflow di Sviluppo

### 1. Sincronizza il tuo Fork

```bash
git fetch upstream
git checkout main
git merge upstream/main
```

### 2. Crea un Branch

Usa nomi descrittivi per i branch:

```bash
# Feature
git checkout -b feature/nome-funzionalita

# Bug fix
git checkout -b fix/descrizione-bug

# Hotfix
git checkout -b hotfix/descrizione-fix

# Documentazione
git checkout -b docs/descrizione-modifica
```

### 3. Sviluppa e Testa

```bash
# Sviluppo con hot reload
npm run dev

# Esegui i test
npm test

# Controlla il linting
npm run lint

# Controlla TypeScript
npm run type-check
```

### 4. Commit delle Modifiche

Segui le convenzioni per i commit messages (vedi sotto).

## 📝 Linee Guida per il Codice

### TypeScript

- **Usa sempre i tipi**: Evita `any` quando possibile
- **Interfacce vs Types**: Preferisci `interface` per oggetti, `type` per unions
- **Naming**: PascalCase per tipi e interfacce, camelCase per variabili

```typescript
// ✅ Buono
interface User {
  id: number;
  name: string;
  email: string;
}

const getUserById = (id: number): User | null => {
  // ...
}

// ❌ Cattivo
const getUserById = (id: any) => {
  // ...
}
```

### React/React Native

- **Componenti Funzionali**: Usa sempre funzioni, non classi
- **Hooks**: Segui le regole degli hooks
- **Props**: Definisci sempre il tipo delle props

```typescript
// ✅ Buono
interface ButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({ title, onPress, disabled = false }) => {
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled}>
      <Text>{title}</Text>
    </TouchableOpacity>
  );
};

// ❌ Cattivo
const Button = (props: any) => {
  return <TouchableOpacity onPress={props.onPress}>...</TouchableOpacity>;
};
```

### Styling

- Usa **Tailwind CSS** attraverso NativeWind
- Mantieni consistenza con il design system esistente
- Evita inline styles quando possibile

```typescript
// ✅ Buono
<View className="flex-1 bg-white p-4">
  <Text className="text-lg font-bold">Titolo</Text>
</View>

// ❌ Cattivo
<View style={{ flex: 1, backgroundColor: '#fff', padding: 16 }}>
  <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Titolo</Text>
</View>
```

### File Organization

```typescript
// Ordine degli import
// 1. React/React Native
import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';

// 2. Librerie esterne
import { useNavigation } from '@react-navigation/native';

// 3. Import interni assoluti
import { Button } from '@/components';
import { useAuth } from '@/hooks';

// 4. Import relativi
import { localHelper } from './helpers';

// 5. Types
import type { User } from '@/types';
```

## 💬 Commit Messages

Usa il formato [Conventional Commits](https://www.conventionalcommits.org/):

```
<tipo>[scope opzionale]: <descrizione>

[corpo opzionale]

[footer opzionale]
```

### Tipi

- `feat`: Nuova funzionalità
- `fix`: Correzione bug
- `docs`: Modifiche alla documentazione
- `style`: Formattazione, punto e virgola mancanti, ecc.
- `refactor`: Refactoring del codice
- `perf`: Miglioramenti delle performance
- `test`: Aggiunta o modifica test
- `chore`: Modifiche al build process o strumenti

### Esempi

```bash
# Feature
git commit -m "feat(auth): add login with Google"

# Bug fix
git commit -m "fix(calendar): resolve date formatting issue"

# Documentazione
git commit -m "docs(readme): update installation instructions"

# Multiple lines
git commit -m "feat(appointments): add recurring appointments

- Add weekly recurrence option
- Add monthly recurrence option
- Update database schema"
```

## 🔍 Pull Request

### Prima di Aprire una PR

- [ ] Il codice segue le linee guida del progetto
- [ ] Hai eseguito `npm run lint` senza errori
- [ ] Hai eseguito `npm test` e tutti i test passano
- [ ] Hai aggiunto test per le nuove funzionalità
- [ ] Hai aggiornato la documentazione se necessario
- [ ] Il branch è aggiornato con `main`
- [ ] I commit seguono le convenzioni

### Template PR

Quando apri una PR, usa questo template:

```markdown
## Descrizione
Breve descrizione delle modifiche

## Tipo di Modifica
- [ ] Bug fix
- [ ] Nuova funzionalità
- [ ] Breaking change
- [ ] Documentazione

## Come è stato testato?
Descrivi i test effettuati

## Checklist
- [ ] Il codice segue le linee guida
- [ ] Ho commentato il codice complesso
- [ ] Ho aggiornato la documentazione
- [ ] I miei cambiamenti non generano nuovi warning
- [ ] Ho aggiunto test che dimostrano che il fix è efficace
- [ ] I test esistenti passano localmente

## Screenshots (se applicabile)
Aggiungi screenshots delle modifiche UI
```

### Review Process

1. Un maintainer reviewerà la tua PR
2. Potrebbero essere richieste modifiche
3. Rispondi ai commenti e aggiorna la PR
4. Una volta approvata, la PR sarà mergiata

## 🧪 Testing

### Eseguire i Test

```bash
# Tutti i test
npm test

# Test in watch mode
npm run test:watch

# Test con coverage
npm run test:coverage

# Test specifici
npm test -- MyComponent
```

### Scrivere Test

```typescript
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from './Button';

describe('Button', () => {
  it('should render correctly', () => {
    const { getByText } = render(<Button title="Click me" onPress={() => {}} />);
    expect(getByText('Click me')).toBeTruthy();
  });

  it('should call onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button title="Click me" onPress={onPress} />);
    
    fireEvent.press(getByText('Click me'));
    expect(onPress).toHaveBeenCalled();
  });
});
```

## 📚 Documentazione

### Commenti nel Codice

- Commenta il **perché**, non il **cosa**
- Usa JSDoc per funzioni pubbliche
- Mantieni i commenti aggiornati

```typescript
/**
 * Calcola il prezzo finale applicando lo sconto
 * 
 * @param price - Prezzo originale
 * @param discount - Percentuale di sconto (0-100)
 * @returns Prezzo finale con sconto applicato
 * @throws {Error} Se il discount non è tra 0 e 100
 */
const calculateDiscountedPrice = (price: number, discount: number): number => {
  if (discount < 0 || discount > 100) {
    throw new Error('Discount must be between 0 and 100');
  }
  return price * (1 - discount / 100);
};
```

### README e Docs

- Aggiorna il README se aggiungi nuove funzionalità
- Crea documentazione dettagliata per funzionalità complesse
- Usa esempi e screenshot quando utile

## ❓ Domande?

Se hai domande o hai bisogno di aiuto:

1. Controlla la [documentazione](./docs)
2. Cerca nelle [Issues](https://github.com/webzoster-pompa/GestTecnici/issues)
3. Apri una nuova issue con la label "question"
4. Contattaci via email

## 🙏 Riconoscimenti

Grazie per aver dedicato tempo a contribuire a GestTecnici!

---

**Happy Coding! 🚀**
