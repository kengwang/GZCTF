START TRANSACTION;

ALTER TABLE "GameChallenges" DROP COLUMN "EnableAt";

ALTER TABLE "GameChallenges" DROP COLUMN "EndAt";

DELETE FROM "__EFMigrationsHistory"
WHERE "MigrationId" = '20240825191922_AddChallengeTime';

COMMIT;

START TRANSACTION;

ALTER TABLE "GameChallenges" DROP COLUMN "CanSubmit";

ALTER TABLE "ExerciseChallenges" DROP COLUMN "CanSubmit";

DELETE FROM "__EFMigrationsHistory"
WHERE "MigrationId" = '20240726155408_Add_Challenge_CanSubmit';

COMMIT;

