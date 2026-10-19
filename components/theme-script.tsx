// Runs before paint so a saved theme choice never flashes the wrong colors.
// With no saved choice, nothing is set and CSS follows prefers-color-scheme.
const script = `try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
