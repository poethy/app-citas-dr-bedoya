// Configuración dinámica: parte de app.json y agrega el archivo de Firebase para Android.
// google-services.json no va al repo. En EAS llega como variable de tipo archivo
// (GOOGLE_SERVICES_JSON); en local se usa ./google-services.json si existe.
const fs = require('fs');

module.exports = ({ config }) => {
  const archivoFirebase =
    process.env.GOOGLE_SERVICES_JSON ??
    (fs.existsSync('./google-services.json') ? './google-services.json' : undefined);
  return {
    ...config,
    android: {
      ...config.android,
      ...(archivoFirebase ? { googleServicesFile: archivoFirebase } : {}),
    },
  };
};
