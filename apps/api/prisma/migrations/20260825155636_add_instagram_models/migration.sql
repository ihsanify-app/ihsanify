-- CreateTable
CREATE TABLE "InstagramSettings" (
    "id" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "tokenRefreshedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSyncedAt" TIMESTAMP(3),

    CONSTRAINT "InstagramSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstagramPost" (
    "id" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "permalink" TEXT NOT NULL,
    "caption" TEXT,
    "postedAt" TIMESTAMP(3) NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InstagramPost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InstagramPost_mediaId_key" ON "InstagramPost"("mediaId");
