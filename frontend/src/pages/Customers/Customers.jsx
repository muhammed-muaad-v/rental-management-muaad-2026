import "./Customers.css";
import { authenticatedFetch } from "../../utils/authenticatedFetch";
import { useEffect, useMemo, useState } from "react";

import {
  Users,
  UserPlus,
  Search,
  Pencil,
  Trash2,
  UserRound,
  FileText,
  ArrowLeft,
  CalendarDays,
  IndianRupee,
  ClipboardList,
  Wallet,
  CircleDollarSign,
  Package,
  SlidersHorizontal,
  X,
} from "lucide-react";

const CUSTOMERS_API =
  "http://127.0.0.1:8000/api/customers/customers/";

const RENTALS_API =
  "http://127.0.0.1:8000/api/rentals/rentals/";

const RENTAL_ITEMS_API =
  "http://127.0.0.1:8000/api/rentals/rental-items/";

const PAYMENTS_API =
  "http://127.0.0.1:8000/api/finance/payments/";

const emptyForm = {
  name: "",
  phone: "",
  email: "",
  address: "",
  notes: "",
};

const getList = (data) => {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  return [];
};

const formatMoney = (value) => {
  return Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });
};

const formatDate = (date) => {
  if (!date) {
    return "-";
  }

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Add / Edit page
  const [showAddPage, setShowAddPage] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  const [formData, setFormData] = useState(emptyForm);
  const [reference, setReference] = useState("");
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [isActive, setIsActive] = useState(true);

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Customer details page
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const [customerRentals, setCustomerRentals] = useState([]);
  const [customerPayments, setCustomerPayments] = useState([]);
  const [customerRentalItems, setCustomerRentalItems] = useState([]);

  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");

  // =====================================================
  // FETCH CUSTOMERS
  // =====================================================

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await authenticatedFetch(CUSTOMERS_API);

      if (!response.ok) {
        throw new Error("Failed to fetch customers.");
      }

      const data = await response.json();

      setCustomers(getList(data));
    } catch (err) {
      console.error(err);
      setError("Unable to load customers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // =====================================================
  // CUSTOMER STATUS
  // =====================================================

  const isCustomerActive = (customer) => {
    return customer?.is_active !== false;
  };

  const activeCustomers = useMemo(() => {
    return customers.filter((customer) =>
      isCustomerActive(customer)
    );
  }, [customers]);

  const inactiveCustomers = useMemo(() => {
    return customers.filter(
      (customer) => !isCustomerActive(customer)
    );
  }, [customers]);

  // =====================================================
  // OPEN ADD CUSTOMER
  // =====================================================

  const openAddPage = () => {
    setEditingCustomer(null);

    setFormData({ ...emptyForm });
    setReference("");
    setIsActive(true);

    // Initially show only name and phone
    setShowMoreDetails(false);

    setError("");
    setShowAddPage(true);
  };

  // =====================================================
  // OPEN EDIT CUSTOMER
  // =====================================================

  const openEditPage = (customer) => {
    setEditingCustomer(customer);

    // Existing values are preserved when details are collapsed
    setFormData({
      name: customer?.name || "",
      phone: customer?.phone || "",
      email: customer?.email || "",
      address: customer?.address || "",
      notes: customer?.notes || "",
    });

    setReference(
      customer?.reference ||
        customer?.id_reference ||
        customer?.reference_number ||
        ""
    );

    setIsActive(customer?.is_active !== false);

    // Edit page initially shows only name and mobile number
    setShowMoreDetails(false);

    setError("");
    setShowAddPage(true);
  };

  // =====================================================
  // CLOSE ADD / EDIT PAGE
  // =====================================================

  const closeAddPage = () => {
    if (saving) {
      return;
    }

    setShowAddPage(false);
    setEditingCustomer(null);

    setFormData({ ...emptyForm });
    setReference("");
    setIsActive(true);

    setShowMoreDetails(false);
    setError("");
  };

  // =====================================================
  // FORM INPUT CHANGE
  // =====================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =====================================================
  // SAVE / UPDATE CUSTOMER
  // =====================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!formData.name.trim()) {
      setError("Full name is required.");
      return;
    }

    if (!formData.phone.trim()) {
      setError("Mobile number is required.");
      return;
    }

    const cleanPhone = formData.phone
      .trim()
      .replace(/\D/g, "");

    if (cleanPhone.length !== 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    try {
      setSaving(true);

      const isEditing = Boolean(editingCustomer);

      const url = isEditing
        ? `${CUSTOMERS_API}${editingCustomer.id}/`
        : CUSTOMERS_API;

      const method = isEditing ? "PUT" : "POST";

      const payload = {
        name: formData.name.trim(),
        phone: cleanPhone,
        email: formData.email.trim(),
        address: formData.address.trim(),
        notes: formData.notes.trim(),
      };

      if (editingCustomer) {
        payload.is_active = isActive;
      }

      const response = await authenticatedFetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorMessage =
          data?.detail ||
          data?.phone?.[0] ||
          data?.name?.[0] ||
          data?.is_active?.[0] ||
          "Unable to save customer. Please check the entered details.";

        throw new Error(errorMessage);
      }

      // Refresh customer list
      await fetchCustomers();

      // If editing from the customer details page,
      // update that page with the new information.
      if (
        isEditing &&
        selectedCustomer &&
        Number(selectedCustomer.id) ===
          Number(editingCustomer.id)
      ) {
        setSelectedCustomer((previous) => ({
          ...previous,
          ...payload,
          ...data,
        }));
      }

      // Close page after successfully saving
      setShowAddPage(false);
      setEditingCustomer(null);

      setFormData({ ...emptyForm });
      setReference("");
      setIsActive(true);

      setShowMoreDetails(false);
      setError("");
    } catch (err) {
      console.error(err);

      setError(
        err.message || "Something went wrong."
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // DELETE CUSTOMER
  // =====================================================

  const handleDelete = async (customer) => {
    const confirmed = window.confirm(
      `Delete "${customer?.name || "this customer"}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await authenticatedFetch(
        `${CUSTOMERS_API}${customer.id}/`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Unable to delete customer.");
      }

      if (
        selectedCustomer &&
        Number(selectedCustomer.id) === Number(customer.id)
      ) {
        closeCustomerDetails();
      }

      await fetchCustomers();
    } catch (err) {
      console.error(err);

      window.alert(
        err.message || "Unable to delete customer."
      );
    }
  };

  // =====================================================
  // SEARCH CUSTOMERS
  // =====================================================

  const filteredCustomers = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return customers;
    }

    return customers.filter((customer) => {
      return (
        String(customer?.name || "")
          .toLowerCase()
          .includes(keyword) ||
        String(customer?.phone || "")
          .toLowerCase()
          .includes(keyword) ||
        String(customer?.email || "")
          .toLowerCase()
          .includes(keyword) ||
        String(customer?.address || "")
          .toLowerCase()
          .includes(keyword)
      );
    });
  }, [customers, search]);

  // =====================================================
  // CUSTOMER INITIAL
  // =====================================================

  const getInitial = (name) => {
    return (
      name?.trim()?.charAt(0)?.toUpperCase() || "C"
    );
  };

  // =====================================================
  // OPEN CUSTOMER DETAILS
  // =====================================================

  const openCustomerDetails = async (customer) => {
    setSelectedCustomer(customer);
    setDetailsLoading(true);
    setDetailsError("");

    try {
      const [
        rentalsResponse,
        paymentsResponse,
        rentalItemsResponse,
      ] = await Promise.all([
        authenticatedFetch(RENTALS_API),
        authenticatedFetch(PAYMENTS_API),
        authenticatedFetch(RENTAL_ITEMS_API),
      ]);
      if (!rentalsResponse.ok) {
        throw new Error("Failed to load rentals.");
      }

      if (!paymentsResponse.ok) {
        throw new Error("Failed to load payments.");
      }

      if (!rentalItemsResponse.ok) {
        throw new Error("Failed to load rental items.");
      }

      const rentalsData = await rentalsResponse.json();
      const paymentsData = await paymentsResponse.json();
      const rentalItemsData = await rentalItemsResponse.json();

      const rentalsList = getList(rentalsData);
      const paymentsList = getList(paymentsData);
      const rentalItemsList = getList(rentalItemsData);

      const customerId = Number(customer.id);

      const matchedRentals = rentalsList.filter((rental) => {
        const rentalCustomerId =
          typeof rental.customer === "object"
            ? rental.customer?.id
            : rental.customer;

        return Number(rentalCustomerId) === customerId;
      });

      const rentalIds = new Set(
        matchedRentals.map((rental) => Number(rental.id))
      );

      const matchedPayments = paymentsList.filter((payment) => {
        const paymentCustomerId =
          typeof payment.customer === "object"
            ? payment.customer?.id
            : payment.customer;

        const paymentRentalId =
          typeof payment.rental === "object"
            ? payment.rental?.id
            : payment.rental;

        return (
          Number(paymentCustomerId) === customerId ||
          rentalIds.has(Number(paymentRentalId))
        );
      });

      const matchedItems = rentalItemsList.filter((item) => {
        const rentalId =
          typeof item.rental === "object"
            ? item.rental?.id
            : item.rental;

        return rentalIds.has(Number(rentalId));
      });

      setCustomerRentals(matchedRentals);
      setCustomerPayments(matchedPayments);
      setCustomerRentalItems(matchedItems);
    } catch (err) {
      console.error(err);

      setDetailsError(
        err.message || "Unable to load customer details."
      );

      setCustomerRentals([]);
      setCustomerPayments([]);
      setCustomerRentalItems([]);
    } finally {
      setDetailsLoading(false);
    }
  };

  // =====================================================
  // CLOSE CUSTOMER DETAILS
  // =====================================================

  const closeCustomerDetails = () => {
    setSelectedCustomer(null);

    setCustomerRentals([]);
    setCustomerPayments([]);
    setCustomerRentalItems([]);

    setDetailsError("");
  };

  // =====================================================
  // CUSTOMER FINANCIAL TOTALS
  // =====================================================

  const totalBilled = useMemo(() => {
    return customerRentals.reduce(
      (sum, rental) =>
        sum + Number(rental?.total_amount || 0),
      0
    );
  }, [customerRentals]);

  const totalReceived = useMemo(() => {
    return customerPayments.reduce(
      (sum, payment) =>
        sum + Number(payment?.amount || 0),
      0
    );
  }, [customerPayments]);

  const outstandingAmount = Math.max(
    totalBilled - totalReceived,
    0
  );

  // =====================================================
  // ADD / EDIT CUSTOMER PAGE
  // =====================================================

  if (showAddPage) {
    return (
      <div className="customer-add-page">
        <div className="customer-add-breadcrumb">
          <button
            type="button"
            className="customer-add-back"
            onClick={closeAddPage}
            disabled={saving}
            aria-label="Back to customers"
          >
            <ArrowLeft size={18} />
          </button>

          <span>Customers</span>

          <span className="customer-add-slash">
            /
          </span>

          <strong>
            {editingCustomer
              ? "Edit Customer"
              : "New Customer"}
          </strong>
        </div>

        <div className="customer-add-card">
          <div className="customer-add-header">
            <h1>
              {editingCustomer
                ? "Edit Customer"
                : "Add New Customer"}
            </h1>
          </div>

          {error && (
            <div className="customer-add-error">
              {error}
            </div>
          )}

          <form
            className="customer-add-form"
            onSubmit={handleSubmit}
          >
            {/* FULL NAME */}

            <div className="customer-add-field">
              <label htmlFor="customer-name">
                Full Name <span>*</span>
              </label>

              <input
                id="customer-name"
                type="text"
                name="name"
                placeholder="Customer's full name"
                value={formData.name}
                onChange={handleChange}
                autoFocus
                required
              />
            </div>

            {/* MOBILE NUMBER */}

            <div className="customer-add-field">
              <label htmlFor="customer-phone">
                Mobile Number <span>*</span>
              </label>

              <div className="customer-phone-input">
                <span>+91</span>

                <input
                  id="customer-phone"
                  type="tel"
                  name="phone"
                  placeholder="10-digit mobile number"
                  value={formData.phone}
                  onChange={handleChange}
                  inputMode="numeric"
                  maxLength={10}
                  required
                />
              </div>
            </div>

            {/* ADD MORE DETAILS */}

            {!showMoreDetails && (
              <button
                type="button"
                className="customer-more-details-btn"
                onClick={() => setShowMoreDetails(true)}
              >
                <SlidersHorizontal size={19} />

                <span>Add More Details</span>
              </button>
            )}

            {/* EXTRA FIELDS */}

            {showMoreDetails && (
              <div className="customer-extra-details">
                {/* EMAIL */}

                <div className="customer-add-field">
                  <label htmlFor="customer-email">
                    Email <span>(optional)</span>
                  </label>

                  <input
                    id="customer-email"
                    type="email"
                    name="email"
                    placeholder="customer@email.com"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>

                {/* ADDRESS */}

                <div className="customer-add-field">
                  <label htmlFor="customer-address">
                    Address <span>(optional)</span>
                  </label>

                  <input
                    id="customer-address"
                    type="text"
                    name="address"
                    placeholder="Customer address"
                    value={formData.address}
                    onChange={handleChange}
                  />
                </div>

                {/* ID / REFERENCE */}

                <div className="customer-add-field">
                  <label htmlFor="customer-reference">
                    ID / Reference <span>(optional)</span>
                  </label>

                  <input
                    id="customer-reference"
                    type="text"
                    placeholder="e.g. Aadhaar 1234, PAN ABC123"
                    value={reference}
                    onChange={(event) =>
                      setReference(event.target.value)
                    }
                  />
                </div>

                {/* NOTES */}

                <div className="customer-add-field">
                  <label htmlFor="customer-notes">
                    Notes <span>(optional)</span>
                  </label>

                  <textarea
                    id="customer-notes"
                    name="notes"
                    rows={4}
                    placeholder="Any notes about this customer..."
                    value={formData.notes}
                    onChange={handleChange}
                  />
                </div>

                {/* ACTIVE CUSTOMER - EDIT PAGE ONLY */}

                {editingCustomer && (
                  <div className="customer-active-field">
                    <label htmlFor="customer-active">
                      <input
                        id="customer-active"
                        type="checkbox"
                        checked={isActive}
                        onChange={(event) =>
                          setIsActive(event.target.checked)
                        }
                      />

                      <span>Active customer</span>
                    </label>
                  </div>
                )}
              </div>
            )}

            {/* FORM ACTIONS */}

            <div className="customer-add-actions">
              <button
                type="submit"
                className="customer-create-btn"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingCustomer
                  ? "Save Changes"
                  : "Create Customer"}
              </button>

              <button
                type="button"
                className="customer-cancel-btn-new"
                onClick={closeAddPage}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // =====================================================
  // CUSTOMER DETAILS PAGE
  // =====================================================

  if (selectedCustomer) {
    const active = isCustomerActive(selectedCustomer);

    return (
      <div className="customer-details-page">
        {/* HEADER */}

        <div className="customer-details-header">
          <div className="customer-detail-breadcrumb">
            <button
              type="button"
              className="customer-details-back"
              onClick={closeCustomerDetails}
            >
              <ArrowLeft size={17} />
              <span>Customers</span>
            </button>

            <span className="customer-detail-slash">
              /
            </span>

            <strong>
              {selectedCustomer.name || "Customer"}
            </strong>
          </div>

          <div className="customer-details-header-actions">
            <button
              type="button"
              className="customer-details-delete"
              onClick={() => handleDelete(selectedCustomer)}
            >
              <Trash2 size={15} />
              Delete
            </button>

            <button
              type="button"
              className="customer-details-edit"
              onClick={() => openEditPage(selectedCustomer)}
            >
              <Pencil size={15} />
              Edit
            </button>
          </div>
        </div>

        {/* CUSTOMER PROFILE */}

        <div className="customer-profile-card">
          <div className="customer-profile-main">
            <div className="customer-profile-avatar">
              {getInitial(selectedCustomer.name)}
            </div>

            <h1>{selectedCustomer.name}</h1>

            <p>
              {selectedCustomer.phone || "No phone number"}
            </p>

            <span
              className={
                active
                  ? "customer-profile-status active"
                  : "customer-profile-status inactive"
              }
            >
              {active ? "Active" : "Inactive"}
            </span>
          </div>

          <div className="customer-profile-divider" />

          <div className="customer-profile-member">
            <span>MEMBER SINCE</span>

            <strong>
              {selectedCustomer.created_at
                ? formatDate(selectedCustomer.created_at)
                : "-"}
            </strong>
          </div>
        </div>

        {/* CUSTOMER DETAILS / FINANCIALS */}

        {detailsLoading ? (
          <div className="customer-details-loading">
            <div className="customer-details-spinner" />

            <h3>Loading customer details...</h3>

            <p>Please wait.</p>
          </div>
        ) : detailsError ? (
          <div className="customer-details-error">
            <h3>Unable to load details</h3>

            <p>{detailsError}</p>
          </div>
        ) : (
          <>
            {/* FINANCIAL SUMMARY */}

            <div className="customer-details-stats">
              <div className="customer-detail-stat-card">
                <div className="customer-detail-stat-icon blue">
                  <IndianRupee size={18} />
                </div>

                <div>
                  <span>Total Billed</span>

                  <strong>
                    ₹{formatMoney(totalBilled)}
                  </strong>
                </div>
              </div>

              <div className="customer-detail-stat-card">
                <div className="customer-detail-stat-icon green">
                  <Wallet size={18} />
                </div>

                <div>
                  <span>Total Received</span>

                  <strong>
                    ₹{formatMoney(totalReceived)}
                  </strong>
                </div>
              </div>

              <div className="customer-detail-stat-card">
                <div className="customer-detail-stat-icon orange">
                  <CircleDollarSign size={18} />
                </div>

                <div>
                  <span>Outstanding</span>

                  <strong>
                    ₹{formatMoney(outstandingAmount)}
                  </strong>
                </div>
              </div>
            </div>

            {/* RENTALS */}

            <div className="customer-details-panel customer-rentals-panel">
              <div className="customer-details-panel-header">
                <div className="customer-details-panel-icon">
                  <ClipboardList size={18} />
                </div>

                <div>
                  <h2>Rentals</h2>

                  <p>Customer rental history</p>
                </div>

                <strong className="customer-details-total">
                  {customerRentals.length} total
                </strong>
              </div>

              {customerRentals.length === 0 ? (
                <div className="customer-details-empty">
                  No rentals found for this customer.
                </div>
              ) : (
                <div className="customer-rentals-list">
                  {customerRentals.map((rental) => {
                    const rentalItems =
                      customerRentalItems.filter((item) => {
                        const rentalId =
                          typeof item.rental === "object"
                            ? item.rental?.id
                            : item.rental;

                        return (
                          Number(rentalId) === Number(rental.id)
                        );
                      });

                    const rentalPayment =
                      customerPayments
                        .filter((payment) => {
                          const rentalId =
                            typeof payment.rental === "object"
                              ? payment.rental?.id
                              : payment.rental;

                          return (
                            Number(rentalId) === Number(rental.id)
                          );
                        })
                        .reduce(
                          (sum, payment) =>
                            sum + Number(payment?.amount || 0),
                          0
                        );

                    const rentalTotal = Number(
                      rental?.total_amount || 0
                    );

                    const rentalBalance = Math.max(
                      rentalTotal - rentalPayment,
                      0
                    );

                    const rentalStatus = String(
                      rental.status || "active"
                    );

                    return (
                      <div
                        className="customer-rental-card"
                        key={rental.id}
                      >
                        <div className="customer-rental-row-main">
                          <div className="customer-rental-row-title">
                            <span className="customer-rental-number">
                              Rental #{rental.id}
                            </span>

                            <h3>
                              {rental.site_name || "Rental Site"}
                            </h3>
                          </div>

                          <div className="customer-rental-row-meta">
                            <span>
                              <CalendarDays size={12} />

                              {formatDate(rental.rental_date)}
                            </span>

                            <span>
                              <Package size={12} />

                              {rentalItems.length} item
                              {rentalItems.length !== 1 ? "s" : ""}
                            </span>
                          </div>
                        </div>

                        <div className="customer-rental-row-right">
                          <span
                            className={`customer-rental-status ${rentalStatus.toLowerCase()}`}
                          >
                            {rentalStatus.charAt(0).toUpperCase() +
                              rentalStatus.slice(1)}
                          </span>

                          {rentalBalance > 0 && (
                            <span className="customer-rental-balance">
                              ₹{formatMoney(rentalBalance)} due
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* BILLS */}

            <div className="customer-details-panel">
              <div className="customer-details-panel-header">
                <div className="customer-details-panel-icon">
                  <FileText size={18} />
                </div>

                <div>
                  <h2>Bills</h2>

                  <p>Customer billing history</p>
                </div>

                <strong className="customer-details-total">
                  0 total
                </strong>
              </div>

              <div className="customer-details-empty">
                No bills yet for this customer.
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // =====================================================
  // CUSTOMERS LIST PAGE
  // =====================================================

  return (
    <div className="customers-page">
      {/* HEADER */}

      <div className="customers-header">
        <div className="customers-title-section">
          <div className="customers-title-icon">
            <Users size={25} />
          </div>

          <div>
            <h1>Customers</h1>

            <p>Manage your rental customers</p>
          </div>
        </div>

        <button
          type="button"
          className="customers-add-btn"
          onClick={openAddPage}
        >
          <UserPlus size={17} />
          <span>Add Customer</span>
        </button>
      </div>

      {/* ERROR */}

      {error && (
        <div className="customers-error">
          {error}
        </div>
      )}

      {/* CUSTOMER STATISTICS */}

      <div className="customers-stats">
        <div className="customer-stat-card">
          <div className="customer-stat-icon">
            <Users size={22} />
          </div>

          <div>
            <span>Total Customers</span>

            <strong>{customers.length}</strong>
          </div>
        </div>

        <div className="customer-stat-card">
          <div className="customer-stat-icon green">
            <UserRound size={22} />
          </div>

          <div>
            <span>Active Customers</span>

            <strong>{activeCustomers.length}</strong>
          </div>
        </div>

        <div className="customer-stat-card">
          <div className="customer-stat-icon orange">
            <UserRound size={22} />
          </div>

          <div>
            <span>Inactive Customers</span>

            <strong>{inactiveCustomers.length}</strong>
          </div>
        </div>
      </div>

      {/* SEARCH */}

      <div className="customers-toolbar">
        <div className="customers-search">
          <Search size={16} />

          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search customers..."
          />

          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <span className="customers-result-count">
          {filteredCustomers.length} customer
          {filteredCustomers.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* CUSTOMERS */}

      {loading ? (
        <div className="customers-loading">
          <div className="customers-loading-spinner" />

          <h3>Loading customers...</h3>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="customers-empty">
          <div className="customers-empty-icon">
            <Users size={25} />
          </div>

          <h3>
            {search ? "No customers found" : "No customers yet"}
          </h3>

          <p>
            {search
              ? "Try a different search."
              : "Add your first customer to get started."}
          </p>

          {!search && (
            <button
              type="button"
              className="customers-empty-btn"
              onClick={openAddPage}
            >
              <UserPlus size={15} />
              Add Customer
            </button>
          )}
        </div>
      ) : (
        <div className="customers-grid">
          {filteredCustomers.map((customer) => (
            <div
              className="customer-card"
              key={customer.id}
              onClick={() => openCustomerDetails(customer)}
            >
              <div className="customer-card-avatar">
                {getInitial(customer.name)}
              </div>

              <div className="customer-card-info">
                <h3>
                  {customer.name || "Unnamed Customer"}
                </h3>

                <p>
                  {customer.phone || "No phone number"}
                </p>
              </div>

              <span
                className={
                  isCustomerActive(customer)
                    ? "customer-card-status active"
                    : "customer-card-status inactive"
                }
              >
                {isCustomerActive(customer)
                  ? "Active"
                  : "Inactive"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Customers;