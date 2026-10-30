import { useEffect, useMemo, useState } from "react";
import { authenticatedFetch } from "../../utils/authenticatedFetch";
import {
  ClipboardList,
  Plus,
  Search,
  X,
  Package,
  Users,
  MapPin,
  IndianRupee,
  RotateCcw,
  Eye,
  RefreshCw,
  CheckCircle2,
  Clock3,
  Ban,
  SlidersHorizontal,
  CalendarDays,
  Wallet,
  FileText,
  ArrowLeft,
  Trash2,
  Pencil,
} from "lucide-react";

import "./Rentals.css";

const RENTALS_API = "http://127.0.0.1:8000/api/rentals/rentals/";
const RENTAL_ITEMS_API = "http://127.0.0.1:8000/api/rentals/rental-items/";
const RENTAL_RETURNS_API =
  "http://127.0.0.1:8000/api/rentals/rental-returns/";
const CUSTOMERS_API = "http://127.0.0.1:8000/api/customers/customers/";
const EQUIPMENT_API = "http://127.0.0.1:8000/api/inventory/equipment/";

const getList = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
};

const formatMoney = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

const formatDate = (date) => {
  if (!date) return "-";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return date;

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getLocalDateValue = () => {
  const now = new Date();
  const local = new Date(
    now.getTime() - now.getTimezoneOffset() * 60000
  );

  return local.toISOString().slice(0, 10);
};

const getStatusLabel = (status) => {
  if (status === "completed") return "Completed";
  if (status === "cancelled") return "Cancelled";
  return "Active";
};

const getRelationId = (value) => {
  if (value && typeof value === "object") return value.id;
  return value;
};

function Rentals() {
  const [rentals, setRentals] = useState([]);
  const [rentalItems, setRentalItems] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [equipment, setEquipment] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [returning, setReturning] = useState(false);

  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [showAddPage, setShowAddPage] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);

  const [selectedRental, setSelectedRental] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [returnQuantity, setReturnQuantity] = useState("");

  const [formData, setFormData] = useState({
    customer: "",
    site_name: "",
    issue_date: getLocalDateValue(),
    advance_amount: "0",
    expected_return_date: "",
    notes: "",
  });

  const [formItems, setFormItems] = useState([
    {
      id: 1,
      equipment: "",
      quantity: "1",
      daily_rent: "",
    },
  ]);

  const [nextItemId, setNextItemId] = useState(2);

  // FETCH DATA
  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        rentalsResponse,
        itemsResponse,
        customersResponse,
        equipmentResponse,
      ] = await Promise.all([
        authenticatedFetch(RENTALS_API),
        authenticatedFetch(RENTAL_ITEMS_API),
        authenticatedFetch(CUSTOMERS_API),
        authenticatedFetch(EQUIPMENT_API),
      ]);

      const [rentalsData, itemsData, customersData, equipmentData] =
        await Promise.all([
          rentalsResponse.ok ? rentalsResponse.json() : [],
          itemsResponse.ok ? itemsResponse.json() : [],
          customersResponse.ok ? customersResponse.json() : [],
          equipmentResponse.ok ? equipmentResponse.json() : [],
        ]);

      setRentals(getList(rentalsData));
      setRentalItems(getList(itemsData));
      setCustomers(getList(customersData));
      setEquipment(getList(equipmentData));
    } catch (err) {
      console.error("Rental data error:", err);
      setError("Rental data load cheyyan kazhinjilla.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // RESET FORM
  const resetForm = () => {
    setFormData({
      customer: "",
      site_name: "",
      issue_date: getLocalDateValue(),
      advance_amount: "0",
      expected_return_date: "",
      notes: "",
    });

    setFormItems([
      {
        id: 1,
        equipment: "",
        quantity: "1",
        daily_rent: "",
      },
    ]);

    setNextItemId(2);
    setError("");
  };

  const openAddPage = () => {
    resetForm();
    setSelectedRental(null);
    setShowAddPage(true);
  };

  
  const openEditPage = () => {
    if (!selectedRental) return;

    const items = getRentalItems(selectedRental.id);

    const hasReturns = items.some(
      (item) => Number(item.returned_quantity || 0) > 0
    );

    if (selectedRental.status !== "active" || hasReturns) {
      setError("Only active rentals without returned items can be edited.");
      return;
    }

    setError("");

    setFormData({
      customer: String(
        typeof selectedRental.customer === "object"
          ? selectedRental.customer?.id
          : selectedRental.customer
      ),
      site_name: selectedRental.site_name || "",
      issue_date: selectedRental.rental_date || getLocalDateValue(),
      advance_amount: "0",
      expected_return_date: "",
      notes: selectedRental.notes || "",
    });

    setFormItems(
      items.map((item, index) => ({
        id: index + 1,
        existingId: item.id,
        equipment: String(
          typeof item.equipment === "object"
            ? item.equipment?.id
            : item.equipment
        ),
        quantity: String(item.quantity),
        daily_rent: String(item.daily_rent ?? ""),
      }))
    );

    setNextItemId(items.length + 1);
    setIsEditMode(true);
    setShowAddPage(true);
  };


  const closeAddPage = () => {
    if (saving) return;

    setShowAddPage(false);
    resetForm();
  };

  // FORM CHANGES
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleItemChange = (id, field, value) => {
    setFormItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        if (field === "equipment") {
          const selected = equipment.find(
            (equipmentItem) => String(equipmentItem.id) === String(value)
          );

          return {
            ...item,
            equipment: value,
            daily_rent: selected ? String(selected.daily_rent ?? "") : "",
          };
        }

        return {
          ...item,
          [field]: value,
        };
      })
    );
  };

  const addItem = () => {
    setFormItems((prev) => [
      ...prev,
      {
        id: nextItemId,
        equipment: "",
        quantity: "1",
        daily_rent: "",
      },
    ]);

    setNextItemId((prev) => prev + 1);
  };

  const removeItem = (id) => {
    setFormItems((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((item) => item.id !== id);
    });
  };

  const getEquipment = (id) =>
    equipment.find((item) => String(item.id) === String(id));

  // AVAILABLE STOCK
  const getSelectedQuantityForEquipment = (equipmentId) =>
    formItems.reduce((total, item) => {
      if (String(item.equipment) !== String(equipmentId)) return total;
      return total + Number(item.quantity || 0);
    }, 0);

  const getAvailableStock = (equipmentItem) => {
    if (!equipmentItem) return 0;

    const alreadySelected = getSelectedQuantityForEquipment(
      equipmentItem.id
    );

    return Number(equipmentItem.available_stock || 0) - alreadySelected;
  };

  // RENTAL ITEM HELPERS
  const getRentalItems = (rentalId) =>
    rentalItems.filter(
      (item) => Number(getRelationId(item.rental)) === Number(rentalId)
    );

  const getRentalTotalQuantity = (rentalId) =>
    getRentalItems(rentalId).reduce(
      (total, item) => total + Number(item.quantity || 0),
      0
    );

  const getRentalReturnedQuantity = (rentalId) =>
    getRentalItems(rentalId).reduce(
      (total, item) =>
        total + Number(item.returned_quantity || 0),
      0
    );

  const getRemainingQuantity = (item) =>
    Number(
      item.remaining_quantity ??
        (Number(item.quantity || 0) -
          Number(item.returned_quantity || 0))
    );

  const getRentalRemainingQuantity = (rentalId) =>
    getRentalItems(rentalId).reduce(
      (total, item) => total + Math.max(0, getRemainingQuantity(item)),
      0
    );

  // CREATE RENTAL
  const handleCreateRental = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.customer) {
      setError("Please select a customer.");
      return;
    }

    if (!formData.site_name.trim()) {
      setError("Site / Location is required.");
      return;
    }

    if (!formData.issue_date) {
      setError("Issue date is required.");
      return;
    }

    if (formItems.length === 0) {
      setError("At least one item is required.");
      return;
    }

    for (const item of formItems) {
      if (!item.equipment) {
        setError("Please select a commodity for every item.");
        return;
      }

      const quantity = Number(item.quantity);

      if (!Number.isInteger(quantity) || quantity <= 0) {
        setError("Enter a valid quantity for every item.");
        return;
      }

      const selectedEquipment = getEquipment(item.equipment);

      if (!selectedEquipment) {
        setError("Selected equipment not found.");
        return;
      }

      const totalRequested = getSelectedQuantityForEquipment(
        selectedEquipment.id
      );

      if (totalRequested > Number(selectedEquipment.available_stock || 0)) {
        setError(
          `Only ${selectedEquipment.available_stock} units of ${selectedEquipment.name} are available.`
        );
        return;
      }

      if (Number(item.daily_rent) < 0) {
        setError("Daily rate cannot be negative.");
        return;
      }
    }

    try {
      setSaving(true);

      /*
       * Existing backend payload fields from your original code:
       * customer, site_name and notes.
       *
       * Additional fields are shown in the form, but they must also
       * exist in your Django model/serializer to be stored in the DB.
       */
      const rentalPayload = {
        customer: Number(formData.customer),
        site_name: formData.site_name.trim(),
        notes: formData.notes.trim(),
      };

      const rentalResponse = await authenticatedFetch(RENTALS_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(rentalPayload),
      });

      const rentalData = await rentalResponse.json().catch(() => ({}));

      if (!rentalResponse.ok) {
        const message =
          rentalData?.detail ||
          Object.values(rentalData || {}).flat().join(" ") ||
          "Rental create failed.";

        throw new Error(message);
      }

      // CREATE ALL RENTAL ITEMS
      for (const item of formItems) {
        const selectedEquipment = getEquipment(item.equipment);

        const itemPayload = {
          rental: rentalData.id,
          equipment: Number(item.equipment),
          quantity: Number(item.quantity),
          daily_rent: Number(
            item.daily_rent || selectedEquipment?.daily_rent || 0
          ),
        };

        const itemResponse = await authenticatedFetch(RENTAL_ITEMS_API, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(itemPayload),
        });

        const itemData = await itemResponse.json().catch(() => ({}));

        if (!itemResponse.ok) {
          const message =
            itemData?.detail ||
            Object.values(itemData || {}).flat().join(" ") ||
            "Rental item create failed.";

          throw new Error(message);
        }
      }

      setShowAddPage(false);
      resetForm();
      await fetchData();
    } catch (err) {
      console.error("Create rental error:", err);
      setError(err.message || "Rental create cheyyan kazhinjilla.");
    } finally {
      setSaving(false);
    }
  };

  
