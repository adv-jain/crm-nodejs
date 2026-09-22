const mongoose = require("mongoose");

const Deal = require("../models/Deal");
const Lead = require("../models/Lead");
const User = require("../models/User");
const Customer = require("../models/Customer");
const Contact = require("../models/Contact");

const {
  createDealAssignedNotification,
  createDealWonNotification,
  createDealLostNotification,
  createCustomerCreatedNotification
} = require("../services/notificationService");

// =====================================================
// CONSTANTS
// =====================================================

const VALID_STAGES = [
  "New",
  "Qualified",
  "Proposal",
  "Negotiation",
  "Won",
  "Lost"
];

const VALID_LOST_REASONS = [
  "Price",
  "Competitor",
  "No Budget",
  "Not Interested",
  "Timing",
  "No Response",
  "Other"
];

// =====================================================
// GET ACTUAL USER ID
// =====================================================

const getActualUserId = (userId) => {
  if (!userId) {
    return null;
  }

  if (typeof userId === "string") {
    return userId;
  }

  if (
    typeof userId === "object" &&
    userId instanceof mongoose.Types.ObjectId
  ) {
    return userId;
  }

  if (
    typeof userId === "object" &&
    userId._id
  ) {
    return getActualUserId(userId._id);
  }

  if (
    typeof userId === "object" &&
    userId.$oid
  ) {
    return userId.$oid;
  }

  return null;
};

// =====================================================
// VALIDATE ASSIGNED USER
// =====================================================

const validateAssignedUser = async (userId) => {
  try {
    const actualUserId =
      getActualUserId(userId);

    if (!actualUserId) {
      return null;
    }

    const user =
      await User.findOne({
        _id: actualUserId,
        isActive: true,
        role: {
          $in: [
            "admin",
            "manager",
            "sales"
          ]
        }
      });

    return user;

  } catch (error) {
    console.error(
      "Validate assigned user error:",
      error.message
    );

    return null;
  }
};

// =====================================================
// GET ACTIVE SALES USER IDS
// =====================================================

const getSalesUserIds = async () => {
  const salesUsers =
    await User.find({
      role: "sales",
      isActive: true
    }).select("_id");

  return salesUsers.map(
    (user) => user._id
  );
};

// =====================================================
// CHECK DEAL ACCESS
// =====================================================

const canAccessDeal = async (
  deal,
  user
) => {

  // ===================================================
  // ADMIN
  // ===================================================

  if (user.role === "admin") {
    return true;
  }

  // ===================================================
  // SALES
  // ===================================================

  if (user.role === "sales") {

    if (!deal.owner) {
      return false;
    }

    const dealOwnerId =
      getActualUserId(
        deal.owner
      );

    if (!dealOwnerId) {
      return false;
    }

    return (
      dealOwnerId.toString() ===
      user.id.toString()
    );
  }

  // ===================================================
  // MANAGER
  // ===================================================

  if (user.role === "manager") {

    if (!deal.owner) {
      return false;
    }

    const ownerId =
      getActualUserId(
        deal.owner
      );

    if (!ownerId) {
      return false;
    }

    const owner =
      await User.findById(
        ownerId
      ).select(
        "role isActive"
      );

    return (
      owner &&
      owner.isActive &&
      owner.role === "sales"
    );
  }

  return false;
};

// =====================================================
// CREATE CUSTOMER FROM WON DEAL
// =====================================================

const createCustomerFromWonDeal = async (
  deal
) => {

  // ===================================================
  // CONTACT REQUIRED
  // ===================================================

  const contactId =
    getActualUserId(
      deal.contact
    );

  if (!contactId) {

    return {
      created: false,
      customer: null,
      reason:
        "No contact associated with deal"
    };
  }

  // ===================================================
  // CHECK EXISTING CUSTOMER
  // ===================================================

  const existingCustomer =
    await Customer.findOne({
      contact: contactId
    });

  if (existingCustomer) {

    return {
      created: false,
      customer: existingCustomer,
      reason:
        "Customer already exists"
    };
  }

  // ===================================================
  // OWNER REQUIRED
  // ===================================================

  const ownerId =
    getActualUserId(
      deal.owner
    );

  if (!ownerId) {

    return {
      created: false,
      customer: null,
      reason:
        "Deal has no owner"
    };
  }

  // ===================================================
  // CREATE CUSTOMER
  // ===================================================

  const customer =
    await Customer.create({
      contact: contactId,
      company: deal.company || null,
      convertedFromDeal: deal._id,
      owner: ownerId,
      customerSince:
        deal.wonAt || new Date(),
      status: "Active"
    });

  return {
    created: true,
    customer
  };
};

