# DSS_PGT14
GitHub Repoistory for Designing Secure Software coding

## Environment setup for teammates

1. Copy `.env.example` to `.env` in the repository root for Docker Compose values.
2. Copy `app/.env.example` to `app/.env` for Node app runtime values.
3. Replace placeholder secrets, especially `STRIPE_SECRET_KEY` and `SESSION_SECRET`.
4. Start services with `docker compose up`.
