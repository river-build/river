This migration is a copy of the regular migration with one caveat - the
fixed partition schema creates 4 partitions instead of the 256 we use in production.
This change improves unit testing for storage and node tests signficantly, since
the creation of every pg store requires the a full migration, including the creation
of all stream partitions.

Any migrations placed in this directory will be run in place of production ones for unit tests.

