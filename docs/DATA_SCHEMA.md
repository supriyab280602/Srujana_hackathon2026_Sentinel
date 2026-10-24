# Sentinel Data Schema & Entity Specifications

## 1. Domain Entities

```
+--------------------+            +--------------------+
|    Transaction     |            |      Account       |
+--------------------+            +--------------------+
| id (PK)            |<---------->| id (PK)            |
| sender_account_id  |  transacts | risk_score         |
| receiver_account_id|            | baseline_volume    |
| amount             |            | flagged_status     |
| currency           |            +--------------------+
| timestamp          |                      |
| channel            |                      | triggers
+--------------------+                      v
         |                        +--------------------+
         | generates              |     RiskAlert      |
         v                        +--------------------+
+--------------------+            | id (PK)            |
|   RiskEvaluation   |            | account_id (FK)    |
+--------------------+            | transaction_id (FK)|
| score              |            | severity           |
| factors (JSON)     |            | status             |
| zero_lookahead:True|            | detection_rule     |
+--------------------+            +--------------------+
                                            |
                                            | audited by
                                            v
                                  +--------------------+
                                  | InvestigationReview|
                                  +--------------------+
                                  | id (PK)            |
                                  | alert_id (FK)      |
                                  | decision           |
                                  | notes              |
                                  | investigator_id    |
                                  +--------------------+
```

## 2. Table / Document Definitions

### `transactions`
- `id` (VARCHAR / UUID): Primary key.
- `sender_account_id` (VARCHAR): Foreign reference to sender account.
- `receiver_account_id` (VARCHAR): Foreign reference to receiver account.
- `amount` (FLOAT / DECIMAL): Transaction value.
- `currency` (VARCHAR(3)): ISO-4217 currency.
- `timestamp` (TIMESTAMPTZ): Transaction execution time.
- `channel` (ENUM): `wire`, `ach`, `crypto`, `p2p`, `card`.
- `location_country` (VARCHAR(2), optional): Geolocation country code.
- `ip_address` (VARCHAR, optional): Client IP.
- `device_id` (VARCHAR, optional): Device fingerprint.

### `alerts`
- `id` (VARCHAR / UUID): Primary key (e.g., `ALT-8902`).
- `transaction_id` (VARCHAR / UUID): Triggering transaction reference.
- `account_id` (VARCHAR): Suspect account reference.
- `severity` (ENUM): `low`, `medium`, `high`, `critical`.
- `risk_score` (FLOAT): Evaluated risk index [0 - 100].
- `status` (ENUM): `open`, `under_review`, `escalated`, `dismissed`, `resolved`.
- `detection_rule` (VARCHAR): Originating detector name.
- `title` (VARCHAR): Headline summary.
- `summary` (TEXT): Anomaly narrative.
- `factors` (JSONB / List): Array of `{ name, weight, contribution, description }`.
- `created_at` (TIMESTAMPTZ): Alert generation timestamp.

### `investigation_reviews`
- `id` (VARCHAR / UUID): Review log ID.
- `alert_id` (VARCHAR): Target alert ID.
- `decision` (ENUM): `confirm_fraud`, `false_positive`, `needs_escalation`.
- `notes` (TEXT): Auditor explanation.
- `investigator_id` (VARCHAR): User who logged the adjudication.
- `created_at` (TIMESTAMPTZ): Adjudication timestamp.

## 3. Database Migration Strategy (Supabase / PostgreSQL)

When connecting Supabase or PostgreSQL later:
1. Copy table structures above into SQL migrations or Supabase table editor.
2. Provide `DATABASE_URL` or `SUPABASE_URL` / `SUPABASE_KEY` in `backend/.env`.
3. Swap `BaseRepository` in `backend/app/repositories/base.py` to use SQLAlchemy, SQLModel, or the Supabase Python SDK.
