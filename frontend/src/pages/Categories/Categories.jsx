import { useEffect, useMemo, useState } from "react";
import {
  FolderOpen,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
} from "lucide-react";

import "./Categories.css";

const CATEGORY_API =
  `${import.meta.env.VITE_API_BASE_URL}/api/inventory/categories/`;

const EMPTY_FORM = {
  name: "",
  description: "",
  is_active: true,
};

const getList = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
};

function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ ...EMPTY_FORM });

  // =========================================
  // FETCH CATEGORIES
  // =========================================

  const fetchCategories = async (showLoader = false) => {
    try {
      if (showLoader) {
        setLoading(true);
      }

      setError("");

      const response = await fetch(CATEGORY_API);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data?.detail || "Categories load cheyyan kazhinjilla."
        );
      }

      setCategories(getList(data));
    } catch (err) {
      console.error("Fetch categories error:", err);
      setError(err.message || "Unable to load categories.");
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchCategories(true);
  }, []);

  // =========================================
  // ACTIVE / INACTIVE CATEGORIES
  // =========================================

  const activeCategories = useMemo(
    () => categories.filter((item) => item.is_active !== false),
    [categories]
  );

  const inactiveCategories = useMemo(
    () => categories.filter((item) => item.is_active === false),
    [categories]
  );

  // =========================================
  // OPEN NEW CATEGORY FORM
  // =========================================

  const openAddCategory = () => {
    setEditingCategory(null);
    setFormData({ ...EMPTY_FORM });
    setError("");
    setShowForm(true);
  };

  // =========================================
  // OPEN EDIT CATEGORY FORM
  // =========================================

  const openEditCategory = (category) => {
    setEditingCategory(category);

    setFormData({
      name: category.name || "",
      description: category.description || "",
      is_active: category.is_active !== false,
    });

    setError("");
    setShowForm(true);
  };

  // =========================================
  // CLOSE FORM
  // =========================================

  const closeForm = () => {
    if (saving) return;

    setShowForm(false);
    setEditingCategory(null);
    setFormData({ ...EMPTY_FORM });
    setError("");
  };

  // =========================================
  // HANDLE FORM INPUT
  // =========================================

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // =========================================
  // SAVE / UPDATE CATEGORY
  // =========================================

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const categoryName = formData.name.trim();

    if (!categoryName) {
      setError("Category name enter cheyyuka.");
      return;
    }

    const duplicate = categories.some(
      (item) =>
        item.name?.trim().toLowerCase() ===
          categoryName.toLowerCase() &&
        String(item.id) !== String(editingCategory?.id)
    );

    if (duplicate) {
      setError("Ee category already undu.");
      return;
    }

    try {
      setSaving(true);

      const isEditing = Boolean(editingCategory);

      const url = isEditing
        ? `${CATEGORY_API}${editingCategory.id}/`
        : CATEGORY_API;

      const method = isEditing ? "PATCH" : "POST";

      const payload = {
        name: categoryName,
        description: formData.description.trim(),
        is_active: formData.is_active,
      };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const details =
          data?.detail ||
          Object.entries(data || {})
            .map(([key, value]) => {
              const message = Array.isArray(value)
                ? value.join(", ")
                : String(value);

              return `${key}: ${message}`;
            })
            .join(" ");

        throw new Error(
          details || "Category save cheyyan kazhinjilla."
        );
      }

      setShowForm(false);
      setEditingCategory(null);
      setFormData({ ...EMPTY_FORM });
      setError("");

      await fetchCategories();
    } catch (err) {
      console.error("Save category error:", err);
      setError(err.message || "Unable to save category.");
    } finally {
      setSaving(false);
    }
  };

  // =========================================
  // DELETE CATEGORY
  // =========================================

  const handleDelete = async (category) => {
    const confirmed = window.confirm(
      `"${category.name}" delete cheyyano?`
    );

    if (!confirmed) return;

    try {
      setError("");

      const response = await fetch(
        `${CATEGORY_API}${category.id}/`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));

        throw new Error(
          data?.detail ||
            "Category delete cheyyan kazhinjilla. Ee category use cheyyunna commodities undaakum."
        );
      }

      setCategories((previous) =>
        previous.filter(
          (item) => String(item.id) !== String(category.id)
        )
      );
    } catch (err) {
      console.error("Delete category error:", err);
      setError(err.message || "Unable to delete category.");
    }
  };

  // =========================================
  // CATEGORY ROW
  // =========================================

  const renderCategory = (category) => {
    const isActive = category.is_active !== false;

    return (
      <div className="category-row" key={category.id}>
        <div className="category-folder-icon">
          <FolderOpen size={27} strokeWidth={1.7} />
        </div>

        <div className="category-name-area">
          <strong>{category.name}</strong>
        </div>

        <span
          className={`category-status ${
            isActive ? "active" : "inactive"
          }`}
        >
          {isActive ? "Active" : "Inactive"}
        </span>

        <div className="category-actions">
          <button
            type="button"
            className="category-edit-btn"
            title="Edit category"
            aria-label={`Edit ${category.name}`}
            onClick={() => openEditCategory(category)}
          >
            <Pencil size={19} />
          </button>

          <button
            type="button"
            className="category-delete-btn"
            title="Delete category"
            aria-label={`Delete ${category.name}`}
            onClick={() => handleDelete(category)}
          >
            <Trash2 size={19} />
          </button>
        </div>
      </div>
    );
  };

  // =========================================
  // MAIN PAGE
  // =========================================

  return (
    <section className="categories-page">
      {/* HEADER */}

      <header className="categories-header">
        <div className="categories-heading">
          <h1>Commodity Categories</h1>

          <p>
            {activeCategories.length} active
            <span className="category-count-separator"> · </span>
            {inactiveCategories.length} inactive
          </p>
        </div>

        {!showForm && (
          <button
            type="button"
            className="new-category-btn"
            onClick={openAddCategory}
          >
            <Plus size={22} strokeWidth={2.5} />
            <span>New Category</span>
          </button>
        )}
      </header>

      {/* GENERAL ERROR */}

      {error && !showForm && (
        <div className="categories-error">
          <span>{error}</span>

          <button
            type="button"
            onClick={() => fetchCategories(true)}
          >
            Retry
          </button>
        </div>
      )}

      {/* INLINE ADD / EDIT FORM */}

      {showForm && (
        <section className="category-inline-form">
          <form onSubmit={handleSubmit}>
            <div className="category-inline-field">
              <input
                type="text"
                name="name"
                placeholder="Category name *"
                value={formData.name}
                onChange={handleChange}
                autoFocus
                required
              />
            </div>

            <div className="category-inline-field">
              <input
                type="text"
                name="description"
                placeholder="Description (optional)"
                value={formData.description}
                onChange={handleChange}
              />
            </div>

            {/* Active status for editing only */}

            {editingCategory && (
              <label className="category-inline-active">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                />
                <span>Category is active</span>
              </label>
            )}

            {error && (
              <div className="categories-error">
                <span>{error}</span>
              </div>
            )}

            <div className="category-inline-actions">
              <button
                type="button"
                className="category-inline-cancel"
                onClick={closeForm}
                disabled={saving}
              >
                <X size={17} />
                Cancel
              </button>

              <button
                type="submit"
                className="category-inline-save"
                disabled={saving}
              >
                {saving ? (
                  "Saving..."
                ) : (
                  <>
                    <Check size={17} />
                    Save
                  </>
                )}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* CATEGORY LIST */}

      {loading ? (
        <div className="categories-message">
          Loading categories...
        </div>
      ) : (
        <>
          {/* ACTIVE */}

          <section className="category-section-card">
            <div className="category-section-header">
              <h2>Active ({activeCategories.length})</h2>
            </div>

            {activeCategories.length === 0 ? (
              <div className="category-empty">
                <FolderOpen size={32} />

                <strong>No active categories yet</strong>

                <p>
                  New Category click cheythu category add cheyyuka.
                </p>
              </div>
            ) : (
              <div className="category-list">
                {activeCategories.map(renderCategory)}
              </div>
            )}
          </section>

          {/* INACTIVE */}

          {inactiveCategories.length > 0 && (
            <section className="category-section-card inactive-section">
              <div className="category-section-header">
                <h2>
                  Inactive ({inactiveCategories.length})
                </h2>
              </div>

              <div className="category-list">
                {inactiveCategories.map(renderCategory)}
              </div>
            </section>
          )}
        </>
      )}
    </section>
  );
}

export default Categories;