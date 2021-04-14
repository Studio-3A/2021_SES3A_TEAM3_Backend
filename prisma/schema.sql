CREATE TABLE "public"."User" (
  id VARCHAR(255) PRIMARY KEY NOT NULL
);

CREATE TABLE "public"."Post" (
  id SERIAL PRIMARY KEY NOT NULL,
  title VARCHAR(255) NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  content TEXT,
  published BOOLEAN NOT NULL DEFAULT false,
  "authorId" VARCHAR(255) NOT NULL,
  FOREIGN KEY ("authorId") REFERENCES "public"."User"(id)
);

CREATE TABLE "public"."Profile" (
  id SERIAL PRIMARY KEY NOT NULL,
  bio TEXT,
  "userId" VARCHAR(255) UNIQUE NOT NULL,
  FOREIGN KEY ("userId") REFERENCES "public"."User"(id)
);