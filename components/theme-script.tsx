// Runs before paint so a saved theme choice never flashes the wrong colors.
// With no saved choice, nothing is set and CSS follows prefers-color-scheme.
// Also marks the page as JS-enabled so the hero can hide its text until the
// scramble starts (see [data-scramble] in globals.css).
const script = `document.documentElement.classList.add("js");try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
