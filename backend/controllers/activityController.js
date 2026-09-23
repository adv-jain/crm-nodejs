const mongoose = require("mongoose");

const Activity = require("../models/Activity");
const User = require("../models/User");
const Lead = require("../models/Lead");
const Contact = require("../models/Contact");
const Company = require("../models/Company");
const Deal = require("../models/Deal");

// =====================================================
// HELPERS
// =====================================================

const isValidId = (id) => {
  return id && mongoose.isValidObjectId(id);
};

// =====================================================
// VALIDATE RELATION
// =====================================================

const validateRelation = async (
  Model,
  id,
  fieldName
) => {
  if (!id) {
    return null;
  }

  if (!isValidId(id)) {
    throw new Error(`Invalid ${fieldName} ID`);
  }

  const document = await Model.findById(id);

  if (!document) {
    throw new Error(`${fieldName} not found`);
  }

  return document;
};

// =====================================================
// VALIDATE ACTIVITY RELATIONS
// =====================================================

const validateActivityRelations = async ({
  lead,
  contact,
  company,
  deal
}) => {
  const [
    leadDoc,
    contactDoc,
    companyDoc,
    dealDoc
  ] = await Promise.all([
    validateRelation(
      Lead,
      lead,
      "Lead"
    ),
    validateRelation(
      Contact,
      contact,
      "Contact"
    ),
    validateRelation(
      Company,
      company,
      "Company"
    ),
    validateRelation(
      Deal,
      deal,
      "Deal"
    )
  ]);

  // ===================================================
  // Lead ↔ Contact
  // ===================================================

  if (leadDoc && contactDoc) {
    if (
      !contactDoc.lead ||
      contactDoc.lead.toString() !==
        leadDoc._id.toString()
    ) {
      throw new Error(
        "Selected contact does not belong to the selected lead"
      );
    }
  }

  // ===================================================
  // Lead ↔ Company
  // ===================================================

  if (leadDoc && companyDoc) {
    if (
      !leadDoc.company ||
      leadDoc.company.toString() !==
        companyDoc._id.toString()
    ) {
      throw new Error(
        "Selected lead does not belong to the selected company"
      );
    }
  }

  // ===================================================
  // Contact ↔ Company
  // ===================================================

  if (contactDoc && companyDoc) {
    if (
      !contactDoc.company ||
      contactDoc.company.toString() !==
        companyDoc._id.toString()
    ) {
      throw new Error(
        "Selected contact does not belong to the selected company"
      );
    }
  }

  // ===================================================
  // Deal ↔ Contact
  // ===================================================

  if (dealDoc && contactDoc) {
    if (
      !dealDoc.contact ||
      dealDoc.contact.toString() !==
        contactDoc._id.toString()
    ) {
      throw new Error(
        "Selected deal does not belong to the selected contact"
      );
    }
  }

  // ===================================================
  // Deal ↔ Lead
  // ===================================================

  if (dealDoc && leadDoc) {
    if (
      !dealDoc.lead ||
      dealDoc.lead.toString() !==
        leadDoc._id.toString()
    ) {
      throw new Error(
        "Selected deal does not belong to the selected lead"
      );
    }
  }

  // ===================================================
  // Deal ↔ Company
  // ===================================================

  if (dealDoc && companyDoc) {
    if (
      !dealDoc.company ||
      dealDoc.company.toString() !==
        companyDoc._id.toString()
    ) {
      throw new Error(
        "Selected deal does not belong to the selected company"
      );
    }
  }

  return {
    lead: leadDoc,
    contact: contactDoc,
    company: companyDoc,
    deal: dealDoc
  };
};

// =====================================================
// POPULATE ACTIVITY
// =====================================================

const populateActivity = (query) => {
  return query
    .populate(
      "createdBy",
      "name email role"
    )
    .populate(
      "lead",
      "firstName lastName email phone status assignedTo company"
    )
    .populate(
      "contact",
      "firstName lastName email phone designation owner company lead"
    )
    .populate(
      "company",
      "name industry email phone owner"
    )
    .populate(
      "deal",
      "title value stage probability owner contact lead company"
    );
};

