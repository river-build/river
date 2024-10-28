These migrations are a copy of the regular set of migrations with one caveat - the
fixed partition schema creates 8 partitions instead of the 256 we use in production.
This change improves unit testing for storage and node tests signficantly, since
the creation of every pg store requires the a full migration, including the creation
of all stream partitions.