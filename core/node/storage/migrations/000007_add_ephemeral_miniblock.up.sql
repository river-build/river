-- Add ephemeral miniblock state as a new column to the miniblocks table
DO $$
    DECLARE

    suffix CHAR(2);
    i INT;

    numPartitions INT;

    BEGIN

        SELECT num_partitions from settings where single_row_key=true into numPartitions;

        FOR i IN 0.. numPartitions LOOP
                suffix = LPAD(TO_HEX(i), 2, '0');

                EXECUTE 'ALTER TABLE miniblocks_m' || suffix || ' ADD ephemeral BOOLEAN DEFAULT NULL;';
                EXECUTE 'ALTER TABLE miniblocks_r' || suffix || ' ADD ephemeral BOOLEAN DEFAULT NULL;';
        END LOOP;

    END;
$$;