// =====================================================
// GET ACTIVE SALES USER IDS
// =====================================================

const getActiveSalesUserIds = async () => {
  const salesUsers = await User.find({
    role: "sales",
    isActive: true
  }).select("_id");

  return salesUsers.map(
    (user) => user._id
  );
};

// =====================================================
// CHECK SALES ACCESS
// =====================================================

const canSalesAccessActivity = (
  activity,
  userId
) => {
  const currentUserId =
    userId.toString();

  // Activity created by current user
  if (
    activity.createdBy?._id?.toString() ===
    currentUserId
  ) {
    return true;
  }

  // Activity related to user's Lead
  if (
    activity.lead?.assignedTo?.toString() ===
    currentUserId
  ) {
    return true;
  }

  // Activity related to user's Contact
  if (
    activity.contact?.owner?.toString() ===
    currentUserId
  ) {
    return true;
  }

  // Activity related to user's Company
  if (
    activity.company?.owner?.toString() ===
    currentUserId
  ) {
    return true;
  }

  // Activity related to user's Deal
  if (
    activity.deal?.owner?.toString() ===
    currentUserId
  ) {
    return true;
  }

  return false;
};

// =====================================================
// CREATE ACTIVITY
// =====================================================

const createActivity = async (
  req,
  res
) => {
  try {
    const {
      type,
      title,
      description,
      activityDate,
      outcome,
      lead,
      contact,
      company,
      deal,
      notes
    } = req.body;

    // =================================================
    // BASIC VALIDATION
    // =================================================

    if (!title?.trim()) {
      return res.status(400).json({
        message:
          "Activity title is required"
      });
    }

    if (!type) {
      return res.status(400).json({
        message:
          "Activity type is required"
      });
    }

    // =================================================
    // VALIDATE RELATIONS
    // =================================================

    await validateActivityRelations({
      lead,
      contact,
      company,
      deal
    });

    // =================================================
    // CREATE ACTIVITY
    // =================================================

    const activity =
      await Activity.create({
        type,

        title:
          title.trim(),

        description:
          description || "",

        activityDate:
          activityDate || new Date(),

        outcome:
          outcome || "Completed",

        createdBy:
          req.user.id,

        lead:
          lead || null,

        contact:
          contact || null,

        company:
          company || null,

        deal:
          deal || null,

        notes:
          notes || ""
      });

    // =================================================
    // POPULATE CREATED ACTIVITY
    // =================================================

    const populatedActivity =
      await populateActivity(
        Activity.findById(
          activity._id
        )
      );

    return res.status(201).json({
      message:
        "Activity created successfully",

      activity:
        populatedActivity
    });

  } catch (error) {
    console.error(
      "Create activity error:",
      error
    );

    return res.status(400).json({
      message:
        error.message ||
        "Failed to create activity"
    });
  }
};

// =====================================================
// GET ACTIVITIES
// =====================================================

