import { EmbedBuilder, type APIEmbedField } from "discord.js";

const defaultFooter = "OpenKOTOR Discord Bots";

interface EmbedOptions {
  title: string;
  description: string;
  footer?: string;
  fields?: APIEmbedField[];
}

const createEmbed = (color: number, options: EmbedOptions): EmbedBuilder => {
  return new EmbedBuilder()
    .setColor(color)
    .setTitle(options.title)
    .setDescription(options.description)
    .setFooter({ text: options.footer ?? defaultFooter })
    .setFields(options.fields ?? [])
    .setTimestamp();
};

export const buildInfoEmbed = (options: EmbedOptions): EmbedBuilder => createEmbed(0x3b82f6, options);

export const buildSuccessEmbed = (options: EmbedOptions): EmbedBuilder => createEmbed(0x16a34a, options);

export const buildWarningEmbed = (options: EmbedOptions): EmbedBuilder => createEmbed(0xf59e0b, options);

export const buildErrorEmbed = (options: EmbedOptions): EmbedBuilder => createEmbed(0xdc2626, options);

export const asBulletList = (lines: readonly string[]): string => {
  return lines.map((line) => `- ${line}`).join("\n");
};