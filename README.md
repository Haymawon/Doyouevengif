# DoYouEvenGif

**DoYouEvenGif** is a full‑stack web application for discovering anime and manga.  
It combines data from **Jikan (MyAnimeList)** and **AniList GraphQL** with a custom user system, search history, personalized recommendations, and three built‑in themes.

Built with **Vue 3**, **TypeScript**, **Tailwind CSS** (frontend) and **Flask**, **SQLite**, **JWT** (backend).  

---

## Features

- **User accounts** – register, login, profile with cooldown‑based name/username changes.
- **Search anime/manga** – with live autocomplete suggestions.
- **Search history** – stored per user, used to personalize the home feed.
- **Personalized home** – recommendations based on your past searches (or trending if none).
- **Internal detail pages** – full info, synopsis, stats, and **recommendations** for each entry.
- **Three themes** – Dark Purple (default), Light Pink, Dark Blue – applied via CSS variables and persisted.
- **Fully responsive** – works on mobile, tablet, desktop.
- **Smooth animations** – hover effects, transitions, loading skeletons.
---

## Tech Stack

### Frontend
- [Vue 3](https://vuejs.org/) – Composition API
- [Vite](https://vitejs.dev/) – build tool
- [TypeScript](https://www.typescriptlang.org/)
- [Pinia](https://pinia.vuejs.org/) – state management
- [Vue Router](https://router.vuejs.org/) – routing
- [Tailwind CSS](https://tailwindcss.com/) – styling
- [@vueuse/core](https://vueuse.org/) – debounce utility

### Backend
- [Flask](https://flask.palletsprojects.com/) – Python web framework
- [Flask-SQLAlchemy](https://flask-sqlalchemy.palletsprojects.com/) – ORM
- [Flask-JWT-Extended](https://flask-jwt-extended.readthedocs.io/) – authentication
- [bcrypt](https://pypi.org/project/bcrypt/) – password hashing
- [SQLite](https://www.sqlite.org/) – database (easy to replace with PostgreSQL)
- [requests](https://docs.python-requests.org/) – calling external APIs

### External APIs
- [Jikan API](https://jikan.moe/) – unofficial MyAnimeList API (anime data)
- [AniList API](https://anilist.gitbook.io/) – GraphQL API (manga data)

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [Python](https://www.python.org/) (v3.9+)
- [Git](https://git-scm.com/)

### 1. Clone the repository
```bash
git clone https://github.com/Haymawon/Doyouevengif.git
cd Doyouevengif
```
### 2. Backend setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # on Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```
The backend will start at http://localhost:5000.
### 3. Frontend setup
Open a new terminal in the project root.
```bash
npm install
```
Create a .env file in the root:
**VITE_API_URL=http://localhost:5000/api**

**(If you use Vite proxy, you can set VITE_API_URL=/api and configure proxy in vite.config.ts.)**

**Start the development server:**
```bash
npm run dev
```
**Visit http://localhost:5173.**

### Configuration
### Environment Variables
VITE_API_URL: URL of your backend API (default: http://localhost:5000/api).
### Adding a New Theme
1. Open src/stores/theme.ts and add a new theme name to the Theme type.

2. In src/styles/tailwind.css, add a new CSS class (e.g., .theme-forest-green) with your custom CSS variables.

3. Update the themes array in src/pages/Themes.vue to include your new theme.
### Customizing Colors
All colors are defined as CSS variables in tailwind.css. Modify them there – the changes will propagate everywhere.
### API Endpoints (Backend)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/register` | Register new user | ❌ |
| POST | `/api/login` | Login, receive JWT | ❌ |
| GET | `/api/profile` | Get current user profile | ✅ |
| PUT | `/api/profile` | Update name/username (with cooldown) | ✅ |
| GET | `/api/search/anime?q=...` | Search anime (logs history) | ✅ |
| GET | `/api/search/manga?q=...` | Search manga (logs history) | ✅ |
| GET | `/api/anime/<id>` | Get anime details | ✅ |
| GET | `/api/manga/<id>` | Get manga details | ✅ |
| GET | `/api/recommendations/anime/<id>` | Recommendations for an anime | ✅ |
| GET | `/api/recommendations/manga/<id>` | Recommendations for a manga | ✅ |
| GET | `/api/home` | Personalized home feed | ✅ |

### Running Tests
**No formal test suite yet – but you can manually test all features:**

- **Register a new account.**

- **Login, check profile.**

- **Search for anime/manga, click on cards.**

- **Verify recommendations on detail pages.**

- **Change themes, check persistence.**

- **Try cooldown on name/username changes.**

### Deployment
### Backend (Flask)
For production, use a production WSGI server like gunicorn:
```bash
pip install gunicorn
gunicorn -w 4 app:app
```
**Set environment variables for production (secret key, database URL).**

### Frontend (Vue)
**Build static files:**
```bash
npm run build
```
**Deploy the dist/ folder to any static host (Netlify, Vercel, etc.).**

**Make sure your production backend URL is set in VITE_API_URL and CORS is properly configured.**

### Contributing
**Contributions are welcome!**

- **Fork the repo.**

- **Create a feature branch.**

- **Make your changes.**

- **Submit a pull request.**

- **Please keep code clean, type‑safe, and well‑commented.**

### License
**This project is licensed under the MIT License – see the [LICENSE](https://github.com/Haymawon/Doyouevengif/blob/main/LICENSE) file for details.**

### Acknowledgements
- **[Jikan API](https://jikan.moe/) for providing easy access to MyAnimeList data.**

- **[AniList API](https://anilist.gitbook.io/) for their excellent GraphQL API.**

- **All the anime and manga fans out there.**
