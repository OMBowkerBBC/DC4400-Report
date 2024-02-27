# Architecture Decision Record 022: Single source for schedule data

## Context
Schedule documents rely on catalogue data for titling, programme descriptions, subtitling and viewer discretion data. When requesting 
schedules via the API Gateway the partner also receives episode, series and brand data associated with the schedules requested as part of
the response. This data can be retrieved from the catalogue redis store but the schedules pipeline is then fully reliant on the catalogue pipeline.
This reliance of the catalogue pipeline (`{bcd_v2.0}:`) means that the schedule API gateway is not independent therefore it was requested to make 
catalogue data more integrated within the schedule redis stores. This ADR describes the decision made to ensure data independence.

## Decision
Copy over all catalogue data currently relating to schedules into the keyspace `{bsd_v2.0}:` and `{bsd_v2.0_ref_data}:` respectively on notification 
events or coldstart. This ensures the API Gateway can retrieve all of its information from one source and keep it's integrity and self-consistency.
This data should also be removed when no longer referenced by any schedules.

## Status
Accepted

## Consequences
- Overhead of copying over data existing data.
- Added maintenance and code complexity.
- Potential synchronisation issue when copying/deleting data across redis stores.
