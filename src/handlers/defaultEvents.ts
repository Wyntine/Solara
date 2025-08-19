import type { Interaction, Message } from "discord.js";
import { errorEmbed } from "../utils/embeds.ts";
import {
  prepareMessageCommandHelper,
  prepareSlashCommandHelper,
} from "./command.ts";
import { isNumber } from "@wyntine/verifier";
import { voidErrorHandler } from "../utils/client.ts";

export async function defaultCommandDetectionEvent(
  interaction: Interaction | Message,
): Promise<void> {
  const isMessageInteraction = "author" in interaction;

  if (!isMessageInteraction && !interaction.isChatInputCommand()) return;

  const helpers = isMessageInteraction
    ? prepareMessageCommandHelper(interaction)
    : prepareSlashCommandHelper(interaction);

  if (!helpers) return;

  const result = helpers.isExecutable();

  if (!result.executable) {
    const { errorKey } = result;

    if (!errorKey) return;
    // TODO: Check the error key.

    const message = helpers.getErrorMessage(errorKey);

    if (!message) return;

    if (errorKey === "cooldown") {
      const isNotUsed = helpers.setCooldownChecked(true);

      if (!isNotUsed) return;
    }

    const errorReply = await helpers.reply({ embeds: [errorEmbed(message)] });

    if (errorKey === "cooldown") {
      const cooldown = helpers.getRemainingCooldownAsMiliseconds();

      if (cooldown) {
        const maxTimeout = 10000;
        const deletionTime = cooldown >= maxTimeout ? maxTimeout : cooldown;

        setTimeout(() => {
          void (async () => {
            await errorReply.delete().catch(voidErrorHandler);
            helpers.setCooldownChecked(false);
          })();
        }, deletionTime);
      }
    }
    return;
  }

  const isExecuted = await helpers.executeCommand();

  if (!isExecuted) return;

  if (
    !helpers.isCooldownSet &&
    isNumber(helpers.getCommandCooldownAsSeconds())
  ) {
    helpers.startCooldown();
  }
}