// =====================================================
// CREATE DEAL
// =====================================================

const createDeal = async (
  req,
  res
) => {

  try {

    const {
      title,
      value,
      stage,
      probability,
      expectedCloseDate,
      company,
      contact,
      lead,
      owner,
      description
    } = req.body;

    // =================================================
    // TITLE VALIDATION
    // =================================================

    if (
      !title ||
      !title.trim()
    ) {

      return res.status(400).json({
        message:
          "Deal title is required"
      });
    }

    // =================================================
    // VALIDATE STAGE
    // =================================================

    if (
      stage !== undefined &&
      !VALID_STAGES.includes(stage)
    ) {

      return res.status(400).json({
        message:
          "Invalid deal stage"
      });
    }

    // =================================================
    // NEW DEAL CANNOT BE WON
    // =================================================

    if (stage === "Won") {

      return res.status(400).json({
        message:
          "A new deal cannot be created directly as Won"
      });
    }

    // =================================================
    // NEW DEAL CANNOT BE LOST
    // =================================================

    if (stage === "Lost") {

      return res.status(400).json({
        message:
          "A new deal cannot be created directly as Lost"
      });
    }

    // =================================================
    // DEFAULT OWNER
    // =================================================

    let dealOwner =
      req.user.id;

    // =================================================
    // GET OWNER FROM LEAD
    // =================================================

    if (lead) {

      const selectedLead =
        await Lead.findById(
          lead
        ).lean();

      if (!selectedLead) {

        return res.status(404).json({
          message:
            "Lead not found"
        });
      }

      if (
        selectedLead.assignedTo
      ) {

        const assignedUserId =
          getActualUserId(
            selectedLead.assignedTo
          );

        if (assignedUserId) {

          const assignedUser =
            await validateAssignedUser(
              assignedUserId
            );

          if (assignedUser) {

            dealOwner =
              assignedUser._id;
          }
        }
      }
    }

    // =================================================
    // ADMIN ASSIGNMENT
    // =================================================

    if (
      owner &&
      req.user.role === "admin"
    ) {

      const assignedUser =
        await validateAssignedUser(
          owner
        );

      if (!assignedUser) {

        return res.status(400).json({
          message:
            "Assigned user not found or inactive"
        });
      }

      dealOwner =
        assignedUser._id;
    }

    // =================================================
    // MANAGER ASSIGNMENT
    // =================================================

    if (
      owner &&
      req.user.role === "manager"
    ) {

      const assignedUser =
        await validateAssignedUser(
          owner
        );

      if (!assignedUser) {

        return res.status(400).json({
          message:
            "Assigned user not found or inactive"
        });
      }

      if (
        assignedUser.role !== "sales"
      ) {

        return res.status(403).json({
          message:
            "Manager can assign deals only to Sales users"
        });
      }

      dealOwner =
        assignedUser._id;
    }

    // =================================================
    // SALES USER
    // =================================================

    if (
      req.user.role === "sales"
    ) {

      dealOwner =
        req.user.id;
    }

    // =================================================
    // CREATE DEAL
    // =================================================

    const deal =
      await Deal.create({
        title: title.trim(),
        value,
        stage,
        probability,
        expectedCloseDate,
        company,
        contact,
        lead,
        owner: dealOwner,
        description
      });

    // =================================================
    // 🔔 DEAL ASSIGNED NOTIFICATION
    // =================================================

    try {

      await createDealAssignedNotification({
        recipient: dealOwner,
        deal: deal._id,
        dealTitle: deal.title
      });

    } catch (notificationError) {

      console.error(
        "Deal Assignment Notification Error:",
        notificationError
      );
    }

    // =================================================
    // POPULATE DEAL
    // =================================================

    const populatedDeal =
      await Deal.findById(
        deal._id
      )
        .populate(
          "company",
          "name industry"
        )
        .populate(
          "contact",
          "firstName lastName email phone designation"
        )
        .populate(
          "lead",
          "firstName lastName email status assignedTo"
        )
        .populate(
          "owner",
          "name email role"
        );

    return res.status(201).json({
      message:
        "Deal created successfully",

      deal: populatedDeal
    });

  } catch (error) {

    console.error(
      "Create deal error:",
      error
    );

    return res.status(500).json({
      message:
        "Server error",

      error:
        error.message
    });
  }
};

