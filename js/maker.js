document.addEventListener("DOMContentLoaded", function () {
  var host = document.getElementById("editorHost");
  if (!host) return;

  fetch("./editor.html")
    .then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status + " " + res.statusText);
      return res.text();
    })
    .then(function (html) {
      host.innerHTML = html;

      if (typeof window.initEditorPanel === "function") {
        window.initEditorPanel();
      } else if (typeof window.initEditor === "function") {
        window.initEditor();
      }
    })
    .catch(function (err) {
      console.error("editor.html 로드 실패:", err);
      host.innerHTML = "<p>에디터를 불러오지 못했습니다.</p>";
    });
});