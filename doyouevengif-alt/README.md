
# yeah, this is still DoYouEvenGif.

just... not the usual one.

**DoYouEvenGif-alt** is an alternative version of **DoYouEvenGif-Twin Pears** built from a different idea, a different direction, and probably a questionable amount of late-night decisions.

it's not a redesign.  
it's not an update.  
it's not DoYouEvenGif 2.

it's its own version.  
same name. different personality.

**Live Site:** [doyouevengif-alt](https://doyouevengif-alt.netlify.app/)
----------

the code runs on a **Flask** backend with **vanilla HTML, CSS, and JavaScript** on the front. no frameworks. no unnecessary dependencies. just enough to work.

there's a newsletter thing that actually sends emails and lets people unsubscribe. a contact form that only accepts **Gmail and Proton** addresses because i didn't want to deal with spam. posts with cards and images and author pictures. search that works off actual post data. a notification bell with a badge that doesn't delete everything globally when you click dismiss.

**liquid glass UI** because why not. responsive because phones exist. custom fonts because default ones are boring.

it's hosted on **Netlify** for the frontend and **PythonAnywhere** for the backend. the source code is available if you want to poke around.


# Running DoYouEvenGif-alt

DoYouEvenGif-alt has two parts:

-   the frontend — plain HTML, CSS, and JavaScript
    
-   the backend — a small Flask API that handles the newsletter, contact form, subscriptions, and email sending
    

The frontend can be served as a normal static website. The Flask backend needs to be running separately.


## Requirements

You'll need:

-   Python 3
    
-   Git
    
-   pip
    

The backend dependencies are listed in `requirements.txt`:

```text
Flask
flask-cors
python-dotenv

```

The project does not need Node.js, npm, React, Vue, or another frontend framework.

----------

## 1. Get the source

Clone the repository:

```bash
git clone -b dueg-alt https://github.com/Haymawon/Doyouevengif-Twin_Pears.git

```

Then enter the project directory:

```bash
cd Doyouevengif-Twin_Pears/doyouevengif-alt

```

You should see files similar to:

```text
doyouevengif-alt/
├── assets/
├── dueg-alt.py
├── faviconn.png
├── index.html
└── requirements.txt

```

The current branch contains the `doyouevengif-alt` directory with the Flask file, frontend, assets, and requirements file.

----------

# Running locally

## 2. Create a virtual environment

A virtual environment keeps the project's Python packages separate from the rest of your system.

### Windows

```powershell
python -m venv .venv
.venv\Scripts\activate

```

If you're using Command Prompt instead:

```cmd
python -m venv .venv
.venv\Scripts\activate.bat

```

### macOS / Linux

```bash
python3 -m venv .venv
source .venv/bin/activate

```

After activation, your terminal should show something similar to:

```text
(.venv)

```

----------

## 3. Install the backend dependencies

With the virtual environment activated:

### Windows

```powershell
python -m pip install -r requirements.txt

```

### macOS / Linux

```bash
python3 -m pip install -r requirements.txt

```

----------

## 4. Configure the backend

The Flask backend reads its configuration from environment variables using `python-dotenv`.

Create a file called:

```text
.env

```

inside the `doyouevengif-alt` directory.

For example:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-password-or-app-password
CONTACT_RECIPIENT=your-email
NEWSLETTER_RECIPIENT=your-email

```

Do not commit `.env` to Git.

Add this to `.gitignore`:

```gitignore
.env
.venv/
__pycache__/

```

The backend uses SMTP with STARTTLS and takes the SMTP host, port, username, and password from the environment.

If you don't configure SMTP, the site can still run, but email sending will be disabled.

----------

## 5. Start the Flask backend

From inside `doyouevengif-alt`:

### Windows

```powershell
python dueg-alt.py

```

### macOS / Linux

```bash
python3 dueg-alt.py

```

The backend listens on:

```text
http://127.0.0.1:5000

```

The application itself binds to `0.0.0.0:5000`, so it can accept connections through the machine's network interface as well.

Open this in your browser:

```text
http://127.0.0.1:5000/

```

You should get a response showing that the DoYouEvenGif-alt API is running.

----------

# Running the frontend locally

The frontend is static HTML/CSS/JavaScript. `index.html` loads the site's CSS and JavaScript directly from the `assets` directory.

You can technically open `index.html` directly, but using a local HTTP server is better.

Keep the Flask backend running in one terminal.

Open another terminal in:

```text
doyouevengif-alt/

```

Then run:

### Windows

```powershell
python -m http.server 8000

```

### macOS / Linux

```bash
python3 -m http.server 8000

```

Open:

```text
http://127.0.0.1:8000

```

Now you have:

```text
Frontend
http://127.0.0.1:8000

Backend
http://127.0.0.1:5000

```

The frontend and backend are separate during local development.

----------

# Production

For production, don't use:

```bash
python dueg-alt.py

```

as the long-running public server.

The `app.run()` section in the source is intended for starting the application directly, while a production deployment should use a proper WSGI server or the hosting platform's Flask setup.

The setup you're using is straightforward:

```text
Frontend
    |
    v
Netlify
    |
    | API requests
    v
Flask backend
    |
    v
PythonAnywhere
    |
    +-- SMTP
    |
    +-- subscribers.json
    |
    +-- contacts.json

```

## Frontend production

The frontend doesn't require a build step.

Upload/deploy the `doyouevengif-alt` frontend files to your static host.

For Netlify, the important part is that the directory containing:

```text
index.html
assets/
faviconn.png

```

is the published directory.

There is no `npm install`, `npm run build`, or frontend compilation step because the site is plain HTML, CSS, and JavaScript.

----------

# Backend production on PythonAnywhere

Upload the backend to PythonAnywhere and create a Flask web application.

Your backend entry point is:

```text
dueg-alt.py

```

and the Flask application object is:

```python
app = Flask(__name__)

```

The PythonAnywhere WSGI configuration should import that application.

Because the filename contains a hyphen, you generally shouldn't try to import it directly with:

```python
from dueg-alt import app

```

Python doesn't allow a hyphen in a normal module import.

A cleaner production setup is to rename:

```text
dueg-alt.py

```

to:

```text
dueg_alt.py

```

Then the WSGI file can use:

```python
from dueg_alt import app as application

```

Install the requirements in the PythonAnywhere virtual environment:

```bash
pip install -r requirements.txt

```

Set the SMTP environment variables in the PythonAnywhere web application's environment configuration rather than putting the real credentials into the repository.

----------

# Frontend API configuration

One thing to check before deploying changes:

the backend currently allows CORS from:

```text
https://doyouevengif-alt.neocities.org/

```

That value is in `dueg-alt.py`.

If the actual frontend is running from:

```text
https://doyouevengif-alt.netlify.app

```

the CORS configuration needs to allow that origin as well.

For example:

```python
CORS(
    app,
    origins=[
        "https://doyouevengif-alt.netlify.app",
        "https://doyouevengif-alt.neocities.org"
    ],
    supports_credentials=True
)

```

Don't include a trailing slash in the origin value.

----------



## Local vs production

| | Local | Production |
|---|---|---|
| Frontend | `python -m http.server 8000` | Netlify |
| Backend | Flask on `localhost:5000` | PythonAnywhere |
| SMTP | `.env` file | Hosting environment variables |
| HTTPS | Not normally needed | Yes |
| Debugging | Local terminal | Server logs |
| Public access | No | Yes |

# A typical development session

Once everything is set up, development is basically two terminals.

### Terminal 1 — backend

```bash
cd Doyouevengif-Twin_Pears/doyouevengif-alt

```

Activate the virtual environment and run:

```bash
python dueg-alt.py

```

### Terminal 2 — frontend

From the same directory:

```bash
python -m http.server 8000

```

Then visit:

```text
http://127.0.0.1:8000

```

That's it.

There's no frontend build system sitting in the middle, and the backend is just Flask doing the API/email work.

## Repository

The source for this version lives here:

[Haymawon/Doyouevengif-Twin_Pears — dueg-alt / doyouevengif-alt](https://github.com/Haymawon/Doyouevengif-Twin_Pears/tree/dueg-alt/doyouevengif-alt?utm_source=Lain)
