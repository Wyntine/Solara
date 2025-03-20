import { ItemTypes, ObjectVerifier } from "@wyntine/verifier";

export const configVerifier = new ObjectVerifier()
  .addObject("bot", {
    required: true,
    verifierData: (object) =>
      object
        .addString("token", { required: true })
        .addString("defaultLanguage", { required: true })
        .addArray("developers", {
          required: true,
          verifierData: (item) => item.addString({ repeated: true }),
        }),
  })
  .addObject("commands", {
    required: true,
    verifierData: (object) =>
      object
        .addString("defaultPrefix", { required: true })
        .addBoolean("registerOnStart"),
  })
  .addObject("logs", {
    verifierData: (object) =>
      object
        .addObject("warn", {
          verifierData: (warn) =>
            warn.setGeneralType(ItemTypes.Boolean, (bool) => bool),
        })
        .addObject("error", {
          verifierData: (error) =>
            error.setGeneralType(ItemTypes.Boolean, (bool) => bool),
        })
        .addObject("debug", {
          verifierData: (debug) =>
            debug.setGeneralType(ItemTypes.Boolean, (bool) => bool),
        })
        .addObject("info", {
          verifierData: (info) =>
            info.setGeneralType(ItemTypes.Boolean, (bool) => bool),
        }),
  });
