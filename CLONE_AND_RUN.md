# Clone and Run FaceFit

This guide explains how to download FaceFit from a Git repository and run it locally.

## Requirements

Install these tools before starting:

- [Git](https://git-scm.com/downloads)
- [Node.js](https://nodejs.org/) 20 or newer (includes npm)
- [Expo Go](https://expo.dev/go) on an Android or iOS phone, or an Android/iOS emulator
- MySQL 8 or MariaDB for the API and database
- Python 3.10 or newer if you want to use face analysis

## 1. Clone the repository

Open PowerShell, Terminal, or Git Bash and run:

```bash
git clone <repository-url>
cd <repository-folder>/FaceFit
```

Replace `<repository-url>` with the HTTPS or SSH URL shown on the repository's GitHub page. Replace `<repository-folder>` with the folder created by `git clone`.

If the repository contains FaceFit at its root instead of inside a `FaceFit` folder, use only:

```bash
cd <repository-folder>
```

## 2. Configure and start the API

Create the server environment file.

Windows PowerShell:

```powershell
Copy-Item server/.env.example server/.env
```

macOS, Linux, or Git Bash:

```bash
cp server/.env.example server/.env
```

Open `server/.env` and enter your MySQL username and password. Change `JWT_SECRET` to a long, random value. The default API port is `3000`.

Make sure MySQL or MariaDB is running, then install the server packages and create the database:

```bash
cd server
npm install
npm run db:init
npm run dev
```

Keep this terminal open. The API should be available at `http://localhost:3000`. To verify it, open `http://localhost:3000/api/health` in a browser.

## 3. Configure and start the Expo app

Open a second terminal in the FaceFit folder, then create the app environment file.

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

macOS, Linux, or Git Bash:

```bash
cp .env.example .env
```

The default `EXPO_PUBLIC_API_URL=auto` setting lets Expo Go use the computer that serves the app. Then install and start the app:

```bash
npm install
npm start
```

After Expo starts, you can:

- Scan the QR code with Expo Go on a phone.
- Press `a` to open an Android emulator.
- Press `i` to open an iOS simulator on macOS.
- Press `w` to open the web version.

The computer and physical phone must be connected to the same Wi-Fi network. If automatic API detection does not work, find the computer's local IPv4 address and update `.env`:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.10:3000
```

Replace `192.168.1.10` with the computer's actual IPv4 address, then stop and restart Expo.

## 4. Run face analysis (optional)

Face analysis requires a third terminal. From the FaceFit folder, run the commands for your operating system.

Windows PowerShell:

```powershell
cd face-analysis-service
py -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8000
```

macOS or Linux:

```bash
cd face-analysis-service
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8000
```

The API uses `http://127.0.0.1:8000` by default through the `FACE_ANALYSIS_URL` value in `server/.env`.

## Daily startup

After the first setup, start each required service in a separate terminal:

```bash
# Terminal 1: API
cd FaceFit/server
npm run dev

# Terminal 2: Expo app
cd FaceFit
npm start
```

Start the Python service in a third terminal only when face analysis is needed.

## Common problems

- **Expo cannot connect to the API:** Confirm the phone and computer use the same Wi-Fi, allow Node.js through the firewall, and use the computer's IPv4 address in `.env`.
- **Database connection fails:** Confirm MySQL is running and the `DB_HOST`, `DB_PORT`, `DB_USER`, and `DB_PASSWORD` values in `server/.env` are correct.
- **Port already in use:** Change `PORT` in `server/.env` and `EXPO_PUBLIC_API_PORT` in `.env` to the same available port.
- **Dependencies behave unexpectedly:** Stop the running process, run `npm install` again in both `FaceFit` and `FaceFit/server`, then restart the services.
- **PowerShell blocks virtual-environment activation:** Run `Set-ExecutionPolicy -Scope Process Bypass`, then activate `.venv` again.
