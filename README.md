# FRONT_OFFICE - Vitrine Catalogue & Services (React + Vite)

Cette application est l'interface utilisateur / vitrine web cliente (**FRONT_OFFICE**) construite avec **React**, **Vite**, **Axios** (pour les requêtes HTTP) et **react-toastify** (pour les notifications In-App).

Elle communique avec l'API Backend **BACK_OFFICE** (Express + PostgreSQL + Multer + Firebase).

---

## 🛠️ Stack Technique & Bibliothèques

- **Framework** : React 18 + Vite
- **Requêtes HTTP** : Axios (avec intercepteurs et fallback mode démo)
- **Notifications In-App** : `react-toastify`
- **Icônes** : `lucide-react`
- **Design System** : Vanilla CSS moderne avec thème Sombre Glassmorphism & Polices Google (Outfit / Inter)

---

## 🚀 Démarrage en Local

### 1. Installation des Dépendances
Dans le dossier `FRONT_OFFICE`, exécutez :
```bash
npm install
```

### 2. Configuration d'Environnement
Assurez-vous d'avoir le fichier `.env` avec l'URL de votre API Backend :
```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Lancement du Serveur de Développement
```bash
npm run dev
```
L'application s'ouvrira automatiquement sur `http://localhost:3000`.

---

## 🌐 Déploiement (Vercel ou Netlify)

### A. Déploiement sur Vercel
1. Installez le CLI Vercel ou connectez votre dépôt sur [Vercel.com](https://vercel.com).
2. Créez un **New Project** et sélectionnez le dossier `FRONT_OFFICE`.
3. Vercel détectera automatiquement **Vite** :
   - **Framework Preset** : Vite
   - **Build Command** : `npm run build`
   - **Output Directory** : `dist`
4. Ajoutez la variable d'environnement dans Vercel :
   - `VITE_API_URL` = `https://votre-backend-render-ou-koyeb.onrender.com/api`
5. Cliquez sur **Deploy**.

### B. Déploiement sur Netlify
1. Connectez-vous sur [Netlify.com](https://netlify.com).
2. Choisissez **Import from Git** et sélectionnez le dossier `FRONT_OFFICE`.
3. Configuration du build :
   - **Build command** : `npm run build`
   - **Publish directory** : `dist`
4. Dans **Environment variables**, ajoutez `VITE_API_URL`.
5. Cliquez sur **Deploy site**.
