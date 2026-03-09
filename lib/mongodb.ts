import { Db, MongoClient } from "mongodb";

function getMongoDbName() {
  return process.env.MONGODB_DB?.trim() || "zerowaste_db";
}

export function hasMongoConfig() {
  const uri = process.env.MONGODB_URI?.trim();
  if (uri) return true;

  const user = process.env.MONGODB_USER?.trim();
  const pass = process.env.MONGODB_PASS?.trim();
  const host = process.env.MONGODB_HOST?.trim();
  return Boolean(user && pass && host);
}

export function getMongoUri() {
  const uri = process.env.MONGODB_URI?.trim();
  if (uri) return uri;

  const user = process.env.MONGODB_USER?.trim();
  const pass = process.env.MONGODB_PASS?.trim();
  const host = process.env.MONGODB_HOST?.trim();
  const dbName = getMongoDbName();
  const appName = process.env.MONGODB_APP_NAME?.trim();

  if (!user || !pass || !host) return undefined;

  const appNameParam = appName ? `&appName=${encodeURIComponent(appName)}` : "";
  return `mongodb+srv://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${host}/${dbName}?retryWrites=true&w=majority${appNameParam}`;
}

export async function connectMongo(): Promise<{ client: MongoClient; db: Db }> {
  const uri = getMongoUri();
  if (!uri) {
    throw new Error("MongoDB config missing");
  }

  const client = new MongoClient(uri);
  await client.connect();
  return { client, db: client.db(getMongoDbName()) };
}
