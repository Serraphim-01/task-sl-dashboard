# Task: Connect backend (local) to DB (Docker)

## Steps to complete:
- [x] 1. Create/update backend/.env with local DATABASE_URL
- [x] 2. Run `docker compose up -d --build db` ✅ DB container created
- [x] 3. Verify DB container running (`docker ps`) ✅ Up/healthy port 5432
- [ ] 4. cd backend && pip install -r requirements.txt (added sqlalchemy[asyncio] asyncpg)
- [ ] 5. cd backend && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
- [ ] 6. Test connection: curl http://localhost:8000/api/v1/health/db

## Progress Notes:
✅ Plan approved by user.
✅ Step 1 completed: .env created/updated.

