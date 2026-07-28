"use strict";

(() => {
    const root = document.documentElement;
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
    let savedTheme = null;

    try {
        const storedValue = window.localStorage.getItem("theme");
        if (storedValue === "light" || storedValue === "dark") {
            savedTheme = storedValue;
        }
    } catch (error) {
        // Storage can be unavailable in privacy-restricted browsing contexts.
    }

    root.dataset.theme = savedTheme || (systemTheme.matches ? "dark" : "light");
    root.dataset.themeSource = savedTheme ? "user" : "system";
})();