const handleUpdateRental = async (e) => {
  e.preventDefault();
  console.log("UPDATE RENTAL CLICKED");
  setError("");

  if (!selectedRental) {
    setError("No rental selected for editing.");
    return;
  }

  if (!formData.customer) {
    setError("Please select a customer.");
    return;
  }

  if (!formData.site_name.trim()) {
    setError("Site / Location is required.");
    return;
  }

  if (formItems.length === 0) {
    setError("At least one item is required.");
    return;
  }

  for (const item of formItems) {
    if (!item.equipment) {
      setError("Please select a commodity for every item.");
      return;
    }

    if (!Number.isInteger(Number(item.quantity)) || Number(item.quantity) <= 0) {
      setError("Enter a valid quantity for every item.");
      return;
    }

    if (Number(item.daily_rent) < 0) {
      setError("Daily rate cannot be negative.");
      return;
    }
  }

  try {
    setSaving(true);

    const rentalResponse = await authenticatedFetch(
      `${RENTALS_API}${selectedRental.id}/`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer: Number(formData.customer),
          site_name: formData.site_name.trim(),
          notes: formData.notes.trim(),
        }),
      }
    );

    const rentalData = await rentalResponse.json().catch(() => ({}));

    if (!rentalResponse.ok) {
      throw new Error(
        rentalData?.detail ||
          Object.values(rentalData || {}).flat().join(" ") ||
          "Rental update failed."
      );
    }

    for (const item of formItems) {
      const selectedEquipment = getEquipment(item.equipment);

      const itemPayload = {
        rental: selectedRental.id,
        equipment: Number(item.equipment),
        quantity: Number(item.quantity),
        daily_rent: Number(
          item.daily_rent || selectedEquipment?.daily_rent || 0
        ),
      };

      console.log("EDIT ITEM:", item);

      const url = item.existingId
        ? `${RENTAL_ITEMS_API}${item.existingId}/`
        : RENTAL_ITEMS_API;

      const itemResponse = await authenticatedFetch(url, {
        method: item.existingId ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(itemPayload),
      });

      const itemData = await itemResponse.json().catch(() => ({}));

      if (!itemResponse.ok) {
        throw new Error(
          itemData?.detail ||
            Object.values(itemData || {}).flat().join(" ") ||
            "Rental item update failed."
        );
      }
    }

    setIsEditMode(false);
    setShowAddPage(false);
    setSelectedRental(null);
    resetForm();
    await fetchData();
  } catch (err) {
    console.error("Update rental error:", err);
    setError(err.message || "Rental update failed.");
  } finally {
    setSaving(false);
  }
};


  // FILTER
  const filteredRentals = useMemo(() => {
    const value = search.trim().toLowerCase();

    return rentals.filter((rental) => {
      const customerName = String(rental.customer_name || "").toLowerCase();
      const siteName = String(rental.site_name || "").toLowerCase();
      const rentalNumber = `RNT-${String(rental.id).padStart(3, "0")}`;

      const matchesSearch =
        !value ||
        customerName.includes(value) ||
        siteName.includes(value) ||
        rentalNumber.toLowerCase().includes(value);

      const remaining = getRentalRemainingQuantity(rental.id);
      const returned = getRentalReturnedQuantity(rental.id);

      let matchesStatus = true;

      if (statusFilter === "active") {
        matchesStatus = rental.status === "active" && remaining > 0;
      }

      if (statusFilter === "partial") {
        matchesStatus =
          rental.status === "active" && returned > 0 && remaining > 0;
      }

      if (statusFilter === "completed") {
        matchesStatus = rental.status === "completed";
      }

      if (statusFilter === "cancelled") {
        matchesStatus = rental.status === "cancelled";
      }

      return matchesSearch && matchesStatus;
    });
  }, [rentals, rentalItems, search, statusFilter]);

  // STATS
  const totalRentals = rentals.length;

  const activeCount = rentals.filter(
    (rental) =>
      rental.status === "active" &&
      getRentalRemainingQuantity(rental.id) > 0
  ).length;

  const partialCount = rentals.filter((rental) => {
    const returned = getRentalReturnedQuantity(rental.id);
    const remaining = getRentalRemainingQuantity(rental.id);

    return (
      rental.status === "active" &&
      returned > 0 &&
      remaining > 0
    );
  }).length;

  const completedCount = rentals.filter(
    (rental) => rental.status === "completed"
  ).length;

  const cancelledCount = rentals.filter(
    (rental) => rental.status === "cancelled"
  ).length;

  // RETURN EQUIPMENT
  const openReturn = (rental, item) => {
    setSelectedRental(rental);
    setSelectedItem(item);
    setReturnQuantity(String(getRemainingQuantity(item)));
    setError("");
    setShowReturnModal(true);
  };

  const closeReturn = () => {
    if (returning) return;

    setShowReturnModal(false);
    setSelectedItem(null);
    setSelectedRental(null);
    setReturnQuantity("");
    setError("");
  };

  const handleReturn = async (e) => {
    e.preventDefault();

    if (!selectedItem) return;

    const remaining = getRemainingQuantity(selectedItem);
    const quantity = Number(returnQuantity);

    if (!Number.isInteger(quantity) || quantity <= 0) {
      setError("Enter a valid return quantity.");
      return;
    }

    if (quantity > remaining) {
      setError(`Maximum return quantity is ${remaining}.`);
      return;
    }

    try {
      setReturning(true);
      setError("");

      const response = await authenticatedFetch(RENTAL_RETURNS_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rental_item: selectedItem.id,
          quantity,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message =
          data?.detail ||
          Object.values(data || {}).flat().join(" ") ||
          "Return failed.";

        throw new Error(message);
      }

      setShowReturnModal(false);
      setSelectedItem(null);
      setSelectedRental(null);
      setReturnQuantity("");
      await fetchData();
    } catch (err) {
      console.error("Return error:", err);
      setError(err.message || "Equipment return cheyyan kazhinjilla.");
    } finally {
      setReturning(false);
    }
  };

  // ISSUE RENTAL PAGE
  if (showAddPage) {
    return (
      <section className="rentals-issue-page">
        <div className="rentals-issue-breadcrumb">
          <button type="button" onClick={closeAddPage} disabled={saving}>
            <ArrowLeft size={18} />
            Rentals
          </button>
          <span>/</span>
          <strong>Issue Rental</strong>
        </div>

        
        <div className="rentals-issue-heading">
          <h1>{isEditMode ? "Edit Rental" : "Issue Rental"}</h1>
          <p>
            {isEditMode
              ? "Update the existing rental transaction"
              : "Create a new rental transaction"}
          </p>
        </div>


        {error && (
          <div className="rentals-issue-error">
            <span>{error}</span>
            <button type="button" onClick={() => setError("")}>
              <X size={17} />
            </button>
          </div>
        )}

        
          <form
            className="rentals-issue-form"
            onSubmit={isEditMode ? handleUpdateRental : handleCreateRental}
          >

          {/* RENTAL DETAILS */}
          <section className="rentals-issue-card">
            <div className="rentals-issue-card-heading">
              <h2>Rental Details</h2>
            </div>

            <div className="rentals-issue-card-body">
              <div className="rentals-issue-field">
                <label>
                  Customer <span>*</span>
                </label>

                <div className="rentals-issue-input-icon">
                  <Users size={19} />
                  <select
                    name="customer"
                    value={formData.customer}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select customer...</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="rentals-issue-field">
                <label>
                  Site / Location <span>*</span>
                </label>

                <div className="rentals-issue-input-icon">
                  <MapPin size={19} />
                  <input
                    type="text"
                    name="site_name"
                    value={formData.site_name}
                    onChange={handleChange}
                    placeholder="e.g. Calicut Building, Site B"
                    required
                  />
                </div>
              </div>

              <div className="rentals-issue-field">
                <label>
                  Issue Date <span>*</span>
                </label>

                <div className="rentals-issue-input-icon">
                  <CalendarDays size={19} />
                  <input
                    type="date"
                    name="issue_date"
                    value={formData.issue_date}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

            </div>
          </section>

          {/* ITEMS */}
          <section className="rentals-issue-card rentals-issue-items-card">
            <div className="rentals-issue-card-heading rentals-issue-items-heading">
              <h2>Items</h2>

              <button type="button" onClick={addItem}>
                <Plus size={20} />
                Add Item
              </button>
            </div>

            <div className="rentals-issue-card-body">
              {formItems.map((item, index) => {
                const selectedEquipment = getEquipment(item.equipment);

                return (
                  <div className="rentals-issue-item" key={item.id}>
                    <div className="rentals-issue-item-heading">
                      <h3>
                        <Package size={20} />
                        Item {index + 1}
                      </h3>

                      {formItems.length > 1 && (
                        <button
                          type="button"
                          className="rentals-issue-remove-item"
                          onClick={() => removeItem(item.id)}
                          aria-label={`Remove item ${index + 1}`}
                        >
                          <Trash2 size={17} />
                        </button>
                      )}
                    </div>

                    <div className="rentals-issue-field">
                      <label>
                        Commodity <span>*</span>
                      </label>

                      <select
                        value={item.equipment}
                        onChange={(e) =>
                          handleItemChange(
                            item.id,
                            "equipment",
                            e.target.value
                          )
                        }
                        required
                      >
                        <option value="">Select commodity...</option>

                        {equipment
                          .filter((equipmentItem) => {
                            if (equipmentItem.is_active === false) {
                              return false;
                            }

                            if (
                              String(equipmentItem.id) ===
                              String(item.equipment)
                            ) {
                              return true;
                            }

                            return (
                              getAvailableStock(equipmentItem) > 0
                            );
                          })
                          .map((equipmentItem) => (
                            <option
                              key={equipmentItem.id}
                              value={equipmentItem.id}
                            >
                              {equipmentItem.name} — Available:{" "}
                              {equipmentItem.available_stock}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div className="rentals-issue-field">
                      <label>
                        Quantity <span>*</span>
                      </label>

                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(
                            item.id,
                            "quantity",
                            e.target.value
                          )
                        }
                        required
                      />

                      {selectedEquipment && (
                        <small>
                          Available: {selectedEquipment.available_stock} units
                        </small>
                      )}
                    </div>

                    <div className="rentals-issue-field">
                      <label>Daily Rate (₹)</label>

                      <div className="rentals-issue-input-icon">
                        <IndianRupee size={19} />
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.daily_rent}
                          onChange={(e) =>
                            handleItemChange(
                              item.id,
                              "daily_rent",
                              e.target.value
                            )
                          }
                          placeholder={
                            selectedEquipment
                              ? String(selectedEquipment.daily_rent ?? 0)
                              : "e.g. 100"
                          }
                        />
                      </div>

                      <small>
                        Select a commodity to use its default rate
                      </small>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="rentals-issue-actions">
              <button
                type="button"
                className="rentals-issue-cancel"
                onClick={closeAddPage}
                disabled={saving}
              >
                Cancel
              </button>

              
              <button
                type="submit"
                className="rentals-issue-submit"
                disabled={saving}
              >
                {saving
                  ? isEditMode
                    ? "Updating Rental..."
                    : "Creating Rental..."
                  : isEditMode
                    ? "Update Rental"
                    : "Issue Rental"}
              </button>

            </div>
          </section>
        </form>
      </section>
    );
  }

  // =====================================================
// RENTAL DETAILS PAGE
// =====================================================

if (selectedRental && !showReturnModal) {
  const items = getRentalItems(selectedRental.id);

  const outstandingItems = items.filter(
    (item) => getRemainingQuantity(item) > 0
  );

  const canProcessReturn =
    selectedRental.status === "active" &&
    outstandingItems.length > 0;

  const handleProcessRentalReturn = () => {
    if (!canProcessReturn) return;

    openReturn(selectedRental, outstandingItems[0]);
  };

  const handleCancelRental = async () => {
    if (selectedRental.status !== "active") return;

    const confirmed = window.confirm(
      "Are you sure you want to cancel this rental?"
    );

    if (!confirmed) return;

    try {
      setError("");

      const response = await authenticatedFetch(
        `${RENTALS_API}${selectedRental.id}/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "cancelled",
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data?.detail || "Unable to cancel this rental."
        );
      }

      setSelectedRental((previous) => ({
        ...previous,
        ...data,
        status: "cancelled",
      }));

      await fetchData();
    } catch (err) {
      console.error(err);
      setError(
        err.message || "Unable to cancel this rental."
      );
    }
  };

  const handleDeleteRental = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this rental?"
    );

    if (!confirmed) return;

    try {
      setError("");

      const response = await authenticatedFetch(
        `${RENTALS_API}${selectedRental.id}/`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));

        throw new Error(
          data?.detail ||
            "Unable to delete this rental. Check whether it has related items or returns."
        );
      }

      setSelectedRental(null);
      await fetchData();
    } catch (err) {
      console.error(err);
      setError(
        err.message || "Unable to delete this rental."
      );
    }
  };

  return (
    <section className="rental-details-page">
      {/* BACK */}

      <button
        type="button"
        onClick={() => setSelectedRental(null)}
        className="rental-details-back"
      >
        <ArrowLeft size={18} />
        Back to Rentals
      </button>

      {/* RENTAL HEADER */}

      <div className="rental-details-header">
        <div className="rental-details-title">
          <h1>
            RNT-{String(selectedRental.id).padStart(3, "0")}
          </h1>

          <span
            className={`rental-status ${selectedRental.status || "active"}`}
          >
            {getStatusLabel(selectedRental.status)}
          </span>
        </div>
      </div>

      {/* ACTION BUTTONS */}

      <div className="rental-details-actions">
        <button
          type="button"
          className="rental-cancel-action"
          onClick={handleCancelRental}
          disabled={selectedRental.status !== "active"}
        >
          <Ban size={16} />
          Cancel
        </button>

        <button
          type="button"
          className="rental-delete-action"
          onClick={handleDeleteRental}
        >
          <Trash2 size={16} />
          Delete
        </button>

        
        <button
          type="button"
          className="rental-edit-action"
          onClick={openEditPage}
        >
          <Pencil size={16} />
          Edit
        </button>


        <button
          type="button"
          className="process-return-btn"
          onClick={handleProcessRentalReturn}
          disabled={!canProcessReturn}
        >
          <RotateCcw size={16} />
          Process Return
        </button>
      </div>

      {/* ACTION ERROR */}

      {error && (
        <div className="rentals-v2-error">
          {error}

          <button
            type="button"
            onClick={() => setError("")}
          >
            Close
          </button>
        </div>
      )}

      {/* RENTAL INFO */}

      <div className="rental-details-card">
        <h2>Rental Info</h2>

        <div className="rental-info-row">
          <Users size={21} className="rental-info-icon" />

          <div className="rental-info-content">
            <span>Customer</span>

            <strong>
              {selectedRental.customer_name || "Customer"}
            </strong>
          </div>
        </div>

        <div className="rental-info-row">
          <MapPin size={21} className="rental-info-icon" />

          <div className="rental-info-content">
            <span>Site / Location</span>

            <strong>
              {selectedRental.site_name || "-"}
            </strong>
          </div>
        </div>

        <div className="rental-info-row">
          <CalendarDays size={21} className="rental-info-icon" />

          <div className="rental-info-content">
            <span>Issue Date</span>

            <strong>
              {formatDate(selectedRental.rental_date)}
            </strong>
          </div>
        </div>
      </div>

      {/* OUTSTANDING ITEMS */}

      <div className="rental-details-card">
        <h2>Outstanding Items</h2>

        {outstandingItems.length === 0 ? (
          <p className="rentals-detail-empty">
            No outstanding items.
          </p>
        ) : (
          <div className="outstanding-items-list">
            {outstandingItems.map((item) => (
              <div
                className="outstanding-row"
                key={item.id}
              >
                <strong>
                  {item.equipment_name || "Equipment"}
                </strong>

                <span>
                  {getRemainingQuantity(item)} out
                </span>

                <button
                  type="button"
                  className="outstanding-return-one"
                  onClick={() =>
                    openReturn(selectedRental, item)
                  }
                >
                  <RotateCcw size={14} />
                  Return
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          className="process-return-btn process-return-full"
          onClick={handleProcessRentalReturn}
          disabled={!canProcessReturn}
        >
          <RotateCcw size={17} />
          Process Return
        </button>
      </div>

      {/* RENTAL ITEMS TABLE */}

      <div className="rental-details-card">
        <div className="rental-items-title">
          <h2>Rental Items</h2>

          <strong>
            {items.length} {items.length === 1 ? "item" : "items"}
          </strong>
        </div>

        <div className="rental-items-table">
          <div className="rental-items-head">
            <span>ITEM</span>
            <span>QTY</span>
            <span>RETURNED</span>
            <span>OUTSTANDING</span>
          </div>

          {items.map((item) => (
            <div
              className="rental-items-row"
              key={item.id}
            >
              <strong className="rental-item-name">
                <Package size={18} />
                {item.equipment_name || "Equipment"}
              </strong>

              <span>{item.quantity}</span>

              <span>{item.returned_quantity || 0}</span>

              <span className="remaining-text">
                {getRemainingQuantity(item)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* NOTES */}

      {selectedRental.notes && (
        <div className="rental-notes">
          <strong>Notes</strong>
          <p>{selectedRental.notes}</p>
        </div>
      )}
    </section>
  );
}

  // MAIN RENTALS PAGE
  return (
    <section className="rentals-v2-page">
      <div className="rentals-v2-header">
        <div className="rentals-v2-title-wrap">
          <div className="rentals-v2-title-icon">
            <ClipboardList size={24} />
          </div>

          <div>
            <h1>Rentals</h1>
            <p>{totalRentals} total rentals</p>
          </div>
        </div>

        <button className="rentals-v2-primary" onClick={openAddPage}>
          <Plus size={18} />
          Issue Rental
        </button>
      </div>

      <div className="rentals-v2-stats">
        <button
          className={`rentals-v2-stat ${
            statusFilter === "all" ? "selected" : ""
          }`}
          onClick={() => setStatusFilter("all")}
        >
          <div className="stat-icon purple">
            <ClipboardList size={19} />
          </div>
          <div>
            <span>All Rentals</span>
            <strong>{totalRentals}</strong>
          </div>
        </button>

        <button
          className={`rentals-v2-stat ${
            statusFilter === "active" ? "selected" : ""
          }`}
          onClick={() => setStatusFilter("active")}
        >
          <div className="stat-icon blue">
            <Clock3 size={19} />
          </div>
          <div>
            <span>Active</span>
            <strong>{activeCount}</strong>
          </div>
        </button>

        <button
          className={`rentals-v2-stat ${
            statusFilter === "partial" ? "selected" : ""
          }`}
          onClick={() => setStatusFilter("partial")}
        >
          <div className="stat-icon orange">
            <RotateCcw size={19} />
          </div>
          <div>
            <span>Partial Return</span>
            <strong>{partialCount}</strong>
          </div>
        </button>

        <button
          className={`rentals-v2-stat ${
            statusFilter === "completed" ? "selected" : ""
          }`}
          onClick={() => setStatusFilter("completed")}
        >
          <div className="stat-icon green">
            <CheckCircle2 size={19} />
          </div>
          <div>
            <span>Completed</span>
            <strong>{completedCount}</strong>
          </div>
        </button>

        <button
          className={`rentals-v2-stat ${
            statusFilter === "cancelled" ? "selected" : ""
          }`}
          onClick={() => setStatusFilter("cancelled")}
        >
          <div className="stat-icon red">
            <Ban size={19} />
          </div>
          <div>
            <span>Cancelled</span>
            <strong>{cancelledCount}</strong>
          </div>
        </button>
      </div>

      <div className="rentals-v2-toolbar">
        <div className="rentals-v2-search">
          <Search size={19} />
          <input
            type="text"
            placeholder="Search by customer or transaction #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <button
          className="rentals-v2-refresh"
          onClick={fetchData}
          title="Refresh"
        >
          <RefreshCw
            size={18}
            className={loading ? "rentals-spin" : ""}
          />
        </button>
      </div>

      <div className="rentals-v2-filters">
        {[
          ["all", "All"],
          ["active", "Active"],
          ["partial", "Partial Return"],
          ["completed", "Completed"],
          ["cancelled", "Cancelled"],
        ].map(([value, label]) => (
          <button
            key={value}
            className={statusFilter === value ? "active" : ""}
            onClick={() => setStatusFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rentals-v2-error">
          {error}
          <button onClick={() => setError("")}>Close</button>
        </div>
      )}

      <div className="rentals-v2-list">
        {loading ? (
          <div className="rentals-v2-empty">
            <RefreshCw size={30} className="rentals-spin" />
            <h3>Loading rentals...</h3>
          </div>
        ) : filteredRentals.length === 0 ? (
          <div className="rentals-v2-empty">
            <ClipboardList size={46} />
            <h3>No rentals found</h3>
            <p>Create your first rental to get started.</p>

            <button
              className="rentals-v2-primary"
              onClick={openAddPage}
            >
              <Plus size={17} />
              Issue Rental
            </button>
          </div>
        ) : (
          filteredRentals.map((rental) => {
            const items = getRentalItems(rental.id);
            const rented = getRentalTotalQuantity(rental.id);
            const returned = getRentalReturnedQuantity(rental.id);
            const remaining = getRentalRemainingQuantity(rental.id);

            const partial =
              rental.status === "active" &&
              returned > 0 &&
              remaining > 0;

            const hasReturnable =
              rental.status === "active" && remaining > 0;

            const rentalNumber = `RNT-${String(rental.id).padStart(
              3,
              "0"
            )}`;

            return (
              <article
                className="rental-card-v2"
                key={rental.id}
                onClick={() => setSelectedRental(rental)}
              >
                <div className="rental-card-top">
                  <div>
                    <span className="rental-number">{rentalNumber}</span>
                    <h3>{rental.customer_name || "Customer"}</h3>
                  </div>

                  <span
                    className={`rental-status ${
                      rental.status === "completed"
                        ? "completed"
                        : rental.status === "cancelled"
                        ? "cancelled"
                        : partial
                        ? "partial"
                        : "active"
                    }`}
                  >
                    {partial
                      ? "Partial Return"
                      : getStatusLabel(rental.status)}
                  </span>
                </div>

                <div className="rental-card-site">
                  <MapPin size={16} />
                  {rental.site_name || "-"}
                </div>

                <div className="rental-card-info">
                  <div>
                    <span>Issued</span>
                    <strong>{formatDate(rental.rental_date)}</strong>
                  </div>

                  <div>
                    <span>Items</span>
                    <strong>{items.length}</strong>
                  </div>

                  <div>
                    <span>Rented</span>
                    <strong>{rented}</strong>
                  </div>

                  <div>
                    <span>Remaining</span>
                    <strong
                      className={
                        remaining === 0 ? "returned-text" : "remaining-text"
                      }
                    >
                      {remaining}
                    </strong>
                  </div>
                </div>

                <div className="rental-card-bottom">
                  <div className="rental-card-amount">
                    <span>Total</span>
                    <strong>
                      <IndianRupee size={15} />
                      {formatMoney(rental.total_amount)}
                    </strong>
                  </div>

                  <div className="rental-card-actions">
                    <button
                      type="button"
                      title="View Details"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedRental(rental);
                      }}
                    >
                      <Eye size={17} />
                    </button>

                    {hasReturnable && (
                      <button
                        type="button"
                        className="return-action"
                        title="Return Equipment"
                        onClick={(e) => {
                          e.stopPropagation();

                          const item = items.find(
                            (rentalItem) => getRemainingQuantity(rentalItem) > 0
                          );

                          if (item) openReturn(rental, item);
                        }}
                      >
                        <RotateCcw size={17} />
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* RETURN MODAL */}
      {showReturnModal && selectedItem && (
        <div className="rentals-modal-overlay">
          <div className="rentals-modal">
            <div className="rentals-modal-header">
              <div>
                <h2>Return Equipment</h2>
                <p>{selectedItem.equipment_name || "Equipment"}</p>
              </div>

              <button type="button" onClick={closeReturn}>
                <X size={21} />
              </button>
            </div>

            {error && <div className="rentals-form-error">{error}</div>}

            <div className="return-summary-v2">
              <div>
                <span>Rented</span>
                <strong>{selectedItem.quantity}</strong>
              </div>
              <div>
                <span>Returned</span>
                <strong>{selectedItem.returned_quantity || 0}</strong>
              </div>
              <div>
                <span>Remaining</span>
                <strong>{getRemainingQuantity(selectedItem)}</strong>
              </div>
            </div>

            
            <form onSubmit={handleReturn}>
              <div className="rentals-form-group">
                <label>Return Quantity</label>
                <input
                  type="number"
                  min="1"
                  max={getRemainingQuantity(selectedItem)}
                  value={returnQuantity}
                  onChange={(e) => setReturnQuantity(e.target.value)}
                  required
                />
              </div>

              <div className="rentals-modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeReturn}
                  disabled={returning}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rentals-v2-primary"
                  disabled={returning}
                >
                  {returning ? "Returning..." : "Confirm Return"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

export default Rentals;