const getActivities = async (
  req,
  res
) => {
  try {
    const {
      search = "",
      type = "",
      outcome = "",
      createdBy = "",
      lead = "",
      contact = "",
      company = "",
      deal = "",

      // =================================================
      // PAGINATION
      // Default = 50
      // Maximum = 50
      // =================================================

      page = 1,
      limit = 50,

      sortBy = "activityDate",
      sortOrder = "desc"
    } = req.query;

    const filter = {};

    // =================================================
    // SEARCH
    // =================================================

    if (search.trim()) {
      filter.$or = [
        {
          title: {
            $regex:
              search.trim(),
            $options: "i"
          }
        },
        {
          description: {
            $regex:
              search.trim(),
            $options: "i"
          }
        },
        {
          notes: {
            $regex:
              search.trim(),
            $options: "i"
          }
        }
      ];
    }

    // =================================================
    // TYPE FILTER
    // =================================================

    if (type) {
      filter.type = type;
    }

    // =================================================
    // OUTCOME FILTER
    // =================================================

    if (outcome) {
      filter.outcome = outcome;
    }

    // =================================================
    // CREATED BY FILTER
    // =================================================

    if (createdBy) {
      if (!isValidId(createdBy)) {
        return res.status(400).json({
          message:
            "Invalid createdBy ID"
        });
      }

      filter.createdBy =
        createdBy;
    }

    // =================================================
    // LEAD FILTER
    // =================================================

    if (lead) {
      if (!isValidId(lead)) {
        return res.status(400).json({
          message:
            "Invalid lead ID"
        });
      }

      filter.lead =
        lead;
    }

    // =================================================
    // CONTACT FILTER
    // =================================================

    if (contact) {
      if (!isValidId(contact)) {
        return res.status(400).json({
          message:
            "Invalid contact ID"
        });
      }

      filter.contact =
        contact;
    }

    // =================================================
    // COMPANY FILTER
    // =================================================

    if (company) {
      if (!isValidId(company)) {
        return res.status(400).json({
          message:
            "Invalid company ID"
        });
      }

      filter.company =
        company;
    }

    // =================================================
    // DEAL FILTER
    // =================================================

    if (deal) {
      if (!isValidId(deal)) {
        return res.status(400).json({
          message:
            "Invalid deal ID"
        });
      }

      filter.deal =
        deal;
    }

    // =================================================
    // SALES ACCESS
    // =================================================

    if (req.user.role === "sales") {
      const userId =
        req.user.id;

      const [
        userLeads,
        userContacts,
        userCompanies,
        userDeals
      ] = await Promise.all([
        Lead.find({
          assignedTo: userId
        }).select("_id"),

        Contact.find({
          owner: userId
        }).select("_id"),

        Company.find({
          owner: userId
        }).select("_id"),

        Deal.find({
          owner: userId
        }).select("_id")
      ]);

      const leadIds =
        userLeads.map(
          (item) => item._id
        );

      const contactIds =
        userContacts.map(
          (item) => item._id
        );

      const companyIds =
        userCompanies.map(
          (item) => item._id
        );

      const dealIds =
        userDeals.map(
          (item) => item._id
        );

      filter.$and =
        filter.$and || [];

      filter.$and.push({
        $or: [
          {
            createdBy:
              userId
          },
          {
            lead: {
              $in:
                leadIds
            }
          },
          {
            contact: {
              $in:
                contactIds
            }
          },
          {
            company: {
              $in:
                companyIds
            }
          },
          {
            deal: {
              $in:
                dealIds
            }
          }
        ]
      });
    }

    // =================================================
    // MANAGER ACCESS
    // =================================================

    if (req.user.role === "manager") {
      const salesUserIds =
        await getActiveSalesUserIds();

      filter.$and =
        filter.$and || [];

      const [
        salesLeadIds,
        salesContactIds,
        salesCompanyIds,
        salesDealIds
      ] = await Promise.all([
        Lead.find({
          assignedTo: {
            $in:
              salesUserIds
          }
        }).distinct("_id"),

        Contact.find({
          owner: {
            $in:
              salesUserIds
          }
        }).distinct("_id"),

        Company.find({
          owner: {
            $in:
              salesUserIds
          }
        }).distinct("_id"),

        Deal.find({
          owner: {
            $in:
              salesUserIds
          }
        }).distinct("_id")
      ]);

      filter.$and.push({
        $or: [
          {
            createdBy: {
              $in:
                salesUserIds
            }
          },
          {
            lead: {
              $in:
                salesLeadIds
            }
          },
          {
            contact: {
              $in:
                salesContactIds
            }
          },
          {
            company: {
              $in:
                salesCompanyIds
            }
          },
          {
            deal: {
              $in:
                salesDealIds
            }
          }
        ]
      });
    }

    // =================================================
    // PAGINATION
    // =================================================

    const currentPage =
      Math.max(
        Number(page) || 1,
        1
      );

    // Maximum 50 records
    const pageLimit =
      Math.min(
        Math.max(
          Number(limit) || 50,
          1
        ),
        50
      );

    const skip =
      (currentPage - 1) *
      pageLimit;

    // =================================================
    // SORT
    // =================================================

    const allowedSortFields = [
      "createdAt",
      "updatedAt",
      "activityDate",
      "title",
      "type",
      "outcome"
    ];

    const safeSortField =
      allowedSortFields.includes(
        sortBy
      )
        ? sortBy
        : "activityDate";

    const sortDirection =
      sortOrder === "asc"
        ? 1
        : -1;

    // =================================================
    // FETCH ACTIVITIES + TOTAL
    // =================================================

    const [
      activities,
      total
    ] = await Promise.all([
      populateActivity(
        Activity.find(filter)
          .sort({
            [safeSortField]:
              sortDirection
          })
          .skip(skip)
          .limit(pageLimit)
      ),

      Activity.countDocuments(
        filter
      )
    ]);

    // =================================================
    // TOTAL PAGES
    // =================================================

    const totalPages =
      Math.ceil(
        total /
          pageLimit
      );

    // =================================================
    // PAGINATION STATUS
    // =================================================

    const hasNextPage =
      currentPage <
      totalPages;

    const hasPreviousPage =
      currentPage >
      1;

    // =================================================
    // RESPONSE
    // =================================================

    return res.status(200).json({
      message:
        "Activities fetched successfully",

      count:
        activities.length,

      total,

      page:
        currentPage,

      limit:
        pageLimit,

      totalPages,

      hasNextPage,

      hasPreviousPage,

      activities
    });

  } catch (error) {
    console.error(
      "Get activities error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to fetch activities",
      error:
        error.message
    });
  }
};

