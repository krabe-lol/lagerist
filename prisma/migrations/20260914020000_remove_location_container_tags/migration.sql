-- Only Items keep tags; Locations and Containers no longer support them.
-- Both join tables are empty in this database, so a plain DROP is safe.
DROP TABLE "LocationTag";
DROP TABLE "ContainerTag";
