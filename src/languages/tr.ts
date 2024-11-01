import { Locale } from "discord.js";
import { createReplacer } from "../utils/strings.js";
import { Language } from "../classes/language.js";

export default new Language({
  languages: [Locale.Turkish],
  texts: {
    ping: createReplacer("Botun gecikmesi **{0}** milisaniye."),
  },
  commandTexts: {
    ping: {
      name: "gecikme",
      description: "Botun gecikmesini gösterir.",
    },
    owo: {
      name: "owo",
      description: "Owo hatırlatıcılarını yönetir",
      subcommands: [
        {
          name: "liste",
          description: "Hatırlatıcıları listeler",
        },
        {
          name: "aç",
          description: "Seçilen veya tüm hatırlatıcıları aktifleştirir.",
          options: [
            {
              name: "hatırlatıcılar",
              description:
                "Aktif edilecek hatırlatıcılar (boşluklarla ayrılır)",
            },
          ],
        },
        {
          name: "kapat",
          description: "Seçilen veya tüm hatırlatıcıları devre dışı bırakır.",
          options: [
            {
              name: "hatırlatıcılar",
              description:
                "Devre dışı bırakılacak hatırlatıcılar (boşluklarla ayrılır)",
            },
            {
              name: "deneme",
              description: "deneme",
            },
          ],
        },
      ],
    },
    text: {
      name: "yazı",
      description: "Yazdığını bota yazdırır.",
      options: [
        {
          name: "mesaj",
          description: "Yazılacak mesaj",
        },
      ],
    },
    language: {
      name: "dil",
      description: "Botun dilini sizin için ayarlar.",
      options: [
        {
          name: "yeni-dil",
          description: "Kullanılacak dil",
        },
      ],
    },
    tepki: {
      name: "tepki",
      description: "Tepki sistemini ayarlar.",
    },
  },
});
