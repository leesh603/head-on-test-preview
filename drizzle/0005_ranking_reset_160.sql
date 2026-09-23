DELETE FROM scores;
DELETE FROM priority_scores_49;
DELETE FROM priority_scores_71;
DELETE FROM coop_scores_v1;

DELETE FROM sqlite_sequence
WHERE name IN ('scores','priority_scores_49','priority_scores_71','coop_scores_v1');
