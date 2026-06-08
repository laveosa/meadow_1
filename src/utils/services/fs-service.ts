import fsP from "node:fs/promises";
import { constants } from "node:fs";
import { getErrorMessage } from "#src/utils/helpers/api-helper.js";

export default class FsService {
  constructor() {}

  static async createFolder(targetPath: string) {
    if (!targetPath || targetPath.length === 0) return null;

    try {
      return await fsP.mkdir(targetPath, { recursive: true });
    } catch (error) {
      const errorMsg = getErrorMessage(error);
      console.log(`Error create a folder path: "${targetPath}" : ${errorMsg}`);
      throw errorMsg;
    }
  }

  static async readFile(targetPath: string): Promise<string> {
    if (!targetPath || targetPath.length === 0) return null;

    try {
      return await fsP.readFile(targetPath, "utf8");
    } catch (error) {
      const errorMsg = getErrorMessage(error);
      console.log(`Error read a file path: "${targetPath}" : ${errorMsg}`);
      throw errorMsg;
    }
  }

  static async writeFile(targetPath: string, data: any) {
    if (!targetPath || targetPath.length === 0 || !data) return null;

    try {
      return await fsP.writeFile(targetPath, data, "utf8");
    } catch (error) {
      const errorMsg = getErrorMessage(error);
      console.log(`Error write to a file path: "${targetPath}" : ${errorMsg}`);
      throw errorMsg;
    }
  }

  static async deleteFile(targetPath: string): Promise<void> {
    if (!targetPath || targetPath.length === 0) return null;

    try {
      return await fsP.unlink(targetPath);
    } catch (error) {
      const errorMsg = getErrorMessage(error);
      console.log(`Error deleting file path: "${targetPath}" : ${errorMsg}`);
      throw errorMsg;
    }
  }

  static async deleteFolder(targetPath: string): Promise<void> {
    if (!targetPath || targetPath.length === 0) return null;

    try {
      return await fsP.rm(targetPath, { recursive: true, force: true });
    } catch (error) {
      const errorMsg = getErrorMessage(error);
      console.log(`Error deleting folder path: "${targetPath}" : ${errorMsg}`);
      throw errorMsg;
    }
  }

  // ======================================================= UTIL OPTIONS

  static async isFileExists(targetPath: string) {
    if (!targetPath || targetPath.length === 0) return null;

    try {
      await fsP.access(targetPath, constants.F_OK);
      return true;
    } catch (error: any) {
      if (error.code === "ENOENT") {
        return false;
      }

      throw getErrorMessage(error);
    }
  }
}