// =====================================================
// GET SINGLE ACTIVITY
// =====================================================

const getActivityById = async (
  req,
  res
) => {
  try {
    if (
      !isValidId(
        req.params.id
      )
    ) {
      return res.status(400).json({
        message:
          "Invalid activity ID"
      });
    }

    const activity =
      await populateActivity(
        Activity.findById(
          req.params.id
        )
      );

    if (!activity) {
      return res.status(404).json({
        message:
          "Activity not found"
      });
    }

    // =================================================
    // SALES ACCESS
    // =================================================

    if (
      req.user.role === "sales"
    ) {
      const allowed =
        canSalesAccessActivity(
          activity,
          req.user.id
        );

      if (!allowed) {
        return res.status(403).json({
          message:
            "Access denied"
        });
      }
    }

    // =================================================
    // MANAGER ACCESS
    // =================================================

    if (
      req.user.role === "manager"
    ) {
      const salesUserIds =
        await getActiveSalesUserIds();

      const createdById =
        activity.createdBy?._id?.toString();

      const hasAccess =
        createdById &&
        salesUserIds.some(
          (id) =>
            id.toString() ===
            createdById
        );

      if (!hasAccess) {
        return res.status(403).json({
          message:
            "Managers can only access Sales team activities"
        });
      }
    }

    return res.status(200).json({
      message:
        "Activity fetched successfully",

      activity
    });

  } catch (error) {
    console.error(
      "Get activity error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to fetch activity"
    });
  }
};

// =====================================================
// UPDATE ACTIVITY
// =====================================================

