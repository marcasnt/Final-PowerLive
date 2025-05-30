# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/958fc3b5-de4a-49b6-b16e-3f26fb35713f

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/958fc3b5-de4a-49b6-b16e-3f26fb35713f) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

---

## 🚀 Deploy automático en Vercel

### 1. Clona el repositorio

```sh
git clone https://github.com/marcasnt/Final-PowerLive.git
cd Final-PowerLive
```

### 2. Configura las variables de entorno

Copia el archivo `.env.example` a `.env` y completa los valores si es necesario:

```sh
cp .env.example .env
```

Variables necesarias:
- `VITE_SUPABASE_URL` (URL de tu proyecto Supabase)
- `VITE_SUPABASE_ANON_KEY` (Clave pública anon de Supabase)

### 3. Deploy en Vercel

1. Ingresa a [vercel.com](https://vercel.com/) y loguéate con tu cuenta de GitHub.
2. Haz clic en "Add New Project" y selecciona este repositorio.
3. Vercel detectará Vite automáticamente. Si no, selecciona:
   - **Framework preset:** Other
   - **Build command:** `npm run build`
   - **Output directory:** `dist`
4. Agrega las variables de entorno (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) en el panel de Vercel.
5. Haz deploy.

¡Listo! Tu app estará online y actualizada con cada push a GitHub.

---

## 👥 Colaboradores

1. Haz un fork o pide acceso de colaborador.
2. Trabaja en una rama y haz pull request, o push directo si tienes permisos.
3. ¡Recuerda mantener tu rama actualizada!

---

## 🔗 Conexión Backend

La app usa Supabase como backend. Si cambias de proyecto Supabase, actualiza las variables de entorno.

---

## 🛠️ Scripts útiles

- `npm run dev` — desarrollo local
- `npm run build` — build de producción
- `npm run preview` — preview local del build

---

## 📦 Mantén tu app actualizada

Cada push a la rama principal (`main`) actualizará automáticamente el deploy en Vercel.

---

¿Dudas? Contacta a @marcasnt o revisa este README para los pasos actualizados.


## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/958fc3b5-de4a-49b6-b16e-3f26fb35713f) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
