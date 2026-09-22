import React from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import { ThemeProvider } from "next-themes"
import "./index.css"
import "./theme-override.css"
import App from "./App"

// Restore the saved accent color before React mounts. Note: this still
// runs as a deferred module script, so on a hard reload there's a brief
// window where the browser paints the default green before this executes
// — that's expected without a blocking inline script in index.html. What
// this DOES fix is the accent staying green forever until some other
// component happens to re-apply it (e.g. visiting the Theme tab).
try {
  const savedAccent = localStorage.getItem("accent")
  if (savedAccent) {
    document.documentElement.setAttribute("data-accent", savedAccent)
  }
} catch {
  // ignore (e.g. private browsing / storage disabled)
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
    <BrowserRouter basename="/portal">
      <App />
    </BrowserRouter>
  </ThemeProvider>
)