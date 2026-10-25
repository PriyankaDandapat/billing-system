-- CreateTable
CREATE TABLE "outboxevent" (
    "id" UUID NOT NULL,
    "aggregatetype" TEXT NOT NULL,
    "aggregateid" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,

    CONSTRAINT "outboxevent_pkey" PRIMARY KEY ("id")
);
