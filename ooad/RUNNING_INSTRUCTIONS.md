# AutoCare Project – Running & Verification Guide

## Backend

1. **Activate virtual environment** (if you created one) and install dependencies:
   ```powershell
   cd "C:\Users\Javith Basha J\Desktop\ooad\backend"
   py -m pip install -r requirements.txt
   ```
2. **Apply migrations / create tables** (SQLite will auto‑create on startup, but you can run Alembic if desired):
   ```powershell
   py -m alembic upgrade head
   ```
3. **Run the seed script** (creates demo admin, mechanics, customers, etc.):
   ```powershell
   py -m scripts.seed
   ```
4. **Start the FastAPI server**:
   ```powershell
   py -m uvicorn app.main:app --reload --port 8000
   ```
   - Verify it started:
     ```powershell
     curl http://127.0.0.1:8000/health
     ```
     Expected output: `{ "status": "ok" }`

5. **Run backend tests** (should all pass):
   ```powershell
   py -m pytest -q
   ```
   Output should end with something like `5 passed`.

---

## Frontend

1. **Install Node dependencies** (if not already done):
   ```powershell
   cd "C:\Users\Javith Basha J\Desktop\ooad\frontend"
   npm install
   ```
2. **Start the Vite development server**:
   ```powershell
   npm run dev
   ```
   - The server runs on **http://localhost:5173** and proxies API calls to the backend at `http://localhost:8000/api/v1`.
3. **Open the UI** in your browser:
   - Visit `http://localhost:5173`.
   - You should see the landing page. Use the demo credentials created by the seed script, e.g.:
     - **Admin** – `admin@autocare.com` / `Admin@123`
     - **Mechanic** – `john.mechanic@autocare.com` / `Mech@123`
     - **Customer** – `alice@example.com` / `Cust@123`
4. **Frontend sanity check**
   - After logging in, you should be redirected to the role‑specific dashboard.
   - Try browsing service packages, adding a vehicle, or creating a booking – the UI will call the running backend API.

---

## Quick Troubleshooting

- **Backend not reachable**: Ensure port 8000 is free and the server shows `Uvicorn running on http://127.0.0.1:8000`.
- **Frontend shows a blank page**: Verify the Vite dev server started without errors and that the proxy target (`http://localhost:8000`) is reachable.
- **CORS errors**: The backend reads `CORS_ORIGINS` from `.env`. The default `.env.example` already includes `http://localhost:5173`. If you changed it, restart the backend.
- **Tests failing**: Re‑run `py -m pytest -q`. If any fail, the most common cause is stale database state – delete `autocare.db` and run the seed script again.

---

## Next Development Steps (if you want to extend)

1. **Add UI tests** with Vitest / React Testing Library.
2. **Implement more analytics** in the admin dashboard (use the existing report service).
3. **Replace the demo payment flow** with a real provider when ready.
4. **Dockerise** the application for easier deployment (optional, not required for the assignment).

Feel free to explore the project folders:
- Backend code lives under `backend/app/`.
- Frontend source lives under `frontend/src/`.
- Database migrations are in `backend/alembic/`.

Enjoy building and testing the AutoCare system!