// =====================================================
// GET ALL DEALS
// =====================================================

const getDeals = async (
  req,
  res
) => {

  try {

    const {
      search,
      stage,
      company,
      owner
    } = req.query;

    let filter = {};

    // =================================================
    // ROLE BASED FILTER
    // =================================================

    if (
      req.user.role === "admin"
    ) {

      // Admin can see all deals
    }

    else if (
      req.user.role === "sales"
    ) {

      filter.owner =
        req.user.id;
    }

    else if (
      req.user.role === "manager"
    ) {

      const salesUserIds =
        await getSalesUserIds();

      filter.owner = {
        $in: salesUserIds
      };
    }

    else {

      return res.status(403).json({
        message:
          "Access denied"
      });
    }

    // =================================================
    // SEARCH
    // =================================================

    if (search) {

      filter.$or = [
        {
          title: {
            $regex: search,
            $options: "i"
          }
        },
        {
          description: {
            $regex: search,
            $options: "i"
          }
        }
      ];
    }

    // =================================================
    // STAGE FILTER
    // =================================================

    if (stage) {

      if (
        !VALID_STAGES.includes(stage)
      ) {

        return res.status(400).json({
          message:
            "Invalid deal stage"
        });
      }

      filter.stage =
        stage;
    }

    // =================================================
    // COMPANY FILTER
    // =================================================

    if (company) {

      filter.company =
        company;
    }

    // =================================================
    // OWNER FILTER
    // =================================================

    if (owner) {

      if (
        req.user.role === "sales"
      ) {

        if (
          owner.toString() !==
          req.user.id.toString()
        ) {

          return res.status(403).json({
            message:
              "You can only view your own deals"
          });
        }
      }

      if (
        req.user.role === "manager"
      ) {

        const ownerUser =
          await User.findOne({
            _id: owner,
            role: "sales",
            isActive: true
          });

        if (!ownerUser) {

          return res.status(403).json({
            message:
              "Manager can only view Sales users' deals"
          });
        }
      }

      filter.owner =
        owner;
    }

    // =================================================
    // FETCH DEALS
    // =================================================

    const deals =
      await Deal.find(
        filter
      )
        .populate(
          "company",
          "name industry"
        )
        .populate(
          "contact",
          "firstName lastName email phone designation"
        )
        .populate(
          "lead",
          "firstName lastName email status"
        )
        .populate(
          "owner",
          "name email role"
        )
        .sort({
          createdAt: -1
        });

    return res.status(200).json({
      message:
        "Deals fetched successfully",

      count:
        deals.length,

      deals
    });

  } catch (error) {

    console.error(
      "Get deals error:",
      error
    );

    return res.status(500).json({
      message:
        "Server error",

      error:
        error.message
    });
  }
};

// =====================================================
// GET SINGLE DEAL
// =====================================================

const getDealById = async (
  req,
  res
) => {

  try {

    if (
      !mongoose.isValidObjectId(
        req.params.id
      )
    ) {

      return res.status(400).json({
        message:
          "Invalid deal ID"
      });
    }

    const deal =
      await Deal.findById(
        req.params.id
      );

    if (!deal) {

      return res.status(404).json({
        message:
          "Deal not found"
      });
    }

    // =================================================
    // ACCESS CHECK
    // =================================================

    const hasAccess =
      await canAccessDeal(
        deal,
        req.user
      );

    if (!hasAccess) {

      return res.status(403).json({
        message:
          "You do not have permission to view this deal"
      });
    }

    // =================================================
    // POPULATE
    // =================================================

    const populatedDeal =
      await Deal.findById(
        deal._id
      )
        .populate(
          "company",
          "name industry"
        )
        .populate(
          "contact",
          "firstName lastName email phone designation"
        )
        .populate(
          "lead",
          "firstName lastName email status assignedTo"
        )
        .populate(
          "owner",
          "name email role"
        );

    return res.status(200).json({
      message:
        "Deal fetched successfully",

      deal:
        populatedDeal
    });

  } catch (error) {

    console.error(
      "Get deal error:",
      error
    );

    return res.status(500).json({
      message:
        "Server error",

      error:
        error.message
    });
  }
};

