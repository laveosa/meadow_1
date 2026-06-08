import { APP_CONFIG } from "#src/config/app-config.js";
import FsService from "#src/utils/services/fs-service.js";
import type { RoomModel } from "#src/const/models/RoomModel.js";

const PATH = APP_CONFIG.dbConf.roomsPath;

export default class RoomsDbService {
  private static cachedData: RoomModel[] = [];
  private static isInitialized = false;

  static async getAllRooms() {
    await this.initCache();
    return [...this.cachedData];
  }

  static async getRoomById(id: number) {
    if (!id) return null;

    await this.initCache();
    return this.cachedData?.find((item) => item.id === id);
  }

  static async addRoom(room: RoomModel) {
    if (!room || !room.id) return null;

    await this.initCache();
    this.cachedData = this.cachedData.filter((item) => item.id !== room.id);
    this.cachedData.push(room);
    await FsService.writeFile(PATH, this.cachedData);
    return room;
  }

  static async updateRoom(room: RoomModel) {
    if (!room || !room.id) return null;

    await this.initCache();
    let updated: RoomModel;
    this.cachedData = this.cachedData.map((item) => {
      if (item.id === room.id) {
        updated = item;
        return room;
      }

      return item;
    });

    if (!updated) return null;

    await FsService.writeFile(PATH, this.cachedData);
    return updated;
  }

  static async removeRoom(id: number) {
    if (!id) return null;

    await this.initCache();
    const removed = this.cachedData.find((item) => item.id === id);

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

  private static async loadFromFile(): Promise<RoomModel[]> {
    try {
      const rawData = (await FsService.readFile(PATH)) as string;
      return rawData.trim() ? JSON.parse(rawData) : [];
    } catch {
      return [];
    }
  }
}
