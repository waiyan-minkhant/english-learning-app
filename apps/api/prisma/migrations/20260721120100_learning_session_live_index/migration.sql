-- Allow multiple LearningSessions per LiveSession over time (only one live at a time in app logic)
DROP INDEX IF EXISTS "LearningSession_liveSessionId_key";