const updateActivity = async (
  req,
  res
) => {
  try {
    if (
      !isValidId(
        req.params.id
      )
    ) {
      return res.status(400).json({
        message:
          "Invalid activity ID"
      });
    }

    const activity =
      await Activity.findById(
        req.params.id
      );

    if (!activity) {
      return res.status(404).json({
        message:
          "Activity not found"
      });
    }

    // =================================================
    // SALES ACCESS
    // =================================================

    if (
      req.user.role === "sales" &&
      activity.createdBy.toString() !==
        req.user.id.toString()
    ) {
      return res.status(403).json({
        message:
          "Sales users can only update activities created by themselves"
      });
    }

    // =================================================
    // MANAGER ACCESS
    // =================================================

    if (
      req.user.role === "manager"
    ) {
      const creator =
        await User.findOne({
          _id:
            activity.createdBy,

          role:
            "sales",

          isActive:
            true
        });

      if (!creator) {
        return res.status(403).json({
          message:
            "Managers can only update Sales team activities"
        });
      }
    }

    const {
      type,
      title,
      description,
      activityDate,
      outcome,
      lead,
      contact,
      company,
      deal,
      notes
    } = req.body;

    // =================================================
    // UPDATE BASIC FIELDS
    // =================================================

    if (title !== undefined) {
      if (
        typeof title !== "string" ||
        !title.trim()
      ) {
        return res.status(400).json({
          message:
            "Activity title cannot be empty"
        });
      }

      activity.title =
        title.trim();
    }

    if (type !== undefined) {
      activity.type =
        type;
    }

    if (description !== undefined) {
      activity.description =
        description;
    }

    if (activityDate !== undefined) {
      activity.activityDate =
        activityDate;
    }

    if (outcome !== undefined) {
      activity.outcome =
        outcome;
    }

    if (notes !== undefined) {
      activity.notes =
        notes;
    }

    // =================================================
    // FINAL RELATIONS
    // =================================================

    const finalLead =
      lead !== undefined
        ? lead
        : activity.lead;

    const finalContact =
      contact !== undefined
        ? contact
        : activity.contact;

    const finalCompany =
      company !== undefined
        ? company
        : activity.company;

    const finalDeal =
      deal !== undefined
        ? deal
        : activity.deal;

    // =================================================
    // VALIDATE FINAL RELATIONS
    // =================================================

    await validateActivityRelations({
      lead:
        finalLead,

      contact:
        finalContact,

      company:
        finalCompany,

      deal:
        finalDeal
    });

    // =================================================
    // UPDATE RELATIONS
    // =================================================

    if (lead !== undefined) {
      activity.lead =
        lead || null;
    }

    if (contact !== undefined) {
      activity.contact =
        contact || null;
    }

    if (company !== undefined) {
      activity.company =
        company || null;
    }

    if (deal !== undefined) {
      activity.deal =
        deal || null;
    }

    // =================================================
    // SAVE
    // =================================================

    await activity.save();

    // =================================================
    // POPULATE UPDATED ACTIVITY
    // =================================================

    const updatedActivity =
      await populateActivity(
        Activity.findById(
          activity._id
        )
      );

    return res.status(200).json({
      message:
        "Activity updated successfully",

      activity:
        updatedActivity
    });

  } catch (error) {
    console.error(
      "Update activity error:",
      error
    );

    return res.status(400).json({
      message:
        error.message ||
        "Failed to update activity"
    });
  }
};

// =====================================================
// DELETE ACTIVITY
// =====================================================

const deleteActivity = async (
  req,
  res
) => {
  try {
    if (
      !isValidId(
        req.params.id
      )
    ) {
      return res.status(400).json({
        message:
          "Invalid activity ID"
      });
    }

    const activity =
      await Activity.findById(
        req.params.id
      );

    if (!activity) {
      return res.status(404).json({
        message:
          "Activity not found"
      });
    }

    // =================================================
    // ADMIN ONLY
    // =================================================

    if (
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        message:
          "Only admin can delete activities"
      });
    }

    await Activity.findByIdAndDelete(
      req.params.id
    );

    return res.status(200).json({
      message:
        "Activity deleted successfully"
    });

  } catch (error) {
    console.error(
      "Delete activity error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to delete activity"
    });
  }
};

// =====================================================
// ACTIVITY USERS
// =====================================================

const getActivityUsers = async (
  req,
  res
) => {
  try {
    const users =
      await User.find({
        isActive: true,

        role: {
          $in: [
            "admin",
            "manager",
            "sales"
          ]
        }
      })
        .select(
          "name email role isActive"
        )
        .sort({
          name: 1
        });

    return res.status(200).json({
      message:
        "Users fetched successfully",

      count:
        users.length,

      users
    });

  } catch (error) {
    console.error(
      "Get activity users error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to fetch users"
    });
  }
};

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  createActivity,
  getActivities,
  getActivityById,
  updateActivity,
  deleteActivity,
  getActivityUsers
};