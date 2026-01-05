function initEditorPanel() {
  const editorHostEl = document.getElementById("editorHost");
  if (!editorHostEl) return;

  const editorWrapEl = editorHostEl.querySelector(".editor_wrap") || document.querySelector(".editor_wrap");
  if (!editorWrapEl) return;

  editorWrapEl.focus();

  function decodeDataUrlImage(dataUrl) {
    return new Promise((resolve) => {
      if (!dataUrl || !dataUrl.startsWith("data:image/")) return resolve(false);
      const img = new Image();
      img.decoding = "async";
      img.onload = async () => {
        try {
          if (typeof img.decode === "function") await img.decode();
        } catch (_) {}
        resolve(true);
      };
      img.onerror = () => resolve(false);
      img.src = dataUrl;
    });
  }

  const tabMenuEl = editorHostEl.querySelector("#userTabMenu");
  const tabPanelsEl = editorHostEl.querySelector("#userTabArea");
  if (!tabMenuEl || !tabPanelsEl) return;

  const USER_COUNT = 5;

  let tabMenuMarkup = "";
  let userPanelsMarkup = "";

  for (let i = 1; i <= USER_COUNT; i++) {
    tabMenuMarkup += `
      <button type="button" class="btn_tab ${i === 1 ? "selected" : ""}" data-user="${i}">유저 ${i}</button>
    `;

    let prefThumbMarkup = "";
    for (let n = 1; n <= 6; n++) {
      prefThumbMarkup += `
        <div class="thumb" data-item="${n}">
          <button type="button" class="btn_upload">
            <i class="fa-solid fa-plus"></i>
          </button>
        </div>
      `;
    }

    userPanelsMarkup += `
      <div class="user_tab_content ${i === 1 ? "selected" : ""}" data-user="${i}">
        <div class="tab">
          <div class="user_info">
            <div class="edit_title">닉네임</div>
            <div class="info_data">
              <input type="text" class="nickname_input" placeholder="최대 10자 입력 가능" maxlength="10" />
              <div class="nick_pos">
                <button type="button" class="btn_pos selected" data-pos="top">위</button>
                <button type="button" class="btn_pos" data-pos="bottom">아래</button>
              </div>
            </div>
          </div>

          <div class="user_info">
            <div class="edit_title">유저 이미지</div>
            <div class="image_area">
              <div class="thumb_box icon_box">
                <input type="file" class="file_input file_icon" accept="image/*" style="display:none">
                <div class="thumb_grid">
                  <div class="thumb" data-item="0">
                    <button type="button" class="btn_upload">
                      <i class="fa-solid fa-plus"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="user_info">
            <div class="edit_title">취향표 이미지</div>
            <div class="image_area">
              <div class="thumb_box pref_box">
                <input type="file" class="file_input file_pref" accept="image/*" style="display:none">
                <div class="thumb_grid">${prefThumbMarkup}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  tabMenuEl.innerHTML = tabMenuMarkup;
  tabPanelsEl.innerHTML = userPanelsMarkup;

  function selectUserEditorTab(userId) {
    const btns = Array.from(tabMenuEl.querySelectorAll(".btn_tab"));
    btns.forEach((b) => b.classList.toggle("selected", Number(b.dataset.user) === userId));

    const panels = Array.from(tabPanelsEl.querySelectorAll(".user_tab_content"));
    panels.forEach((p) => p.classList.toggle("selected", Number(p.dataset.user) === userId));

    bindThumbUpload(".thumb_box.icon_box", ".file_input.file_icon");
    bindThumbUpload(".thumb_box.pref_box", ".file_input.file_pref");

    bindNicknameAndTitlePosition(userId);
  }

  tabMenuEl.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn_tab");
    if (!btn) return;
    const userId = Number(btn.dataset.user);
    if (!userId) return;
    selectUserEditorTab(userId);
  });

  function bindNicknameAndTitlePosition(userId) {
    const activePanelEl = tabPanelsEl.querySelector(`.user_tab_content[data-user="${userId}"]`);
    if (!activePanelEl) return;

    const user = state.users.find((u) => u.id === userId);
    if (!user) return;

    if (activePanelEl.dataset.nickBound === "1") return;
    activePanelEl.dataset.nickBound = "1";

    const nicknameInput = activePanelEl.querySelector(".nickname_input");
    const posWrap = activePanelEl.querySelector(".nick_pos");

    if (nicknameInput) nicknameInput.value = user.nickname || "";

    if (nicknameInput) {
      nicknameInput.addEventListener("input", () => {
        user.nickname = nicknameInput.value || "";
        renderPreviewState();
      });
    }

    if (posWrap) {
      posWrap.addEventListener("click", (e) => {
        const btn = e.target.closest(".btn_pos");
        if (!btn) return;

        const pos = btn.dataset.pos === "bottom" ? "bottom" : "top";
        user.titlePos = pos;

        const all = Array.from(posWrap.querySelectorAll(".btn_pos"));
        all.forEach((b) => b.classList.toggle("selected", b === btn));

        renderPreviewState();
      });
    }
  }

  function bindThumbUpload(boxSelector, inputSelector) {
    const activePanelEl = editorHostEl.querySelector(".user_tab_content.selected");
    if (!activePanelEl) return;

    const thumbBoxEl = activePanelEl.querySelector(boxSelector);
    if (!thumbBoxEl) return;

    const fileInputEl = thumbBoxEl.querySelector(inputSelector);
    const thumbGridEl = thumbBoxEl.querySelector(".thumb_grid");
    if (!fileInputEl || !thumbGridEl) return;

    if (thumbGridEl.dataset.bound === "1") return;
    thumbGridEl.dataset.bound = "1";

    let activeThumbEl = null;

    thumbGridEl.addEventListener("click", (e) => {
      const uploadBtn = e.target.closest(".btn_upload");
      if (!uploadBtn) return;

      activeThumbEl = uploadBtn.closest(".thumb");
      fileInputEl.value = "";
      fileInputEl.click();
    });

    fileInputEl.addEventListener("change", async function () {
      const file = fileInputEl.files[0];
      if (!file || !activeThumbEl) return;

      let img = activeThumbEl.querySelector(".thumb_image");
      if (!img) {
        img = document.createElement("img");
        img.className = "thumb_image";
        activeThumbEl.appendChild(img);
      }

      const reader = new FileReader();
      reader.onload = async function (e) {
        const dataUrl = e.target.result;

        img.setAttribute("src", dataUrl);
        activeThumbEl.classList.add("preview_image");

        await decodeDataUrlImage(dataUrl);

        const activePanelEl = activeThumbEl.closest(".user_tab_content");
        if (!activePanelEl) return;

        const userId = Number(activePanelEl.dataset.user);
        let user = state.users.find((u) => u.id === userId);
        if (!user) return;

        if (thumbBoxEl.classList.contains("icon_box")) {
          user.icon = dataUrl;
        } else {
          const item = Number(activeThumbEl.dataset.item);
          if (item >= 1 && item <= 6) {
            user.prefImages[item - 1] = dataUrl;
          }
        }
        renderPreviewState();
      };

      reader.readAsDataURL(file);

      const uploadBtnEl = activeThumbEl.querySelector(".btn_upload");
      if (uploadBtnEl) uploadBtnEl.style.display = "none";

      let removeBtnEl = activeThumbEl.querySelector(".btn_cancel");
      if (!removeBtnEl) {
        removeBtnEl = document.createElement("button");
        removeBtnEl.type = "button";
        removeBtnEl.className = "btn_cancel";
        removeBtnEl.innerHTML = '<i class="fa-solid fa-x"></i>';
        activeThumbEl.appendChild(removeBtnEl);
      }
    });

    thumbGridEl.addEventListener("click", (e) => {
      const removeBtnEl = e.target.closest(".btn_cancel");
      if (!removeBtnEl) return;

      const thumb = removeBtnEl.closest(".thumb");
      if (!thumb) return;

      const img = thumb.querySelector(".thumb_image");
      if (img) img.remove();

      removeBtnEl.remove();

      const uploadBtnEl = thumb.querySelector(".btn_upload");
      if (uploadBtnEl) uploadBtnEl.style.display = "";

      thumb.classList.remove("preview_image");

      fileInputEl.value = "";

      const activePanelEl = thumb.closest(".user_tab_content");
      if (activePanelEl) {
        const userId = Number(activePanelEl.dataset.user);
        let userObj = state.users.find((u) => u.id === userId);
        if (userObj) {
          if (thumbBoxEl.classList.contains("icon_box")) {
            userObj.icon = null;
          } else {
            const item = Number(thumb.dataset.item);
            if (item >= 1 && item <= 6) {
              userObj.prefImages[item - 1] = null;
            }
          }
          renderPreviewState();
        }
      }
    });
  }

  bindThumbUpload(".thumb_box.icon_box", ".file_input.file_icon");
  bindThumbUpload(".thumb_box.pref_box", ".file_input.file_pref");
  bindNicknameAndTitlePosition(1);

  editorHostEl.addEventListener("click", function (e) {
    const dBtn = e.target.closest(".btn_download");
    if (!dBtn) return;
    if (typeof window.downloadPreviewPng === "function") {
      window.downloadPreviewPng();
    }
  });
}

window.initEditorPanel = initEditorPanel;
window.initEditor = initEditorPanel;