// src/i18n.ts
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

const resources = {
  en: {
    translation: {
      "common": {
        "loading": "Loading...",
        "back_home": "Back to Home",
        "save": "Save Changes",
        "cancel": "Cancel"
      },
      "register": {
        "title": "Registration Successful!",
        "subtitle": "Thank you for registering. You will receive an SMS confirmation shortly.",
        "order_label": "Your Order Number",
        "qr_instruction": "Scan this QR code to view your registration",
        "save_instruction": "Save this QR code to quickly access your registration details",
        "pickup_instruction": "Please save this number and present it when picking up your food bag."
      }
    }
  },
  es: {
    translation: {
      "common": {
        "loading": "Cargando...",
        "back_home": "Regresar al Inicio",
        "save": "Guardar Cambios",
        "cancel": "Cancelar"
      },
      "register": {
        "title": "¡Registro completado con éxito!",
        "subtitle": "Gracias por registrarte. En breve recibirás un SMS de confirmación.",
        "order_label": "Su número de orden",
        "qr_instruction": "Escanea este código QR para ver tu inscripción",
        "save_instruction": "Guarda este código QR para acceder rápidamente a los datos de tu inscripción",
        "pickup_instruction": "Guarda este número y preséntalo cuando vayas a recoger tu bolsa de comida."
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
