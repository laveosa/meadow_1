import { APP_CONFIG } from "#src/config/app-config.js";
import FsService from "#src/utils/services/fs-service.js";
import type { MessageModel } from "#src/const/models/MessageModel.js";

const PATH = APP_CONFIG.dbConf.messagesPath;

export default class MessagesDbService {
  private static cachedData: MessageModel[] = [];
  private static isInitialized = false;

  static async getAllMessages() {
    await this.initCache();
    return [...this.cachedData];
  }

  static async getMessageById(id: number) {
    if (!id) return null;

    await this.initCache();
    return this.cachedData?.find((item) => item.id === id);
  }

  static async addMessage(message: MessageModel) {
    if (!message || !message.id) return null;

    await this.initCache();
    this.cachedData = this.cachedData.filter((item) => item.id !== message.id);
    this.cachedData.push(message);
    await FsService.writeFile(PATH, this.cachedData);
    return message;
  }

  static async updateMessage(message: MessageModel) {
    if (!message || !message.id) return null;

    await this.initCache();
    let updated: MessageModel;
    this.cachedData = this.cachedData.map((item) => {
      if (item.id === message.id) {
        updated = item;
        return message;
      }

      return item;
    });

    if (!updated) return null;

    await FsService.writeFile(PATH, this.cachedData);
    return updated;
  }

  static async removeMessage(id: number) {
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

  private static async loadFromFile(): Promise<MessageModel[]> {
    try {
      const rawData = (await FsService.readFile(PATH)) as string;
      return rawData.trim() ? JSON.parse(rawData) : [];
    } catch {
      return [];
    }
  }
}
