import { createReplacer } from "../utils/strings.js";
import { Language } from "../classes/language.js";
import { Locale } from "discord.js";

export default new Language({
  languages: [Locale.Turkish],
  texts: {
    ping: createReplacer("Botun gecikmesi **{0}** milisaniye."),
    language: {
      clear: "Dil silindi.",
      set: {
        error: createReplacer("Dil **{0}** bulunamadı."),
        languages: createReplacer("Mevcut diller: {0}"),
        success: createReplacer("Diliniz **{0}** olarak ayarlandı."),
      },
      info: {
        notDefined: "Ayarlanmadı",
        displayInfo: createReplacer("Görüntüleme dili: **{0}**"),
        userInfo: createReplacer("Kullanıcı dili: **{0}**"),
      },
    },
  },
  commandTexts: {
    ping: {
      name: "gecikme",
      description: "Botun gecikmesini gösterir.",
    },
    owo: {
      name: "owo",
      description: "Owo hatırlatıcılarını yönetir",
      subcommands: {
        list: {
          name: "liste",
          description: "Hatırlatıcıları listeler",
        },
        enable: {
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
        disable: {
          name: "kapat",
          description: "Seçilen veya tüm hatırlatıcıları devre dışı bırakır.",
          options: [
            {
              name: "hatırlatıcılar",
              description:
                "Devre dışı bırakılacak hatırlatıcılar (boşluklarla ayrılır)",
            },
          ],
        },
      },
    },
    language: {
      name: "dil",
      description: "Botun dilini sizin için ayarlar.",
      subcommands: {
        clear: {
          name: "sil",
          description: "Kullanıcı tanımlı görüntüleme dilini siler.",
        },
        info: {
          name: "bilgi",
          description: "Kullanıcıya dil bilgisini gösterir.",
        },
        set: {
          name: "ayarla",
          description: "Kullanıcının görüntüleme dilini ayarlar.",
          options: [
            {
              name: "yeni-dil",
              description: "Kullanılacak dil",
            },
          ],
        },
      },
    },
  },
});
