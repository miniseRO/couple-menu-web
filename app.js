(function () {
  const KEY = "couple_menu_pages_v1";
  const DEFAULT_CATEGORY = "家常";
  const SEED_DISHES = [
    { name: "西红柿炒鸡蛋", category: "家常" },
    { name: "蒸排骨", category: "荤菜" },
    { name: "蚝油生菜", category: "素菜" },
    { name: "红烧肉", category: "荤菜" },
    { name: "蒸鱼", category: "海鲜" },
    { name: "腐乳空心菜", category: "素菜" },
    { name: "鸡蛋蒸肉", category: "家常" },
    { name: "爆炒蛤蜊", category: "海鲜" },
  ];

  const state = loadState();
  let selectedCategory = "全部";
  let editMode = false;

  const els = {
    toast: document.getElementById("toast"),
    editToggle: document.getElementById("edit-toggle"),
    dishForm: document.getElementById("dish-form"),
    dishName: document.getElementById("dish-name"),
    categorySelect: document.getElementById("category-select"),
    categoryCustom: document.getElementById("category-custom"),
    categoryList: document.getElementById("category-list"),
    dishList: document.getElementById("dish-list"),
    bulkEditForm: document.getElementById("bulk-edit-form"),
    editList: document.getElementById("edit-list"),
    bulkCancel: document.getElementById("bulk-cancel"),
    cartList: document.getElementById("cart-list"),
    clearCart: document.getElementById("clear-cart"),
    confirmOrder: document.getElementById("confirm-order"),
    shareLink: document.getElementById("share-link"),
    shareOutput: document.getElementById("share-output"),
  };

  function loadState() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return { dishes: [], cart: {}, orders: [] };
      const parsed = JSON.parse(raw);
      return {
        dishes: Array.isArray(parsed.dishes) ? parsed.dishes : [],
        cart: parsed.cart && typeof parsed.cart === "object" ? parsed.cart : {},
        orders: Array.isArray(parsed.orders) ? parsed.orders : [],
      };
    } catch {
      return { dishes: [], cart: {}, orders: [] };
    }
  }

  function saveState() {
    localStorage.setItem(KEY, JSON.stringify(state));
  }

  function ensureSeedData() {
    if (Array.isArray(state.dishes) && state.dishes.length > 0) return;
    state.dishes = SEED_DISHES.map((d, idx) => ({
      id: idx + 1,
      name: d.name,
      category: d.category,
    }));
    state.cart = {};
    if (!Array.isArray(state.orders)) state.orders = [];
    saveState();
  }

  function notify(msg) {
    if (!els.toast) return;
    els.toast.textContent = msg;
    els.toast.hidden = false;
    setTimeout(() => {
      if (els.toast) els.toast.hidden = true;
    }, 2000);
  }

  function nowISODate() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function monthPrefix() {
    return nowISODate().slice(0, 7);
  }

  function allCategories() {
    const set = new Set();
    state.dishes.forEach((d) => {
      if (d.category) set.add(d.category);
    });
    if (!set.size) set.add(DEFAULT_CATEGORY);
    return Array.from(set);
  }

  function rebuildCategorySelect() {
    const categories = allCategories();
    const keep = els.categorySelect.value;
    els.categorySelect.innerHTML = "";
    categories.forEach((cat) => {
      const op = document.createElement("option");
      op.value = cat;
      op.textContent = cat;
      els.categorySelect.appendChild(op);
    });
    const custom = document.createElement("option");
    custom.value = "__custom__";
    custom.textContent = "+ 新分类";
    els.categorySelect.appendChild(custom);

    if (categories.includes(keep)) {
      els.categorySelect.value = keep;
    } else {
      els.categorySelect.value = categories[0];
    }
  }

  function toggleCustomCategoryInput() {
    const isCustom = els.categorySelect.value === "__custom__";
    els.categoryCustom.classList.toggle("hidden", !isCustom);
    els.categoryCustom.required = isCustom;
    if (!isCustom) els.categoryCustom.value = "";
  }

  function calcMonthlySalesMap() {
    const map = {};
    const prefix = monthPrefix();
    state.orders.forEach((o) => {
      if (!o.date || !o.date.startsWith(prefix)) return;
      (o.items || []).forEach((it) => {
        const key = String(it.id);
        map[key] = (map[key] || 0) + Number(it.qty || 0);
      });
    });
    return map;
  }

  function renderCategories() {
    const categories = ["全部", ...allCategories()];
    if (!categories.includes(selectedCategory)) selectedCategory = "全部";
    els.categoryList.innerHTML = "";
    categories.forEach((cat) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = `cat-item${cat === selectedCategory ? " active" : ""}`;
      b.textContent = cat;
      b.addEventListener("click", () => {
        selectedCategory = cat;
        render();
      });
      els.categoryList.appendChild(b);
    });
  }

  function filteredDishes() {
    if (selectedCategory === "全部") return state.dishes;
    return state.dishes.filter((d) => d.category === selectedCategory);
  }

  function renderDishList() {
    const salesMap = calcMonthlySalesMap();
    const dishes = filteredDishes();
    els.dishList.innerHTML = "";

    if (!dishes.length) {
      const empty = document.createElement("div");
      empty.className = "dish-row";
      empty.innerHTML = "<div>这个分类还没有菜</div>";
      els.dishList.appendChild(empty);
      return;
    }

    dishes.forEach((d) => {
      const row = document.createElement("article");
      row.className = "dish-row";
      const left = document.createElement("div");
      const sales = salesMap[String(d.id)] || 0;
      left.innerHTML = `<h3 class="dish-name">${escapeHtml(d.name)}</h3><p class="dish-sales">月售${sales}+</p>`;

      const plus = document.createElement("button");
      plus.type = "button";
      plus.className = "plus-btn";
      plus.textContent = "+";
      plus.addEventListener("click", () => addToCart(d.id, 1));

      row.appendChild(left);
      row.appendChild(plus);
      els.dishList.appendChild(row);
    });
  }

  function renderEditList() {
    const dishes = filteredDishes();
    const options = allCategories()
      .map((c) => `<option value="${escapeAttr(c)}"></option>`)
      .join("");

    els.editList.innerHTML = "";
    dishes.forEach((d) => {
      const row = document.createElement("div");
      row.className = "edit-row";
      row.innerHTML = `
        <div class="edit-grid">
          <input name="name_${d.id}" value="${escapeAttr(d.name)}" required />
          <input name="category_${d.id}" value="${escapeAttr(d.category)}" list="edit-cats-${d.id}" required />
          <datalist id="edit-cats-${d.id}">${options}</datalist>
        </div>
      `;
      const hidden = document.createElement("input");
      hidden.type = "hidden";
      hidden.name = "dish_ids";
      hidden.value = String(d.id);
      row.appendChild(hidden);
      els.editList.appendChild(row);
    });
  }

  function addToCart(id, qty) {
    const key = String(id);
    const next = (Number(state.cart[key] || 0) + qty);
    if (next <= 0) {
      delete state.cart[key];
    } else {
      state.cart[key] = next;
    }
    saveState();
    renderCart();
  }

  function renderCart() {
    els.cartList.innerHTML = "";
    const entries = Object.entries(state.cart);
    if (!entries.length) {
      els.cartList.textContent = "还没点菜";
      return;
    }
    entries.forEach(([id, qty]) => {
      const dish = state.dishes.find((d) => String(d.id) === String(id));
      if (!dish) return;
      const row = document.createElement("div");
      row.className = "cart-item";
      row.innerHTML = `
        <span>${escapeHtml(dish.name)}</span>
        <span class="qty-ops">
          <button type="button" data-op="minus">-</button>
          <strong>${qty}</strong>
          <button type="button" data-op="plus">+</button>
        </span>
      `;
      const buttons = row.querySelectorAll("button");
      buttons[0].addEventListener("click", () => addToCart(id, -1));
      buttons[1].addEventListener("click", () => addToCart(id, 1));
      els.cartList.appendChild(row);
    });
  }

  function normalizeCategoryFromForm(fd) {
    const sel = String(fd.get("category_select") || "").trim();
    if (sel === "__custom__") {
      return String(fd.get("category_custom") || "").trim();
    }
    return sel;
  }

  function createDish(name, category) {
    const nextId = state.dishes.reduce((m, d) => Math.max(m, Number(d.id || 0)), 0) + 1;
    state.dishes.push({ id: nextId, name, category });
    saveState();
  }

  function confirmOrder() {
    const entries = Object.entries(state.cart);
    if (!entries.length) {
      notify("购物车为空");
      return;
    }
    const items = entries.map(([id, qty]) => ({ id: Number(id), qty: Number(qty) }));
    state.orders.push({ date: nowISODate(), items });
    state.cart = {};
    saveState();
    render();
    notify("下单成功");
  }

  function encodePayload(payload) {
    const json = JSON.stringify(payload);
    const bytes = new TextEncoder().encode(json);
    let bin = "";
    bytes.forEach((b) => { bin += String.fromCharCode(b); });
    return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }

  function decodePayload(text) {
    const pad = text.length % 4 === 0 ? "" : "=".repeat(4 - (text.length % 4));
    const b64 = text.replace(/-/g, "+").replace(/_/g, "/") + pad;
    const bin = atob(b64);
    const bytes = Uint8Array.from(bin, (ch) => ch.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);
    return JSON.parse(json);
  }

  function buildShareLink() {
    const entries = Object.entries(state.cart);
    if (!entries.length) {
      notify("购物车为空，无法分享");
      return;
    }
    const items = entries
      .map(([id, qty]) => {
        const d = state.dishes.find((x) => String(x.id) === String(id));
        if (!d) return null;
        return { name: d.name, category: d.category, qty: Number(qty) };
      })
      .filter(Boolean);

    const payload = { v: 1, date: nowISODate(), items };
    const encoded = encodePayload(payload);
    const url = new URL(window.location.href);
    url.searchParams.set("import", encoded);
    url.searchParams.delete("done");
    els.shareOutput.value = url.toString();
    navigator.clipboard?.writeText(url.toString()).catch(() => null);
    notify("链接已生成并尝试复制");
  }

  function importFromUrlIfExists() {
    const url = new URL(window.location.href);
    const raw = url.searchParams.get("import");
    if (!raw) return;

    try {
      const payload = decodePayload(raw);
      if (!payload || !Array.isArray(payload.items)) throw new Error("bad");

      payload.items.forEach((it) => {
        const name = String(it.name || "").trim();
        const category = String(it.category || "").trim() || DEFAULT_CATEGORY;
        const qty = Math.max(1, Number(it.qty || 1));
        if (!name) return;

        let dish = state.dishes.find((d) => d.name === name && d.category === category);
        if (!dish) {
          const nextId = state.dishes.reduce((m, d) => Math.max(m, Number(d.id || 0)), 0) + 1;
          dish = { id: nextId, name, category };
          state.dishes.push(dish);
        }
        const key = String(dish.id);
        state.cart[key] = Number(state.cart[key] || 0) + qty;
      });

      saveState();
      notify("已自动导入今日菜单");
      url.searchParams.delete("import");
      url.searchParams.set("done", "1");
      history.replaceState(null, "", url.toString());
    } catch {
      notify("导入链接无效");
    }
  }

  function toggleEditMode() {
    editMode = !editMode;
    els.editToggle.textContent = editMode ? "退出编辑" : "编辑模式";
    render();
  }

  function saveBulkEdits(fd) {
    const ids = fd.getAll("dish_ids").map((x) => Number(x)).filter((x) => Number.isFinite(x));
    if (!ids.length) {
      notify("没有可保存项");
      return;
    }
    ids.forEach((id) => {
      const name = String(fd.get(`name_${id}`) || "").trim();
      const category = String(fd.get(`category_${id}`) || "").trim();
      if (!name || !category) return;
      const row = state.dishes.find((d) => Number(d.id) === id);
      if (!row) return;
      row.name = name;
      row.category = category;
    });
    saveState();
    editMode = false;
    els.editToggle.textContent = "编辑模式";
    render();
    notify("已批量保存");
  }

  function render() {
    rebuildCategorySelect();
    toggleCustomCategoryInput();
    renderCategories();
    renderCart();
    if (editMode) {
      els.bulkEditForm.classList.remove("hidden");
      els.dishList.classList.add("hidden");
      renderEditList();
    } else {
      els.bulkEditForm.classList.add("hidden");
      els.dishList.classList.remove("hidden");
      renderDishList();
    }
  }

  function bindEvents() {
    els.categorySelect.addEventListener("change", toggleCustomCategoryInput);
    els.editToggle.addEventListener("click", toggleEditMode);
    els.clearCart.addEventListener("click", () => {
      state.cart = {};
      saveState();
      renderCart();
    });
    els.confirmOrder.addEventListener("click", confirmOrder);
    els.shareLink.addEventListener("click", buildShareLink);
    els.bulkCancel.addEventListener("click", () => {
      editMode = false;
      els.editToggle.textContent = "编辑模式";
      render();
    });
    els.bulkEditForm.addEventListener("submit", (e) => {
      e.preventDefault();
      saveBulkEdits(new FormData(els.bulkEditForm));
    });
    els.dishForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(els.dishForm);
      const name = String(fd.get("name") || "").trim();
      const category = normalizeCategoryFromForm(fd);
      if (!name) return notify("菜名不能为空");
      if (!category) return notify("分类不能为空");
      createDish(name, category);
      els.dishName.value = "";
      if (els.categorySelect.value === "__custom__") els.categoryCustom.value = "";
      render();
      notify("已加入菜库");
    });
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function escapeAttr(text) {
    return escapeHtml(text).replace(/`/g, "&#96;");
  }

  ensureSeedData();
  importFromUrlIfExists();
  bindEvents();
  render();
})();
