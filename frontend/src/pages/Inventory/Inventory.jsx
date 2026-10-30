import "./Inventory.css";
import { authenticatedFetch } from "../../utils/authenticatedFetch";
import { useEffect, useMemo, useState } from "react";

import {
  Package,
  Plus,
  Search,
  Pencil,
  Boxes,
  IndianRupee,
  CheckCircle,
  AlertTriangle,
  Ban,
  Power,
  X,
} from "lucide-react";

const EQUIPMENT_API =
  "http://127.0.0.1:8000/api/inventory/equipment/";

const CATEGORY_API =
  "http://127.0.0.1:8000/api/inventory/categories/";

const emptyForm = {
  sku: "",
  category: "",
  name: "",
  total_stock: "",
  available_stock: "",
  daily_rent: "",
  description: "",
  is_active: true,
};

const initialStockAdjustment = {
  mode: "add",
  quantity: "1",
  reason: "Purchase / Received",
  notes: "",
};

function Inventory() {
  const [equipment, setEquipment] = useState([]);
  const [categories, setCategories] = useState([]);

  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [availableOnly, setAvailableOnly] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState(null);
  const [selectedEquipment, setSelectedEquipment] = useState(null);

  const [formData, setFormData] = useState({
    ...emptyForm,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [showStockModal, setShowStockModal] = useState(false);
  const [stockAdjustment, setStockAdjustment] = useState({
    ...initialStockAdjustment,
  });
  const [adjustingStock, setAdjustingStock] =
    useState(false);

  /* =====================================================
     FETCH EQUIPMENT
  ===================================================== */

  const fetchEquipment = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await authenticatedFetch(EQUIPMENT_API);

      if (!response.ok) {
        throw new Error("Failed to fetch equipment");
      }

      const data = await response.json();

      setEquipment(
        Array.isArray(data)
          ? data
          : data.results || []
      );
    } catch (err) {
      console.error(err);
      setError(
        "Equipment load cheyyan kazhinjilla."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
     FETCH CATEGORIES
  ===================================================== */

  const fetchCategories = async () => {
    try {
      const response = await authenticatedFetch(CATEGORY_API);

      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }

      const data = await response.json();

      setCategories(
        Array.isArray(data)
          ? data
          : data.results || []
      );
    } catch (err) {
      console.error(err);
      setCategories([]);
    }
  };

  useEffect(() => {
    fetchEquipment();
    fetchCategories();
  }, []);

  /* =====================================================
     CATEGORY NAME
  ===================================================== */

  const getCategoryName = (categoryId) => {
    const category = categories.find(
      (item) =>
        Number(item.id) === Number(categoryId)
    );

    return category?.name || "Uncategorized";
  };

  /* =====================================================
     FORM CHANGE
  ===================================================== */

  const handleChange = (event) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  };

  /* =====================================================
     ADD COMMODITY
  ===================================================== */

  const openAddModal = () => {
    setEditingEquipment(null);

    setFormData({
      ...emptyForm,
    });

    setError("");
    setShowModal(true);
  };

  /* =====================================================
     EDIT COMMODITY
  ===================================================== */

  const openEditModal = (item) => {
    setEditingEquipment(item);

    setFormData({
      sku:
        item.sku ||
        item.code ||
        "",
      category:
        item.category ?? "",
      name:
        item.name ?? "",
      total_stock:
        item.total_stock ?? "",
      available_stock:
        item.available_stock ?? "",
      daily_rent:
        item.daily_rent ?? "",
      description:
        item.description ?? "",
      is_active:
        item.is_active ?? true,
    });

    setError("");
    setShowModal(true);
  };

  /* =====================================================
     CLOSE COMMODITY FORM
  ===================================================== */

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);

    setEditingEquipment(null);

    setFormData({
      ...emptyForm,
    });

    setError("");
  };

  /* =====================================================
     CREATE / UPDATE COMMODITY
  ===================================================== */

  const handleSubmit = async (event) => {
    event.preventDefault();

    setSaving(true);
    setError("");

    try {
      const totalStock =
        Number(formData.total_stock) || 0;

      const availableStock = editingEquipment
        ? Number(
            formData.available_stock
          ) || 0
        : totalStock;

      const payload = {
        category:
          Number(formData.category),

        name:
          formData.name.trim(),

        total_stock:
          totalStock,

        available_stock:
          availableStock,

        daily_rent:
          Number(formData.daily_rent) || 0,

        description:
          formData.description.trim(),

        is_active:
          formData.is_active,
      };

      if (!payload.category) {
        throw new Error(
          "Please select a category."
        );
      }

      if (!payload.name) {
        throw new Error(
          "Equipment name is required."
        );
      }

      if (payload.total_stock < 0) {
        throw new Error(
          "Total stock cannot be negative."
        );
      }

      if (payload.available_stock < 0) {
        throw new Error(
          "Available stock cannot be negative."
        );
      }

      if (
        payload.available_stock >
        payload.total_stock
      ) {
        throw new Error(
          "Available stock cannot be greater than total stock."
        );
      }

      if (payload.daily_rent < 0) {
        throw new Error(
          "Daily rent cannot be negative."
        );
      }

      const url = editingEquipment
        ? `${EQUIPMENT_API}${editingEquipment.id}/`
        : EQUIPMENT_API;

      const method = editingEquipment
        ? "PUT"
        : "POST";

      const response = await authenticatedFetch(url, {
        method,
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        const message =
          data?.detail ||
          data?.message ||
          Object.values(data || {})
            .flat()
            .join(" ") ||
          "Something went wrong.";

        throw new Error(message);
      }

      const updatedItem = {
        ...data,
        sku:
          formData.sku ||
          data.sku ||
          data.code ||
          editingEquipment?.sku ||
          "",
      };

      if (editingEquipment) {
        setEquipment((previous) =>
          previous.map((item) =>
            item.id ===
            editingEquipment.id
              ? updatedItem
              : item
          )
        );

        if (
          selectedEquipment?.id ===
          editingEquipment.id
        ) {
          setSelectedEquipment(
            updatedItem
          );
        }
      } else {
        setEquipment((previous) => [
          ...previous,
          updatedItem,
        ]);
      }

      closeModal();
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Save cheyyan kazhinjilla."
      );
    } finally {
      setSaving(false);
    }
  };

  /* =====================================================
     DELETE
  ===================================================== */

  const handleDelete = async (item) => {
    const confirmed = window.confirm(
      `"${item.name}" delete cheyyanam enn sure aano?`
    );

    if (!confirmed) return;

    try {
      const response = await authenticatedFetch(
        `${EQUIPMENT_API}${item.id}/`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const data = await response
          .json()
          .catch(() => ({}));

        throw new Error(
          data?.detail ||
            data?.message ||
            "Delete cheyyan kazhinjilla."
        );
      }

      setEquipment((previous) =>
        previous.filter(
          (equipmentItem) =>
            equipmentItem.id !== item.id
        )
      );

      if (
        selectedEquipment?.id ===
        item.id
      ) {
        setSelectedEquipment(null);
      }
    } catch (err) {
      console.error(err);

      alert(
        err.message ||
          "Delete failed."
      );
    }
  };

  /* =====================================================
     STOCK STATUS
  ===================================================== */

  const getStockStatus = (item) => {
    if (!item.is_active) {
      return {
        text: "Inactive",
        className: "inactive",
      };
    }

    const total =
      Number(item.total_stock) || 0;

    const available =
      Number(item.available_stock) || 0;

    if (available === 0) {
      return {
        text: "Out of Stock",
        className:
          "out-of-stock",
      };
    }

    if (
      available /
        Math.max(total, 1) <=
      0.2
    ) {
      return {
        text: "Low Stock",
        className:
          "low-stock",
      };
    }

    return {
      text: "In Stock",
      className:
        "in-stock",
    };
  };

  /* =====================================================
     COUNTS
  ===================================================== */

  const totalEquipment =
    equipment.length;

  const inStockCount =
    equipment.filter((item) => {
      const total =
        Number(item.total_stock) || 0;

      const available =
        Number(item.available_stock) || 0;

      return (
        item.is_active &&
        available > 0 &&
        available /
          Math.max(total, 1) >
          0.2
      );
    }).length;

  const lowStockCount =
    equipment.filter((item) => {
      const total =
        Number(item.total_stock) || 0;

      const available =
        Number(item.available_stock) || 0;

      return (
        item.is_active &&
        available > 0 &&
        available /
          Math.max(total, 1) <=
          0.2
      );
    }).length;

  const outOfStockCount =
    equipment.filter(
      (item) =>
        item.is_active &&
        Number(item.available_stock || 0) ===
          0
    ).length;

  const inactiveCount =
    equipment.filter(
      (item) =>
        item.is_active === false
    ).length;

  /* =====================================================
     FILTER
  ===================================================== */

  const filteredEquipment =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return equipment.filter(
        (item) => {
          const total =
            Number(
              item.total_stock || 0
            );

          const available =
            Number(
              item.available_stock || 0
            );

          const category =
            getCategoryName(
              item.category
            ).toLowerCase();

          const name =
            String(
              item.name || ""
            ).toLowerCase();

          const sku =
            String(
              item.sku ||
                item.code ||
                ""
            ).toLowerCase();

          const searchMatch =
            !query ||
            name.includes(query) ||
            sku.includes(query) ||
            category.includes(query);

          let statusMatch = true;

          if (
            stockFilter ===
            "in-stock"
          ) {
            statusMatch =
              item.is_active &&
              available > 0 &&
              available /
                Math.max(total, 1) >
                0.2;
          }

          if (
            stockFilter ===
            "low-stock"
          ) {
            statusMatch =
              item.is_active &&
              available > 0 &&
              available /
                Math.max(total, 1) <=
                0.2;
          }

          if (
            stockFilter ===
            "out-of-stock"
          ) {
            statusMatch =
              item.is_active &&
              available === 0;
          }

          if (
            stockFilter ===
            "inactive"
          ) {
            statusMatch =
              item.is_active ===
              false;
          }

          return (
            searchMatch &&
            statusMatch &&
            (
              !availableOnly ||
              available > 0
            )
          );
        }
      );
    }, [
      equipment,
      categories,
      search,
      stockFilter,
      availableOnly,
    ]);

  /* =====================================================
     STOCK ADJUSTMENT OPEN
  ===================================================== */

  const openStockAdjustModal = (
    item
  ) => {
    setSelectedEquipment(item);

    setStockAdjustment({
      ...initialStockAdjustment,
    });

    setError("");

    setShowStockModal(true);
  };

  /* =====================================================
     STOCK ADJUSTMENT CLOSE
  ===================================================== */

  const closeStockAdjustModal = () => {
    if (adjustingStock) return;

    setShowStockModal(false);

    setStockAdjustment({
      ...initialStockAdjustment,
    });

    setError("");
  };

  /* =====================================================
     STOCK ADJUSTMENT SUBMIT
  ===================================================== */

  const handleStockAdjustment =
    async (event) => {
      event.preventDefault();

      if (!selectedEquipment) {
        return;
      }

      const item =
        selectedEquipment;

      const quantity =
        Math.floor(
          Number(
            stockAdjustment.quantity
          )
        );

      if (
        !Number.isFinite(
          quantity
        ) ||
        quantity <= 0
      ) {
        setError(
          "Quantity must be greater than 0."
        );

        return;
      }

      const currentTotal =
        Number(
          item.total_stock || 0
        );

      const currentAvailable =
        Number(
          item.available_stock ||
            0
        );

      let newTotal =
        currentTotal;

      let newAvailable =
        currentAvailable;

      if (
        stockAdjustment.mode ===
        "add"
      ) {
        newTotal =
          currentTotal +
          quantity;

        newAvailable =
          currentAvailable +
          quantity;
      } else {
        if (
          quantity >
          currentAvailable
        ) {
          setError(
            "Cannot remove more than available stock."
          );

          return;
        }

        newTotal =
          Math.max(
            currentTotal -
              quantity,

            currentTotal -
              currentAvailable
          );

        newAvailable =
          Math.max(
            currentAvailable -
              quantity,
            0
          );
      }

      try {
        setAdjustingStock(true);
        setError("");

        const payload = {
          category:
            Number(item.category),

          name:
            item.name,

          total_stock:
            newTotal,

          available_stock:
            newAvailable,

          daily_rent:
            Number(
              item.daily_rent || 0
            ),

          description:
            item.description || "",

          is_active:
            item.is_active ?? true,
        };

        const response = await authenticatedFetch(
          `${EQUIPMENT_API}${item.id}/`,
          {
            method: "PUT",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify(
                  payload
                ),
            }
          );

        const data =
          await response
            .json()
            .catch(() => ({}));

        if (!response.ok) {
          const message =
            data?.detail ||
            data?.message ||
            Object.values(
              data || {}
            )
              .flat()
              .join(" ") ||
            "Stock adjust cheyyan kazhinjilla.";

          throw new Error(
            message
          );
        }

        const updatedItem = {
          ...item,
          ...data,
          total_stock:
            newTotal,
          available_stock:
            newAvailable,
        };

        setEquipment(
          (previous) =>
            previous.map(
              (equipmentItem) =>
                equipmentItem.id ===
                item.id
                  ? updatedItem
                  : equipmentItem
            )
        );

        setSelectedEquipment(
          updatedItem
        );

        closeStockAdjustModal();
      } catch (err) {
        console.error(err);

        setError(
          err.message ||
            "Stock adjust cheyyan kazhinjilla."
        );
      } finally {
        setAdjustingStock(false);
      }
    };

  /* =====================================================
     ADD / EDIT PAGE
  ===================================================== */

  const renderCommodityForm =
    () => {
      return (
        <section className="page commodity-form-page">

          <div className="commodity-form-breadcrumb">

            <button
              type="button"
              className="commodity-back-button"
              onClick={closeModal}
              disabled={saving}
            >
              ←
            </button>

            <span>
              Commodities
            </span>

            <span className="commodity-breadcrumb-slash">
              /
            </span>

            <strong>
              {editingEquipment
                ? "Edit Commodity"
                : "New Commodity"}
            </strong>

          </div>


          <div className="commodity-form-card">

            <div className="commodity-form-header">

              <h1>
                {editingEquipment
                  ? "Edit Commodity"
                  : "Add New Commodity"}
              </h1>

            </div>


            {error && (
              <div className="commodity-form-error">
                {error}
              </div>
            )}


            <form
              className="commodity-form"
              onSubmit={handleSubmit}
            >

              <div className="commodity-form-field">

                <label>
                  Name <span>*</span>
                </label>

                <input
                  type="text"
                  name="name"
                  placeholder="e.g. Tent (4-person)"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />

              </div>


              <div className="commodity-form-field">

                <label>
                  SKU <span>*</span>
                </label>

                <input
                  type="text"
                  name="sku"
                  placeholder="e.g. TENT-4P"
                  value={formData.sku}
                  onChange={handleChange}
                  required
                />

              </div>


              <div className="commodity-form-field">

                <label>
                  Category <span>*</span>
                </label>

                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                >

                  <option value="">
                    Select a category...
                  </option>

                  {categories.map(
                    (category) => (
                      <option
                        key={category.id}
                        value={category.id}
                      >
                        {category.name}
                      </option>
                    )
                  )}

                </select>

              </div>


              <div className="commodity-form-field">

                <label>
                  Daily Rate (₹)
                  <span>*</span>
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  name="daily_rent"
                  placeholder="0.00"
                  value={
                    formData.daily_rent
                  }
                  onChange={
                    handleChange
                  }
                  required
                />

              </div>


              <div className="commodity-form-field">

                <label>
                  Total Quantity
                  <span>*</span>
                </label>

                <input
                  type="number"
                  min="0"
                  name="total_stock"
                  placeholder="100"
                  value={
                    formData.total_stock
                  }
                  onChange={
                    handleChange
                  }
                  required
                />

              </div>


              <div className="commodity-form-field">

                <label>
                  Description
                </label>

                <textarea
                  name="description"
                  rows="5"
                  placeholder="Optional description..."
                  value={
                    formData.description
                  }
                  onChange={
                    handleChange
                  }
                />

              </div>

              <div className="commodity-form-actions">

                <button
                  type="submit"
                  className="commodity-create-button"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingEquipment
                    ? "Update Commodity"
                    : "Create Commodity"}
                </button>


                <button
                  type="button"
                  className="commodity-cancel-button"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

              </div>

            </form>

          </div>

        </section>
      );
    };

  /* =====================================================
     STOCK ADJUSTMENT MODAL
  ===================================================== */

  const renderStockAdjustModal =
    () => {
      if (
        !showStockModal ||
        !selectedEquipment
      ) {
        return null;
      }

      const item =
        selectedEquipment;

      const total =
        Number(
          item.total_stock || 0
        );

      const available =
        Number(
          item.available_stock ||
            0
        );

      return (
        <div
          className="stock-adjust-overlay"
          onClick={
            closeStockAdjustModal
          }
        >

          <div
            className="stock-adjust-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="stock-adjust-header">

              <h2>
                Adjust Stock
              </h2>

              <button
                type="button"
                className="stock-adjust-close"
                onClick={
                  closeStockAdjustModal
                }
                disabled={
                  adjustingStock
                }
              >
                <X size={21} />
              </button>

            </div>


            <div className="stock-adjust-divider" />


            <div className="stock-adjust-item-card">

              <strong>
                {item.name}
              </strong>

              <span>
                {available} available /{" "}
                {total} total
              </span>

            </div>


            <form
              onSubmit={
                handleStockAdjustment
              }
            >

              <div className="stock-adjust-mode-group">

                <button
                  type="button"
                  className={`stock-mode-button add-mode ${
                    stockAdjustment.mode ===
                    "add"
                      ? "selected"
                      : ""
                  }`}
                  onClick={() =>
                    setStockAdjustment(
                      (previous) => ({
                        ...previous,
                        mode: "add",
                      })
                    )
                  }
                >
                  + Add Stock
                </button>


                <button
                  type="button"
                  className={`stock-mode-button remove-mode ${
                    stockAdjustment.mode ===
                    "remove"
                      ? "selected"
                      : ""
                  }`}
                  onClick={() =>
                    setStockAdjustment(
                      (previous) => ({
                        ...previous,
                        mode: "remove",
                      })
                    )
                  }
                >
                  − Remove Stock
                </button>

              </div>


              <div className="stock-adjust-field">

                <label>
                  Quantity{" "}
                  <span>*</span>
                </label>

                <input
                  type="number"
                  min="1"
                  step="1"
                  value={
                    stockAdjustment.quantity
                  }
                  onChange={(event) =>
                    setStockAdjustment(
                      (previous) => ({
                        ...previous,
                        quantity:
                          event.target
                            .value,
                      })
                    )
                  }
                  required
                />

              </div>


              <div className="stock-adjust-field">

                <label>
                  Reason <span>*</span>
                </label>

                <select
                  value={
                    stockAdjustment.reason
                  }
                  onChange={(event) =>
                    setStockAdjustment(
                      (previous) => ({
                        ...previous,
                        reason:
                          event.target
                            .value,
                      })
                    )
                  }
                  required
                >

                  <option value="Purchase / Received">
                    Purchase / Received
                  </option>

                  <option value="Opening Stock">
                    Opening Stock
                  </option>

                  <option value="Correction">
                    Correction
                  </option>

                  <option value="Damage / Write-off">
                    Damage / Write-off
                  </option>

                  <option value="Loss">
                    Loss
                  </option>

                </select>

              </div>


              <div className="stock-adjust-field">

                <label>
                  Notes (optional)
                </label>

                <textarea
                  rows="4"
                  placeholder="Optional notes..."
                  value={
                    stockAdjustment.notes
                  }
                  onChange={(event) =>
                    setStockAdjustment(
                      (previous) => ({
                        ...previous,
                        notes:
                          event.target
                            .value,
                      })
                    )
                  }
                />

              </div>


              {error && (
                <div className="stock-adjust-error">
                  {error}
                </div>
              )}


              <div className="stock-adjust-actions">

                <button
                  type="button"
                  className="stock-adjust-cancel"
                  onClick={
                    closeStockAdjustModal
                  }
                  disabled={
                    adjustingStock
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="stock-adjust-submit"
                  disabled={
                    adjustingStock
                  }
                >
                  {adjustingStock
                    ? "Adjusting..."
                    : "Adjust"}
                </button>

              </div>

            </form>

          </div>

        </div>
      );
    };

  /* =====================================================
     DETAIL PAGE
  ===================================================== */

  const renderCommodityDetails =
    () => {
      if (!selectedEquipment) {
        return null;
      }

      const item =
        selectedEquipment;

      const total =
        Number(
          item.total_stock || 0
        );

      const available =
        Number(
          item.available_stock ||
            0
        );

      const issued =
        Math.max(
          total - available,
          0
        );

      const percentage =
        total > 0
          ? Math.min(
              (available /
                total) *
                100,
              100
            )
          : 0;

      const status =
        getStockStatus(item);

      const sku =
        item.sku ||
        item.code ||
        `COM-${item.id}`;

      return (
        <>
          <section className="page inventory-detail-page">

            <div className="inventory-detail-header">

              <div className="inventory-detail-breadcrumb">

                <button
                  type="button"
                  className="inventory-details-back"
                  onClick={() =>
                    setSelectedEquipment(
                      null
                    )
                  }
                >
                  ← Commodities
                </button>

                <span className="breadcrumb-separator">
                  /
                </span>

                <strong>
                  {item.name}
                </strong>

              </div>


              <div className="inventory-detail-actions">

                <button
                  type="button"
                  className="inventory-detail-stock-button"
                  onClick={() =>
                    openStockAdjustModal(
                      item
                    )
                  }
                >
                  <Boxes size={17} />
                  Adjust Stock
                </button>


                <button
                  type="button"
                  className="inventory-detail-edit-button"
                  onClick={() =>
                    openEditModal(item)
                  }
                >
                  <Pencil size={17} />
                  Edit
                </button>

              </div>

            </div>


            <div className="inventory-detail-card">

              <div className="inventory-detail-title-row">

                <div>

                  <h1>
                    {item.name}
                  </h1>

                  <p>
                    SKU: {sku}
                  </p>

                </div>


                <span
                  className={`commodity-status ${status.className}`}
                >
                  {status.text}
                </span>

              </div>


              <div className="inventory-detail-divider" />


              <div className="inventory-detail-info-grid">

                <div>
                  <span>
                    CATEGORY
                  </span>

                  <strong>
                    {getCategoryName(
                      item.category
                    )}
                  </strong>
                </div>


                <div>
                  <span>
                    DAILY RATE
                  </span>

                  <strong className="detail-green">
                    ₹
                    {Number(
                      item.daily_rent || 0
                    ).toLocaleString(
                      "en-IN"
                    )}
                    /day
                  </strong>
                </div>


                <div>
                  <span>
                    TOTAL QTY
                  </span>

                  <strong>
                    {total}
                  </strong>
                </div>


                <div>
                  <span>
                    AVAILABLE QTY
                  </span>

                  <strong>
                    {available}
                  </strong>
                </div>


                <div>
                  <span>
                    ISSUED QTY
                  </span>

                  <strong>
                    {issued}
                  </strong>
                </div>


                <div>
                  <span>
                    STATUS
                  </span>

                  <strong>
                    <span
                      className={`detail-status ${
                        item.is_active
                          ? "active"
                          : "inactive"
                      }`}
                    >
                      {item.is_active
                        ? "Active"
                        : "Inactive"}
                    </span>
                  </strong>
                </div>

              </div>


              <div className="inventory-detail-divider" />


              <div className="inventory-detail-dates">

                <div>

                  <span>
                    CREATED
                  </span>

                  <strong>
                    {item.created_at
                      ? new Date(
                          item.created_at
                        ).toLocaleDateString(
                          "en-IN"
                        )
                      : "-"}
                  </strong>

                </div>


                <div>

                  <span>
                    LAST UPDATED
                  </span>

                  <strong>
                    {item.updated_at
                      ? new Date(
                          item.updated_at
                        ).toLocaleDateString(
                          "en-IN"
                        )
                      : "-"}
                  </strong>

                </div>

              </div>

            </div>


            <div className="inventory-availability-card">

              <h2>
                Availability
              </h2>

              <div className="inventory-availability-header">

                <span>
                  Available
                </span>

                <strong>
                  {available}/{total}
                </strong>

              </div>


              <div className="inventory-availability-bar">

                <div
                  style={{
                    width:
                      `${percentage}%`,
                  }}
                />

              </div>


              <div className="inventory-availability-stat-grid">

                <div className="inventory-availability-stat">

                  <div className="availability-stat-icon">
                    <Boxes size={22} />
                  </div>

                  <div>

                    <span>
                      Total Stock
                    </span>

                    <strong>
                      {total}
                    </strong>

                  </div>

                </div>


                <div className="inventory-availability-stat">

                  <div className="availability-stat-icon">
                    <CheckCircle size={22} />
                  </div>

                  <div>

                    <span>
                      Available
                    </span>

                    <strong>
                      {available}
                    </strong>

                  </div>

                </div>


                <div className="inventory-availability-stat">

                  <div className="availability-stat-icon">
                    <IndianRupee size={22} />
                  </div>

                  <div>

                    <span>
                      Currently Issued
                    </span>

                    <strong>
                      {issued}
                    </strong>

                  </div>

                </div>

              </div>

            </div>

          </section>

          {renderStockAdjustModal()}
        </>
      );
    };

  /* =====================================================
     PAGE SWITCH
  ===================================================== */

  if (showModal) {
    return renderCommodityForm();
  }

  if (selectedEquipment) {
    return renderCommodityDetails();
  }

  /* =====================================================
     INVENTORY LIST
  ===================================================== */

  return (
    <section className="page inventory-page">

      <div className="inventory-page-header">

        <div className="inventory-title-area">

          <div className="inventory-title-icon">
            <Package size={24} />
          </div>

          <div>

            <h1>
              Commodities
            </h1>

            <p>
              {totalEquipment} commodities
            </p>

          </div>

        </div>


        <button
          type="button"
          className="inventory-add-button"
          onClick={openAddModal}
        >
          <Plus size={18} />
          New Commodity
        </button>

      </div>


      <div className="inventory-stats">

        <button
          type="button"
          className={`inventory-stat-card ${
            stockFilter === "all"
              ? "stat-selected"
              : ""
          }`}
          onClick={() =>
            setStockFilter("all")
          }
        >
          <div className="inventory-stat-icon purple">
            <Package size={21} />
          </div>

          <div>
            <span>
              All Items
            </span>

            <strong>
              {totalEquipment}
            </strong>
          </div>
        </button>


        <button
          type="button"
          className={`inventory-stat-card ${
            stockFilter === "in-stock"
              ? "stat-selected"
              : ""
          }`}
          onClick={() =>
            setStockFilter("in-stock")
          }
        >
          <div className="inventory-stat-icon green">
            <CheckCircle size={21} />
          </div>

          <div>
            <span>
              In Stock
            </span>

            <strong>
              {inStockCount}
            </strong>
          </div>
        </button>


        <button
          type="button"
          className={`inventory-stat-card ${
            stockFilter === "low-stock"
              ? "stat-selected"
              : ""
          }`}
          onClick={() =>
            setStockFilter("low-stock")
          }
        >
          <div className="inventory-stat-icon orange">
            <AlertTriangle size={21} />
          </div>

          <div>
            <span>
              Low Stock
            </span>

            <strong>
              {lowStockCount}
            </strong>
          </div>
        </button>


        <button
          type="button"
          className={`inventory-stat-card ${
            stockFilter ===
            "out-of-stock"
              ? "stat-selected"
              : ""
          }`}
          onClick={() =>
            setStockFilter(
              "out-of-stock"
            )
          }
        >
          <div className="inventory-stat-icon red">
            <Ban size={21} />
          </div>

          <div>
            <span>
              Out of Stock
            </span>

            <strong>
              {outOfStockCount}
            </strong>
          </div>
        </button>


        <button
          type="button"
          className={`inventory-stat-card ${
            stockFilter ===
            "inactive"
              ? "stat-selected"
              : ""
          }`}
          onClick={() =>
            setStockFilter(
              "inactive"
            )
          }
        >
          <div className="inventory-stat-icon gray">
            <Power size={21} />
          </div>

          <div>
            <span>
              Inactive
            </span>

            <strong>
              {inactiveCount}
            </strong>
          </div>
        </button>

      </div>


      <div className="inventory-panel">

        <div className="inventory-toolbar">

          <div className="search-box inventory-search">

            <Search size={18} />

            <input
              type="text"
              placeholder="Search name / SKU / category..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />

          </div>


          <label className="available-only-filter">

            <input
              type="checkbox"
              checked={
                availableOnly
              }
              onChange={(event) =>
                setAvailableOnly(
                  event.target.checked
                )
              }
            />

            <span>
              Available only
            </span>

          </label>

        </div>


        {error && !showModal && (

          <div className="form-error">
            {error}
          </div>

        )}


        {loading ? (

          <div className="inventory-empty-state">

            <Package size={40} />

            <h3>
              Loading commodities...
            </h3>

          </div>

        ) : filteredEquipment.length ===
          0 ? (

          <div className="inventory-empty-state">

            <Package size={40} />

            <h3>
              No commodities found
            </h3>

            <p>
              Search/filter change
              cheythu nokku,
              allenkil new commodity
              add cheyyuka.
            </p>

          </div>

        ) : (

          <div className="inventory-grid">

            {filteredEquipment.map(
              (item) => {

                const total =
                  Number(
                    item.total_stock || 0
                  );

                const available =
                  Number(
                    item.available_stock ||
                    0
                  );

                const stockPercentage =
                  total > 0
                    ? Math.min(
                        (available /
                          total) *
                          100,
                        100
                      )
                    : 0;

                const stockStatus =
                  getStockStatus(
                    item
                  );

                const rented =
                  Math.max(
                    total -
                      available,
                    0
                  );

                return (

                  <div
                    className="inventory-card"
                    key={item.id}
                    onClick={() =>
                      setSelectedEquipment(
                        item
                      )
                    }
                    role="button"
                    tabIndex={0}
                    onKeyDown={(
                      event
                    ) => {
                      if (
                        event.key ===
                          "Enter" ||
                        event.key === " "
                      ) {
                        event.preventDefault();

                        setSelectedEquipment(
                          item
                        );
                      }
                    }}
                  >

                    <div className="inventory-card-mobile-top">

                      <div className="inventory-card-title">

                        <h3>
                          {item.name}
                        </h3>

                        <span>
                          {item.sku ||
                            item.code ||
                            `COM-${item.id}`}
                        </span>

                        <small>
                          {getCategoryName(
                            item.category
                          )}
                        </small>

                      </div>


                      <span
                        className={`commodity-status ${stockStatus.className}`}
                      >
                        {stockStatus.text}
                      </span>

                    </div>


                    <div className="inventory-card-mobile-bottom">

                      <strong>
                        {available}/
                        {total} available
                      </strong>

                      <strong>
                        ₹
                        {Number(
                          item.daily_rent ||
                            0
                        ).toFixed(2)}
                        /day
                      </strong>

                    </div>

                  </div>

                );
              }
            )}

          </div>

        )}

      </div>

    </section>
  );
}

export default Inventory;