import chalk from "chalk";

export enum LogLevel {
  ERROR = "error",
  INFO = "info",
  DEBUG = "debug",
  WARN = "warn",
}

const LogLevelMap = {
  [LogLevel.ERROR]: chalk.red,
  [LogLevel.INFO]: chalk.cyan,
  [LogLevel.DEBUG]: chalk.white,
  [LogLevel.WARN]: chalk.yellow,
};

export class Logger {
  private prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  private prepareLogMessage(level: LogLevel): string {
    const timestamp = new Date()
      .toLocaleString("tr-TR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      })
      .replace(/\//g, ".")
      .replace(/:/g, ".");

    const coloredTimestamp = timestamp
      .split(" ")
      .map((text) => chalk.hex("#a3e3ed")(text))
      .join(` ${chalk.bold("•")} `);

    const color = LogLevelMap[level];
    return `[${coloredTimestamp}] [${chalk.hex("#F7F6CF")(this.prefix)}] [${color(level.toUpperCase())}]:`;
  }

  private log(level: LogLevel, messages: unknown[]): void {
    const logMessage = this.prepareLogMessage(level);
    console.log(logMessage, ...messages);
  }

  public error(...messages: unknown[]): void {
    this.log(LogLevel.ERROR, messages);
  }

  public info(...messages: unknown[]): void {
    this.log(LogLevel.INFO, messages);
  }

  public debug(...messages: unknown[]): void {
    this.log(LogLevel.DEBUG, messages);
  }

  public warn(...messages: unknown[]): void {
    this.log(LogLevel.WARN, messages);
  }

  /**
   * Throws an error with the provided messages.
   *
   * @param messages - The messages to include in the error.
   * @throws Throws an error with the concatenated messages.
   * @returns This function never returns as it always throws an error.
   */
  public throw(...messages: unknown[]): never {
    this.error();
    throw new Error(messages.join(" "));
  }
}