// =====================================================
// UPDATE DEAL
// =====================================================

const updateDeal = async (
  req,
  res
) => {

  try {

    if (
      !mongoose.isValidObjectId(
        req.params.id
      )
    ) {

      return res.status(400).json({
        message:
          "Invalid deal ID"
      });
    }

    const deal =
      await Deal.findById(
        req.params.id
      );

    if (!deal) {

      return res.status(404).json({
        message:
          "Deal not found"
      });
    }

    // =================================================
    // ACCESS CHECK
    // =================================================

    const hasAccess =
      await canAccessDeal(
        deal,
        req.user
      );

    if (!hasAccess) {

      return res.status(403).json({
        message:
          "You do not have permission to update this deal"
      });
    }

    // =================================================
    // STORE PREVIOUS VALUES
    // =================================================

    const previousStage =
      deal.stage;

    const previousOwner =
      getActualUserId(
        deal.owner
      );

    // =================================================
    // REQUEST DATA
    // =================================================

    const {
      title,
      value,
      stage,
      probability,
      expectedCloseDate,
      company,
      contact,
      lead,
      owner,
      description,
      lostReason
    } = req.body;

    // =================================================
    // NORMAL FIELDS
    // =================================================

    if (
      title !== undefined
    ) {

      if (
        !title ||
        !title.trim()
      ) {

        return res.status(400).json({
          message:
            "Deal title is required"
        });
      }

      deal.title =
        title.trim();
    }

    if (
      value !== undefined
    ) {

      deal.value =
        value;
    }

    if (
      expectedCloseDate !== undefined
    ) {

      deal.expectedCloseDate =
        expectedCloseDate;
    }

    if (
      company !== undefined
    ) {

      deal.company =
        company;
    }

    if (
      contact !== undefined
    ) {

      deal.contact =
        contact;
    }

    if (
      lead !== undefined
    ) {

      deal.lead =
        lead;
    }

    if (
      description !== undefined
    ) {

      deal.description =
        description;
    }

    // =================================================
    // STAGE WORKFLOW
    // =================================================

    if (
      stage !== undefined
    ) {

      // -------------------------------------------------
      // VALIDATE STAGE
      // -------------------------------------------------

      if (
        !VALID_STAGES.includes(
          stage
        )
      ) {

        return res.status(400).json({
          message:
            "Invalid deal stage"
        });
      }

      // -------------------------------------------------
      // LOST
      // -------------------------------------------------

      if (
        stage === "Lost"
      ) {

        if (!lostReason) {

          return res.status(400).json({
            message:
              "Lost reason is required when marking a deal as Lost"
          });
        }

        if (
          !VALID_LOST_REASONS.includes(
            lostReason
          )
        ) {

          return res.status(400).json({
            message:
              "Invalid lost reason"
          });
        }

        deal.stage =
          "Lost";

        deal.lostReason =
          lostReason;

        deal.lostAt =
          new Date();

        deal.wonAt =
          null;

        deal.probability =
          0;
      }

      // -------------------------------------------------
      // WON
      // -------------------------------------------------

      else if (
        stage === "Won"
      ) {

        if (!deal.contact) {

          return res.status(400).json({
            message:
              "A contact is required before marking the deal as Won"
          });
        }

        deal.stage =
          "Won";

        deal.wonAt =
          new Date();

        deal.lostAt =
          null;

        deal.lostReason =
          null;

        deal.probability =
          100;
      }

      // -------------------------------------------------
      // NORMAL STAGE
      // -------------------------------------------------

      else {

        deal.stage =
          stage;

        deal.wonAt =
          null;

        deal.lostAt =
          null;

        deal.lostReason =
          null;
      }
    }

    // =================================================
    // NORMAL PROBABILITY UPDATE
    // =================================================

    if (
      probability !== undefined &&
      stage !== "Won" &&
      stage !== "Lost"
    ) {

      const numericProbability =
        Number(probability);

      if (
        Number.isNaN(
          numericProbability
        ) ||
        numericProbability < 0 ||
        numericProbability > 100
      ) {

        return res.status(400).json({
          message:
            "Probability must be between 0 and 100"
        });
      }

      deal.probability =
        numericProbability;
    }

    // =================================================
    // UPDATE LOST REASON
    // =================================================

    if (
      lostReason !== undefined &&
      deal.stage === "Lost" &&
      stage === undefined
    ) {

      if (
        !VALID_LOST_REASONS.includes(
          lostReason
        )
      ) {

        return res.status(400).json({
          message:
            "Invalid lost reason"
        });
      }

      deal.lostReason =
        lostReason;

      if (!deal.lostAt) {

        deal.lostAt =
          new Date();
      }
    }

    // =================================================
    // OWNER UPDATE
    // =================================================

    if (
      owner !== undefined
    ) {

      // -------------------------------------------------
      // SALES CANNOT CHANGE OWNER
      // -------------------------------------------------

      if (
        req.user.role === "sales"
      ) {

        return res.status(403).json({
          message:
            "Sales users cannot change deal owner"
        });
      }

      // -------------------------------------------------
      // VALIDATE USER
      // -------------------------------------------------

      const assignedUser =
        await validateAssignedUser(
          owner
        );

      if (!assignedUser) {

        return res.status(400).json({
          message:
            "Assigned user not found or inactive"
        });
      }

      // -------------------------------------------------
      // MANAGER → SALES ONLY
      // -------------------------------------------------

      if (
        req.user.role === "manager" &&
        assignedUser.role !== "sales"
      ) {

        return res.status(403).json({
          message:
            "Manager can assign deals only to Sales users"
        });
      }

      deal.owner =
        assignedUser._id;
    }

    // =================================================
    // SAVE DEAL
    // =================================================

    await deal.save();

    // =================================================
    // GET NEW OWNER
    // =================================================

    const newOwner =
      getActualUserId(
        deal.owner
      );

    // =================================================
    // 🔔 DEAL REASSIGNMENT NOTIFICATION
    // =================================================

    const ownerChanged =
      previousOwner &&
      newOwner &&
      previousOwner.toString() !==
        newOwner.toString();

    if (ownerChanged) {

      try {

        await createDealAssignedNotification({
          recipient: newOwner,
          deal: deal._id,
          dealTitle: deal.title
        });

      } catch (notificationError) {

        console.error(
          "Deal Reassignment Notification Error:",
          notificationError
        );
      }
    }

    // =================================================
    // WON DEAL → CUSTOMER
    // =================================================

    let customer =
      null;

    let customerCreated =
      false;

    if (
      stage === "Won" &&
      previousStage !== "Won"
    ) {

      const customerResult =
        await createCustomerFromWonDeal(
          deal
        );

      customer =
        customerResult.customer;

      customerCreated =
        customerResult.created;
    }

    // =================================================
    // 🔔 DEAL WON NOTIFICATION
    // =================================================

    if (
      stage === "Won" &&
      previousStage !== "Won"
    ) {

      try {

        const dealOwnerId =
          getActualUserId(
            deal.owner
          );

        if (dealOwnerId) {

          await createDealWonNotification({
            recipient: dealOwnerId,
            deal: deal._id,
            dealTitle: deal.title
          });
        }

      } catch (notificationError) {

        console.error(
          "Deal Won Notification Error:",
          notificationError
        );
      }
    }

    // =================================================
    // 🔔 DEAL LOST NOTIFICATION
    // =================================================

    if (
      stage === "Lost" &&
      previousStage !== "Lost"
    ) {

      try {

        const dealOwnerId =
          getActualUserId(
            deal.owner
          );

        if (dealOwnerId) {

          await createDealLostNotification({
            recipient: dealOwnerId,
            deal: deal._id,
            dealTitle: deal.title,
            lostReason: deal.lostReason
          });
        }

      } catch (notificationError) {

        console.error(
          "Deal Lost Notification Error:",
          notificationError
        );
      }
    }

    // =================================================
    // POPULATE CUSTOMER
    // =================================================

    if (customer) {

      customer =
        await Customer.findById(
          customer._id
        )
          .populate(
            "contact",
            "firstName lastName email phone designation"
          )
          .populate(
            "company",
            "name industry"
          )
          .populate(
            "convertedFromDeal",
            "title value stage"
          )
          .populate(
            "owner",
            "name email role"
          );
    }

    // =================================================
    // 🔔 CUSTOMER CREATED NOTIFICATION
    // =================================================

    if (
      customerCreated &&
      customer
    ) {

      try {

        const customerOwnerId =
          getActualUserId(
            customer.owner
          );

        if (customerOwnerId) {

          let customerName =
            "New Customer";

          if (
            customer.contact
          ) {

            const firstName =
              customer.contact.firstName ||
              "";

            const lastName =
              customer.contact.lastName ||
              "";

            customerName =
              `${firstName} ${lastName}`.trim() ||
              "New Customer";
          }

          await createCustomerCreatedNotification({
            recipient: customerOwnerId,
            customer: customer._id,
            customerName
          });
        }

      } catch (notificationError) {

        console.error(
          "Customer Creation Notification Error:",
          notificationError
        );
      }
    }

    // =================================================
    // GET UPDATED DEAL
    // =================================================

    const updatedDeal =
      await Deal.findById(
        deal._id
      )
        .populate(
          "company",
          "name industry"
        )
        .populate(
          "contact",
          "firstName lastName email phone designation"
        )
        .populate(
          "lead",
          "firstName lastName email status assignedTo"
        )
        .populate(
          "owner",
          "name email role"
        );

    // =================================================
    // RESPONSE MESSAGE
    // =================================================

    let message =
      "Deal updated successfully";

    if (
      stage === "Won" &&
      customerCreated
    ) {

      message =
        "Deal marked as Won and Customer created successfully";

    } else if (
      stage === "Won" &&
      customer &&
      !customerCreated
    ) {

      message =
        "Deal marked as Won. Customer already exists";
    }

    // =================================================
    // RESPONSE
    // =================================================

    return res.status(200).json({

      message,

      deal:
        updatedDeal,

      customer
    });

  } catch (error) {

    console.error(
      "Update deal error:",
      error
    );

    return res.status(500).json({
      message:
        "Server error",

      error:
        error.message
    });
  }
};

