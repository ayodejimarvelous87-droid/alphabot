# AlphaBot Database Recovery

## Database Provider
MongoDB Atlas

## Connection Type
mongodb+srv

## Recovery Steps

1. Open MongoDB Atlas dashboard.
2. Go to Cluster Backup.
3. Select required restore point.
4. Restore snapshot or create a new cluster.
5. Update MONGO_URI in environment variables.
6. Redeploy AlphaBot backend.
7. Verify:
   - Users
   - Wallet balances
   - Transactions
   - Funding records
   - Profit records
   - Service settings

## Verification After Recovery

Check:

GET /api

Wallet balance endpoint

Transaction history

Admin dashboard

VTU purchase flow
