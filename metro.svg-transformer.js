// Transformador de SVG para Metro.
// react-native-svg-transformer/expo busca el transformador de Expo por su cuenta y, si no lo
// encuentra (pasa en Vercel con la instalación de npm), queda en null y la compilación falla
// sin decir por qué. Aquí se resuelve desde el paquete expo, así funciona igual en cualquier equipo.
const path = require('path');
const { createTransformer } = require('react-native-svg-transformer');

const rutaExpo = path.dirname(require.resolve('expo/package.json'));
const transformadorExpo = require(
  require.resolve('@expo/metro-config/babel-transformer', { paths: [rutaExpo] }),
);

module.exports.transform = createTransformer(transformadorExpo);
