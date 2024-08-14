-- This must be done in a seperate file to avoid transactions
-- Apply changes to existing data by performing VACUUM FULL
VACUUM FULL miniblock_candidates;
VACUUM FULL es;
VACUUM FULL miniblocks;
VACUUM FULL minipools;
