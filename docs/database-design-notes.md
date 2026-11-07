# SupportDesk Database Design Notes

## 1. Project Overview

This document records the database design observations and index decisions for the SupportDesk project.

## 2. Current Ticket Entity

Based on the existing ticket repository:

| Field | Example | Observation |
|---|---|---|
| id | 1 | Ticket identifier |
| title | Login issue | Ticket title |
| status | Open | Ticket status |

Note: These fields are based on the current sample implementation. Final requirements must be confirmed from the PRD.

## 3. Confirmed Application Query

### Get All Tickets

- **HTTP Method:** GET
- **Route:** `/`
- **Controller:** `getAllTickets`
- **Service:** `getAllTickets`
- **Repository:** `getAllTickets`

The API retrieves all ticket records and returns them in a JSON response.

## 4. Index Decisions

### Confirmed Query: Get All Tickets

- **Query/use case:** Retrieve all tickets.
- **Fields indexed:** No additional secondary index.
- **Reason:** The operation retrieves all records without filtering. An additional secondary index does not provide a clear benefit for this query.

### Primary Key Index

- **Field:** `id`
- **Decision:** Use `id` as the Primary Key if confirmed by final database requirements.
- **Reason:** PostgreSQL automatically creates a unique index for a Primary Key.

### Queries Requiring Confirmation

The following queries are not currently implemented or confirmed by the available code:

- Find a ticket by ID.
- List tickets by status.
- List tickets assigned to an agent.
- List comments for a ticket.

No additional indexes are recommended for these queries until their requirements are confirmed.

## 5. Index Trade-offs

- Indexes require additional storage.
- Indexes can improve data retrieval performance.
- INSERT, UPDATE, and DELETE operations may become slower because indexes must be maintained.
- Unnecessary indexes should be avoided.

## 6. Conclusion

The current implementation confirms only the Get All Tickets operation. No additional secondary index is justified by the available implementation.

Index decisions will be reviewed after the PRD, final Prisma schema, and actual application queries are available.