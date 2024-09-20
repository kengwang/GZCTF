START TRANSACTION;

ALTER TABLE "GameChallenges" ADD "CanSubmit" boolean NOT NULL DEFAULT FALSE;

ALTER TABLE "ExerciseChallenges" ADD "CanSubmit" boolean NOT NULL DEFAULT FALSE;

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20240726155408_Add_Challenge_CanSubmit', '8.0.8');

COMMIT;

START TRANSACTION;

ALTER TABLE "GameChallenges" ADD "EnableAt" timestamp with time zone;

ALTER TABLE "GameChallenges" ADD "EndAt" timestamp with time zone;

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20240825191922_AddChallengeTime', '8.0.8');

COMMIT;

-- Migrate Invitation Code

START TRANSACTION;

UPDATE "Games" SET "Organizations" = '{}';

COMMIT;

