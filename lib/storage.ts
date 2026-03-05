import { promises as fs } from "fs"
import path from "path"

function getDataDir() {
  const configured = process.env.DATA_DIR?.trim()
  if (configured) return configured
  return path.join(process.cwd(), "data")
}

export function getDataFilePath(fileName: string) {
  return path.join(getDataDir(), fileName)
}

export async function readJsonFile<T>(fileName: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(getDataFilePath(fileName), "utf8")
    return JSON.parse(raw || "null") as T
  } catch {
    return fallback
  }
}

export async function writeJsonFile(fileName: string, data: unknown) {
  await fs.mkdir(getDataDir(), { recursive: true })
  await fs.writeFile(getDataFilePath(fileName), JSON.stringify(data, null, 2), "utf8")
}
