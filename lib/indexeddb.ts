import Dexie from 'dexie'

const USER_DB_NAME = 'mathy-user-db'
const GAME_STORE_KEY = 'default'

export interface GameStoreRecord {
  id: string
  user_uuid: string
  score: number
  last_sync: number
}

class UserDb extends Dexie {
  game_store!: Dexie.Table<GameStoreRecord, string>

  constructor() {
    super(USER_DB_NAME)
    this.version(1).stores({
      game_store: 'id',
    })
  }
}

const userDb = new UserDb()

export async function getUserUuid(): Promise<string | null> {
  const row = await userDb.game_store.get(GAME_STORE_KEY)
  return row?.user_uuid ?? null
}

export async function setUserUuid(uuid: string): Promise<void> {
  const existing = await userDb.game_store.get(GAME_STORE_KEY)
  if (existing) {
    await userDb.game_store.update(GAME_STORE_KEY, { user_uuid: uuid })
  } else {
    await userDb.game_store.put({
      id: GAME_STORE_KEY,
      user_uuid: uuid,
      score: 0,
      last_sync: 0,
    })
  }
}

export async function getLocalScore(): Promise<number> {
  const row = await userDb.game_store.get(GAME_STORE_KEY)
  return row?.score ?? 0
}

export async function setLocalScore(score: number): Promise<void> {
  const existing = await userDb.game_store.get(GAME_STORE_KEY)
  if (existing) {
    await userDb.game_store.update(GAME_STORE_KEY, { score })
  } else {
    await userDb.game_store.put({
      id: GAME_STORE_KEY,
      user_uuid: '',
      score,
      last_sync: 0,
    })
  }
}

export async function getLastSync(): Promise<number> {
  const row = await userDb.game_store.get(GAME_STORE_KEY)
  return row?.last_sync ?? 0
}

export async function setLastSync(timestamp: number): Promise<void> {
  const row = await userDb.game_store.get(GAME_STORE_KEY)
  if (row) {
    await userDb.game_store.update(GAME_STORE_KEY, { last_sync: timestamp })
  }
}

export async function getGameStoreRecord(): Promise<GameStoreRecord | null> {
  const row = await userDb.game_store.get(GAME_STORE_KEY)
  return row ?? null
}

export async function setGameStoreRecord(record: Partial<GameStoreRecord> & { id: string }): Promise<void> {
  const existing = await userDb.game_store.get(GAME_STORE_KEY)
  const merged: GameStoreRecord = {
    ...record,
    id: GAME_STORE_KEY,
    user_uuid: record.user_uuid ?? existing?.user_uuid ?? '',
    score: record.score ?? existing?.score ?? 0,
    last_sync: record.last_sync ?? existing?.last_sync ?? 0,
  }
  await userDb.game_store.put(merged)
}
