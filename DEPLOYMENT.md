# Simple deployment plan

## Frontend (Vercel)
1. Import the `frontend` folder into Vercel.
2. Set the environment variable:
   - `NEXT_PUBLIC_API_BASE_URL=https://your-backend-url/api`
3. Deploy.

## Backend (Render / Railway / AWS EC2)
1. Deploy the `backend` folder.
2. Start the app with:
   - `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
3. Set the backend URL in Vercel as `NEXT_PUBLIC_API_BASE_URL`.

This keeps the setup simple and functional for a working prototype.
