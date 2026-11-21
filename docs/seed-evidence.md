# Task 7 - Seed 50 Sample Tickets

## Objective
Prepare 50 fictional sample tickets using CSV-to-JSON conversion and insert them into PostgreSQL using Prisma.

## Files Created
- data/sample-tickets.csv - 50 sample ticket records.
- data/sample-tickets.json - JSON generated from CSV.
- tools/csv-to-json.js - CSV-to-JSON conversion utility.
- prisma/schema.prisma - Ticket database model.
- prisma/seed.js - Duplicate-safe seed script.
- prisma/verify-seed.js - Database verification script.

## Database Model
The Ticket model contains:
- id
- title
- status

## Migration
Command: npx.cmd prisma migrate dev --name create_ticket_table

Result: Migration successfully created and applied.

## CSV to JSON Conversion
Command: node tools/csv-to-json.js data/sample-tickets.csv data/sample-tickets.json

Result: Conversion successful - 50 records.

## Database Seeding
Command: node prisma/seed.js

Result:
- New tickets inserted: 50
- Total tickets in database: 50

## Duplicate-Safety Verification
The seed script was executed again.

Result:
- New tickets inserted: 0
- Total tickets in database: 50

## Prisma Seed Command Verification
Command: npx.cmd prisma db seed

Result:
- New tickets inserted: 0
- Total tickets in database: 50
- Seed command executed successfully.

## Database Record Verification
Command: node prisma/verify-seed.js

Result:
- Total tickets: 50
- First 5 records verified.
- Last 5 records verified.
- Ticket IDs range from 1 to 50.

## Conclusion
Successfully converted 50 fictional ticket records from CSV to JSON and seeded them into PostgreSQL using Prisma. Verified the database records and confirmed that rerunning the seed script does not create duplicate records.