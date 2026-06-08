import { APP_CONFIG } from "#src/config/app-config.js";
import FsService from "#src/utils/services/fs-service.js";
import type { UserModel } from "#src/const/models/UserModel.js";
import type { RoomModel } from "#src/const/models/RoomModel.js";

const PATH = APP_CONFIG.dbConf.usersPath;

export default class UsersDbService {
  private static cachedData: UserModel[] = [];
  private static isInitialized = false;

  static async getAllUsers(room?: RoomModel) {
    await this.initCache();
    return room
      ? this.cachedData.filter((item) => item.roomId === room.id)
      : [...this.cachedData];
  }

  static async getUserById(id: number) {
    if (!id) return null;

    await this.initCache();
    return this.cachedData?.find((item) => item.id === id);
  }

  static async addUser(user: UserModel) {
    if (!user || !user.id) return null;

    await this.initCache();
    this.cachedData = this.cachedData.filter((item) => item.id !== user.id);
    this.cachedData.push(user);
    await FsService.writeFile(PATH, this.cachedData);
    return user;
  }

  static async updateUser(user: UserModel) {
    if (!user || !user.id) return null;

    await this.initCache();
    let updated: UserModel;
    this.cachedData = this.cachedData.map((item) => {
      if (item.id === user.id) {
        updated = item;
        return user;
      }

      return item;
    });

    if (!updated) return null;

    await FsService.writeFile(PATH, this.cachedData);
    return updated;
  }

  static async removeUser(id: number) {
    if (!id) return null;

    await this.initCache();
    const removed: UserModel = this.cachedData.find((item) => item.id === id);

    if (!removed) return null;

    this.cachedData = this.cachedData.filter((item) => item.id !== id);
    await FsService.writeFile(PATH, this.cachedData);
    return removed;
  }

  // ====================================================== PRIVATE

  private static async initCache() {
    if (this.isInitialized) return;
    this.cachedData = await this.loadFromFile();
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
