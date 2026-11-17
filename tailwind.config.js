// Colores y tipografía de la página 🧱 Fundamentos del Figma.
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  // La app es solo de tema claro (app.json: userInterfaceStyle "light"). En web, NativeWind
  // necesita "class" para que el navegador no intente forzar el modo oscuro.
  darkMode: "class",
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        navy: {
          50: "#F3F6FB",
          100: "#E6ECF5",
          300: "#8FA9D1",
          500: "#2F5D9E",
          700: "#1B3A66",
          800: "#13294B",
          900: "#0B1F3A",
          950: "#07142B",
        },
        gris: {
          100: "#F2F4F7",
          200: "#E3E6EB",
          300: "#C9CED6",
          400: "#9AA1AE",
          500: "#6B7280",
          700: "#3D434E",
          900: "#1A1D23",
        },
        exito: { DEFAULT: "#1E8E5A", bg: "#E5F5EC" },
        aviso: { DEFAULT: "#B7791F", bg: "#FDF3E1" },
        error: { DEFAULT: "#C0392B", bg: "#FBE9E7" },
      },
      fontFamily: {
        poppins: ["Poppins_400Regular"],
        "poppins-medium": ["Poppins_500Medium"],
        "poppins-semibold": ["Poppins_600SemiBold"],
      },
      // Estilos de texto del Figma: tamaño / interlineado
      fontSize: {
        display: ["28px", "36px"],
        titulo1: ["22px", "30px"],
        titulo2: ["18px", "26px"],
        subtitulo: ["16px", "24px"],
        cuerpo: ["14px", "22px"],
        etiqueta: ["12px", "16px"],
        pie: ["12px", "18px"],
        boton: ["15px", "20px"],
      },
    },
  },
  plugins: [],
};
