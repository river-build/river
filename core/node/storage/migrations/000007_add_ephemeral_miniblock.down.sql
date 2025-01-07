-- Remove ephemeral column from miniblocks table
DO $$
    DECLARE

    suffix CHAR(2);
    i INT;

    numPartitions INT;

    BEGIN

        SELECT num_partitions from settings where single_row_key=true into numPartitions;

        FOR i IN 0.. numPartitions LOOP
            suffix = LPAD(TO_HEX(i), 2, '0');

            EXECUTE 'ALTER TABLE miniblocks_m' || suffix || ' DROP COLUMN ephemeral;';
            EXECUTE 'ALTER TABLE miniblocks_r' || suffix || ' DROP COLUMN ephemeral;';
        END LOOP;

    END;
$$;

