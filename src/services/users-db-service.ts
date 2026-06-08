import { CONFIG } from "#src/config/app-config.js";
import FsService from "#src/utils/services/fs-service.js";
import type { UserModel } from "#src/const/models/UserModel.js";
import type { RoomModel } from "#src/const/models/RoomModel.js";

const PATH = CONFIG.dbConf.usersPath;

export default class UsersDbService {
  private static userCache: UserModel[] = [];
  private static isInitialized = false;

  static async getAllUsers(room?: RoomModel) {
    await this.initCache();
    return room
      ? this.userCache.filter((u) => u.roomId === room.id)
      : [...this.userCache];
  }

  static async getUserById(id: number) {
    if (!id) return null;

    await this.initCache();
    return this.userCache?.find((user) => user.id === id);
  }

  static async addUser(user: UserModel) {
    if (!user || !user.id) return null;

    await this.initCache();
    this.userCache = this.userCache.filter((u) => u.id !== user.id);
    this.userCache.push(user);
    await FsService.writeFile(PATH, this.userCache);
    return user;
  }

  static async removeUser(id: number) {
    if (!id) return null;

    await this.initCache();
    const removedUser: UserModel = this.userCache.find(
      (user) => user.id === id,
    );

    if (!removedUser) return null;

    this.userCache = this.userCache.filter((user) => user.id !== id);
    await FsService.writeFile(PATH, this.userCache);
    return removedUser;
  }

  static async updateUser(user: UserModel) {
    if (!user || !user.id) return null;

    await this.initCache();
    let updated;
    this.userCache = this.userCache.map((item) => {
      if (item.id === user.id) {
        updated = true;
        return user;
      }

      return item;
    });

    if (!updated) return null;

    await FsService.writeFile(PATH, this.userCache);
    return user;
  }

  // ====================================================== PRIVATE

  private static async initCache() {
    if (this.isInitialized) return;
    this.userCache = await this.loadFromFile();
    this.isInitialized = true;
  }

  private static async loadFromFile(): Promise<UserModel[]> {
    try {
      const rawData = (await FsService.readFile(PATH)) as string;
      return rawData.trim() ? JSON.parse(rawData) : [];
    } catch {
      return [];
    }
  }
}
