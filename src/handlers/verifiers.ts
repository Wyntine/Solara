import { ObjectVerifier } from "@wyntine/verifier";

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
      object.addString("defaultPrefix", { required: true }),
  });
