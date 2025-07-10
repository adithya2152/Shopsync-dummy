"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: {
      translate: {
        TranslateElement: new (options: unknown, containerId: string) => void;
      };
    };
  }
}

export default function GoogleTranslateLoader() {
  useEffect(() => {
    // Inject hidden div
    if (!document.getElementById("google_translate_element")) {
      const div = document.createElement("div");
      div.id = "google_translate_element";
      div.style.display = "none";
      document.body.appendChild(div);
    }

    // Inject script
    if (!document.getElementById("google-translate")) {
      const script = document.createElement("script");
      script.id = "google-translate";
      script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      document.body.appendChild(script);

      // Set up global init function
      window.googleTranslateElementInit = () => {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: "en",
            autoDisplay: false,
          },
          "google_translate_element"
        );
      };
    }
  }, []);

  return null; // nothing to render
}
