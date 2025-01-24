import type { LocalizationMap } from "discord.js";
import type {
  CommandName,
  CommandNames,
  FinalLanguageBaseCommandTexts,
  LanguageCommandTexts,
} from "../types/files.types.ts";
import { isString } from "@wyntine/verifier";
import { commandLogger } from "../handlers/logger.ts";
import { basename } from "path";
import { getCommandText } from "../handlers/language.ts";

export class LanguageCommand {
  protected commandPath?: string;
  protected names?: CommandNames;
  protected texts?: LanguageCommandTexts<FinalLanguageBaseCommandTexts>;

  /**
   * Compiles and sets language-specific data for the command.
   *
   * @throws When command text data is empty
   */
  public setLangData(
    commandTextsData?: LanguageCommandTexts<FinalLanguageBaseCommandTexts>,
  ): void {
    if (commandTextsData) {
      this.setTexts(commandTextsData);
      this.setNames(commandTextsData.name, commandTextsData.name_localizations);
      return;
    }

    const commandName = this.getFileName();
    const commandTexts = getCommandText(commandName);

    if (!commandTexts) {
      return commandLogger.throw(
        `Empty command text data on command '${commandName}'`,
      );
    }

    this.setTexts(commandTexts);
    this.setNames(commandTexts.name, commandTexts.name_localizations);
  }

  /**
   * Retrieves the command texts for the current command.
   *
   * @returns The command texts for different languages
   * @throws If no command texts are found
   */
  public getTexts(): LanguageCommandTexts<FinalLanguageBaseCommandTexts> {
    return this.texts ?? commandLogger.throw("No command texts found.");
  }

  public setTexts(
    texts: LanguageCommandTexts<FinalLanguageBaseCommandTexts>,
  ): void {
    this.texts = texts;
  }

  /**
   * Sets the command names for different locales and the default name.
   *
   * @param defaultName - The default name of the command to be used when a locale-specific name is not available
   * @param names - A map of locale-specific command names where keys are locales and values are the localized command names
   */
  public setNames(defaultName: string, names?: LocalizationMap): void {
    this.names = [
      defaultName,
      ...(Object.entries(names ?? {}) as CommandName[]),
    ];
  }

  /**
   * Returns an array of all command names associated with this command instance.
   *
   * @returns An array of string
   */
  public listAllNames(): string[] {
    const [defaultName, ...others] = this.names ?? [];
    return [defaultName, ...others.map((name) => name[1])].filter((text) =>
      isString(text),
    );
  }

  /**
   * Checks if the command has any of the specified names.
   *
   * @param names - Variable number of strings to check against command names
   * @returns True if any of the provided names match any of the command's names, false otherwise
   */
  public hasAnyName(...names: string[]): boolean {
    const allNames = this.listAllNames();
    return names.some((name) => allNames.includes(name));
  }

  /**
   * Gets the command path associated with this command.
   *
   * @returns The command path string if set
   * @throws If command path has not been set
   */
  public getFilePath(): string {
    if (!isString(this.commandPath)) {
      return commandLogger.throw("Command path has not been set.");
    }

    return this.commandPath;
  }

  /**
   * Sets the command path and extracts the command file name without extension.
   *
   * @param commandPath - The full file path of the command.
   */
  public setFilePath(commandPath: string): void {
    this.commandPath = commandPath;
  }

  /**
   * Retrieves the command file name.
   *
   * @returns The command file name as a string.
   * @throws If the command file name has not been set.
   */
  public getFileName(): string {
    return basename(this.getFilePath(), ".ts");
  }
}
