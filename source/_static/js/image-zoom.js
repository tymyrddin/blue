// Make content images clickable so they open full size in a new tab.
// Avoids needing Markdown image links, which MyST turns into Sphinx
// download references rather than plain anchors.
document.addEventListener("DOMContentLoaded", () => {
  const images = document.querySelectorAll(".md-content article img");

  images.forEach((img) => {
    // Skip the theme logo/icons and anything already wrapped in a link.
    if (img.closest("a")) return;
    if (img.classList.contains("md-logo") || img.closest(".md-logo")) return;

    img.style.cursor = "zoom-in";
    img.addEventListener("click", () => {
      // Only open ordinary web URLs, never data:/javascript:/blob: sources.
      if (/^https?:\/\//i.test(img.src)) {
        window.open(img.src, "_blank", "noopener");
      }
    });
  });
});