// =====================================================
// DELETE DEAL
// =====================================================

const deleteDeal = async (
  req,
  res
) => {

  try {

    // =================================================
    // ADMIN ONLY
    // =================================================

    if (
      req.user.role !== "admin"
    ) {

      return res.status(403).json({
        message:
          "Only admin can delete deals"
      });
    }

    if (
      !mongoose.isValidObjectId(
        req.params.id
      )
    ) {

      return res.status(400).json({
        message:
          "Invalid deal ID"
      });
    }

    const deal =
      await Deal.findByIdAndDelete(
        req.params.id
      );

    if (!deal) {

      return res.status(404).json({
        message:
          "Deal not found"
      });
    }

    return res.status(200).json({
      message:
        "Deal deleted successfully"
    });

  } catch (error) {

    console.error(
      "Delete deal error:",
      error
    );

    return res.status(500).json({
      message:
        "Server error",

      error:
        error.message
    });
  }
};

// =====================================================
// GET ASSIGNABLE USERS
// =====================================================

const getAssignableUsers = async (
  req,
  res
) => {

  try {

    let filter = {
      isActive: true
    };

    // =================================================
    // ADMIN
    // =================================================

    if (
      req.user.role === "admin"
    ) {

      filter.role = {
        $in: [
          "admin",
          "manager",
          "sales"
        ]
      };
    }

    // =================================================
    // MANAGER
    // =================================================

    else if (
      req.user.role === "manager"
    ) {

      filter.role =
        "sales";
    }

    // =================================================
    // SALES
    // =================================================

    else {

      return res.status(403).json({
        message:
          "Sales users cannot access assignable users"
      });
    }

    // =================================================
    // FETCH USERS
    // =================================================

    const users =
      await User.find(
        filter
      )
        .select(
          "name email role isActive"
        )
        .sort({
          name: 1
        });

    return res.status(200).json({
      message:
        "Assignable users fetched successfully",

      count:
        users.length,

      users
    });

  } catch (error) {

    console.error(
      "Get assignable users error:",
      error
    );

    return res.status(500).json({
      message:
        "Server error",

      error:
        error.message
    });
  }
};

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  createDeal,
  getDeals,
  getDealById,
  updateDeal,
  deleteDeal,
  getAssignableUsers
};