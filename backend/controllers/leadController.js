const mongoose = require("mongoose");

const Lead = require("../models/Lead");
const Company = require("../models/Company");
const User = require("../models/User");
const Contact = require("../models/Contact");

// =====================================================
// NOTIFICATION SERVICE
// =====================================================

const {
  createLeadAssignedNotification,
  createNotification
} = require("../services/notificationService");

// =====================================================
// CREATE LEAD
// =====================================================

const createLead = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      source,
      status,
      value,
      priority,
      company,
      assignedTo,
      notes
    } = req.body;

    // =================================================
    // VALIDATION
    // =================================================

    if (!firstName || !email) {
      return res.status(400).json({
        message: "First name and email are required"
      });
    }

    let finalAssignedTo = req.user.id;

    // =================================================
    // ADMIN / MANAGER ASSIGNMENT
    // =================================================

    if (
      req.user.role === "admin" ||
      req.user.role === "manager"
    ) {
      if (assignedTo) {
        // Validate ObjectId before database query
        if (!mongoose.Types.ObjectId.isValid(assignedTo)) {
          return res.status(400).json({
            message: "Invalid assigned user ID"
          });
        }

        const assignedUser = await User.findOne({
          _id: assignedTo,
          isActive: true
        });

        if (!assignedUser) {
          return res.status(400).json({
            message: "Assigned user not found or inactive"
          });
        }

        // Manager can assign only Sales
        if (
          req.user.role === "manager" &&
          assignedUser.role !== "sales"
        ) {
          return res.status(403).json({
            message:
              "Manager can assign leads only to Sales users"
          });
        }

        finalAssignedTo = assignedUser._id;
      }
    }

    // =================================================
    // SALES
    // =================================================

    if (req.user.role === "sales") {
      finalAssignedTo = req.user.id;
    }

    // =================================================
    // COMPANY VALIDATION
    // =================================================

    if (company) {
      // Check valid MongoDB ObjectId
      if (!mongoose.Types.ObjectId.isValid(company)) {
        return res.status(400).json({
          message: "Invalid company ID"
        });
      }

      // Check company exists
      const companyExists = await Company.findById(company);

      if (!companyExists) {
        return res.status(404).json({
          message: "Company not found"
        });
      }
    }

    // =================================================
    // CREATE LEAD
    // =================================================

    const lead = await Lead.create({
      firstName,
      lastName,
      email,
      phone,
      source,
      status,
      value,
      priority,
      company,
      assignedTo: finalAssignedTo,
      notes,
      isConverted: false
    });

    // =================================================
    // NOTIFICATION
    // =================================================
    // Lead create hone ke baad assigned user ko
    // notification milegi.
    //
    // Example:
    // Admin → Lead create → Sales assigned
    // Sales → 🔔 New Lead Assigned
    // =================================================

    if (lead.assignedTo) {
      await createLeadAssignedNotification({
        recipient: lead.assignedTo,
        lead: lead._id,
        leadName:
          `${lead.firstName} ${lead.lastName || ""}`.trim()
      });
    }

    // =================================================
    // POPULATE RESPONSE
    // =================================================

    const populatedLead = await Lead.findById(lead._id)
      .populate("company", "name industry")
      .populate("assignedTo", "name email role");

    // =================================================
    // RESPONSE
    // =================================================

    return res.status(201).json({
      message: "Lead created successfully",
      lead: populatedLead
    });
  } catch (error) {
    console.error("Create Lead Error:", error);

    return res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};

// =====================================================
// GET LEADS
// =====================================================

const getLeads = async (req, res) => {
  try {
    const {
      status,
      source,
      priority,
      search
    } = req.query;

    // =================================================
    // IMPORTANT
    // Converted leads DB mein rahenge,
    // lekin Leads list mein nahi dikhenge.
    // =================================================

    let filter = {
      isConverted: {
        $ne: true
      }
    };

    // =================================================
    // ADMIN
    // =================================================

    if (req.user.role === "admin") {
      // Admin can see all non-converted leads
    }

    // =================================================
    // MANAGER
    // =================================================

    else if (req.user.role === "manager") {
      const salesUsers = await User.find({
        role: "sales",
        isActive: true
      }).select("_id");

      const salesUserIds = salesUsers.map(
        (user) => user._id
      );

      filter.assignedTo = {
        $in: salesUserIds
      };
    }

    // =================================================
    // SALES
    // =================================================

    else if (req.user.role === "sales") {
      filter.assignedTo = req.user.id;
    }

    // =================================================
    // STATUS FILTER
    // =================================================

    if (status) {
      filter.status = status;
    }

    // =================================================
    // SOURCE FILTER
    // =================================================

    if (source) {
      filter.source = source;
    }

    // =================================================
    // PRIORITY FILTER
    // =================================================

    if (priority) {
      filter.priority = priority;
    }

    // =================================================
    // SEARCH FILTER
    // =================================================

    if (search) {
      filter.$or = [
        {
          firstName: {
            $regex: search,
            $options: "i"
          }
        },
        {
          lastName: {
            $regex: search,
            $options: "i"
          }
        },
        {
          email: {
            $regex: search,
            $options: "i"
          }
        },
        {
          phone: {
            $regex: search,
            $options: "i"
          }
        }
      ];
    }

    // =================================================
    // FETCH LEADS
    // =================================================

    const leads = await Lead.find(filter)
      .populate(
        "company",
        "name industry"
      )
      .populate(
        "assignedTo",
        "name email role"
      )
      .populate(
        "convertedContact",
        "firstName lastName email phone"
      );

    return res.status(200).json({
      message: "Leads fetched successfully",
      count: leads.length,
      leads
    });
  } catch (error) {
    console.error("Get Leads Error:", error);

    return res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};

// =====================================================
// UPDATE LEAD
// =====================================================

const updateLead = async (req, res) => {
  try {
    const lead = await Lead.findById(
      req.params.id
    );

    if (!lead) {
      return res.status(404).json({
        message: "Lead not found"
      });
    }

    // =================================================
    // CONVERTED LEAD
    // =================================================

    if (lead.isConverted) {
      return res.status(400).json({
        message:
          "Converted leads cannot be updated from Leads"
      });
    }

    // =================================================
    // STORE PREVIOUS ASSIGNED USER
    // =================================================

    const previousAssignedTo =
      lead.assignedTo?._id ||
      lead.assignedTo ||
      null;

    // =================================================
    // SALES ACCESS
    // =================================================

    if (
      req.user.role === "sales" &&
      String(lead.assignedTo) !== String(req.user.id)
    ) {
      return res.status(403).json({
        message:
          "You can update only your assigned leads"
      });
    }

    // =================================================
    // MANAGER ACCESS
    // =================================================

    if (req.user.role === "manager") {
      const assignedUser = await User.findById(
        lead.assignedTo
      );

      if (
        !assignedUser ||
        assignedUser.role !== "sales"
      ) {
        return res.status(403).json({
          message:
            "Manager can update only Sales leads"
        });
      }
    }

    // =================================================
    // SALES CANNOT CHANGE ASSIGNMENT
    // =================================================

    if (req.user.role === "sales") {
      delete req.body.assignedTo;
    }

    // =================================================
    // MANAGER ASSIGNMENT
    // =================================================

    if (
      req.user.role === "manager" &&
      req.body.assignedTo
    ) {
      // Validate ObjectId
      if (
        !mongoose.Types.ObjectId.isValid(
          req.body.assignedTo
        )
      ) {
        return res.status(400).json({
          message: "Invalid assigned user ID"
        });
      }

      const assignedUser = await User.findOne({
        _id: req.body.assignedTo,
        role: "sales",
        isActive: true
      });

      if (!assignedUser) {
        return res.status(400).json({
          message:
            "Lead can only be assigned to an active Sales user"
        });
      }
    }

    // =================================================
    // ADMIN ASSIGNMENT
    // =================================================

    if (
      req.user.role === "admin" &&
      req.body.assignedTo
    ) {
      // Validate ObjectId
      if (
        !mongoose.Types.ObjectId.isValid(
          req.body.assignedTo
        )
      ) {
        return res.status(400).json({
          message: "Invalid assigned user ID"
        });
      }

      const assignedUser = await User.findOne({
        _id: req.body.assignedTo,
        isActive: true
      });

      if (!assignedUser) {
        return res.status(400).json({
          message:
            "Assigned user not found or inactive"
        });
      }
    }

    // =================================================
    // COMPANY VALIDATION DURING UPDATE
    // =================================================

    if (req.body.company) {
      if (
        !mongoose.Types.ObjectId.isValid(
          req.body.company
        )
      ) {
        return res.status(400).json({
          message: "Invalid company ID"
        });
      }

      const companyExists = await Company.findById(
        req.body.company
      );

      if (!companyExists) {
        return res.status(404).json({
          message: "Company not found"
        });
      }
    }

    // =================================================
    // PROTECT CONVERSION FIELDS
    // =================================================

    delete req.body.isConverted;
    delete req.body.convertedAt;
    delete req.body.convertedContact;

    // =================================================
    // UPDATE
    // =================================================

    Object.assign(
      lead,
      req.body
    );

    const updatedLead = await lead.save();

    // =================================================
    // CHECK REASSIGNMENT
    // =================================================

    const newAssignedTo =
      updatedLead.assignedTo?._id ||
      updatedLead.assignedTo ||
      null;

    const assignmentChanged =
      previousAssignedTo &&
      newAssignedTo &&
      String(previousAssignedTo) !==
        String(newAssignedTo);

    // =================================================
    // REASSIGNMENT NOTIFICATION
    // =================================================

    if (assignmentChanged) {
      await createLeadAssignedNotification({
        recipient: newAssignedTo,
        lead: updatedLead._id,
        leadName:
          `${updatedLead.firstName} ${
            updatedLead.lastName || ""
          }`.trim()
      });
    }

    // =================================================
    // POPULATE RESPONSE
    // =================================================

    const populatedLead = await Lead.findById(
      updatedLead._id
    )
      .populate(
        "company",
        "name industry"
      )
      .populate(
        "assignedTo",
        "name email role"
      )
      .populate(
        "convertedContact",
        "firstName lastName email phone"
      );

    // =================================================
    // RESPONSE
    // =================================================

    return res.status(200).json({
      message: "Lead updated successfully",
      lead: populatedLead
    });
  } catch (error) {
    console.error("Update Lead Error:", error);

    return res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};

// =====================================================
// DELETE LEAD
// =====================================================

const deleteLead = async (req, res) => {
  try {
    // Validate Lead ID first
    if (
      !mongoose.Types.ObjectId.isValid(
        req.params.id
      )
    ) {
      return res.status(400).json({
        message: "Invalid lead ID"
      });
    }

    const lead = await Lead.findById(
      req.params.id
    );

    if (!lead) {
      return res.status(404).json({
        message: "Lead not found"
      });
    }

    // =================================================
    // SALES CANNOT DELETE
    // =================================================

    if (req.user.role === "sales") {
      return res.status(403).json({
        message:
          "Sales users cannot delete leads"
      });
    }

    // =================================================
    // MANAGER
    // =================================================

    if (req.user.role === "manager") {
      const assignedUser = await User.findById(
        lead.assignedTo
      );

      if (
        !assignedUser ||
        assignedUser.role !== "sales"
      ) {
        return res.status(403).json({
          message:
            "Manager can delete only Sales leads"
        });
      }
    }

    // =================================================
    // DELETE
    // =================================================

    await Lead.findByIdAndDelete(
      req.params.id
    );

    return res.status(200).json({
      message: "Lead deleted successfully"
    });
  } catch (error) {
    console.error("Delete Lead Error:", error);

    return res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};

// =====================================================
// GET SINGLE LEAD
// =====================================================

const getLeadById = async (req, res) => {
  try {
    // Validate Lead ID
    if (
      !mongoose.Types.ObjectId.isValid(
        req.params.id
      )
    ) {
      return res.status(400).json({
        message: "Invalid lead ID"
      });
    }

    const lead = await Lead.findById(
      req.params.id
    )
      .populate(
        "company",
        "name industry"
      )
      .populate(
        "assignedTo",
        "name email role"
      )
      .populate(
        "convertedContact",
        "firstName lastName email phone company owner"
      );

    if (!lead) {
      return res.status(404).json({
        message: "Lead not found"
      });
    }

    // =================================================
    // SALES ACCESS
    // =================================================

    if (
      req.user.role === "sales" &&
      (
        !lead.assignedTo ||
        String(lead.assignedTo._id) !==
          String(req.user.id)
      )
    ) {
      return res.status(403).json({
        message:
          "You can view only your assigned leads"
      });
    }

    // =================================================
    // MANAGER ACCESS
    // =================================================

    if (req.user.role === "manager") {
      if (
        !lead.assignedTo ||
        lead.assignedTo.role !== "sales"
      ) {
        return res.status(403).json({
          message:
            "Manager can view only Sales leads"
        });
      }
    }

    return res.status(200).json({
      message: "Lead fetched successfully",
      lead
    });
  } catch (error) {
    console.error(
      "Get Lead By ID Error:",
      error
    );

    return res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};

// =====================================================
// GET ASSIGNABLE USERS
// =====================================================

const getAssignableUsers = async (req, res) => {
  try {
    let filter = {
      isActive: true
    };

    // =================================================
    // MANAGER
    // =================================================

    if (req.user.role === "manager") {
      filter.role = "sales";
    }

    // =================================================
    // ADMIN
    // =================================================

    else if (req.user.role === "admin") {
      filter.role = {
        $in: [
          "admin",
          "manager",
          "sales"
        ]
      };
    }

    // =================================================
    // SALES
    // =================================================

    else {
      return res.status(403).json({
        message:
          "Sales users cannot assign leads"
      });
    }

    const users = await User.find(filter)
      .select(
        "_id name email role"
      )
      .sort({
        name: 1
      });

    return res.status(200).json({
      message:
        "Assignable users fetched successfully",
      users
    });
  } catch (error) {
    console.error(
      "Get Assignable Users Error:",
      error
    );

    return res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};

// =====================================================
// CONVERT LEAD → CONTACT
// =====================================================

const convertLead = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // =================================================
    // VALIDATE LEAD ID
    // =================================================

    if (
      !mongoose.Types.ObjectId.isValid(
        req.params.id
      )
    ) {
      await session.abortTransaction();

      return res.status(400).json({
        message: "Invalid lead ID"
      });
    }

    // =================================================
    // FIND LEAD
    // =================================================

    const lead = await Lead.findById(
      req.params.id
    ).session(session);

    if (!lead) {
      await session.abortTransaction();

      return res.status(404).json({
        message: "Lead not found"
      });
    }

    // =================================================
    // SALES ACCESS
    // =================================================

    if (
      req.user.role === "sales" &&
      String(lead.assignedTo) !==
        String(req.user.id)
    ) {
      await session.abortTransaction();

      return res.status(403).json({
        message:
          "You can convert only your assigned leads"
      });
    }

    // =================================================
    // MANAGER ACCESS
    // =================================================

    if (req.user.role === "manager") {
      const assignedUser =
        await User.findById(
          lead.assignedTo
        ).session(session);

      if (
        !assignedUser ||
        assignedUser.role !== "sales" ||
        !assignedUser.isActive
      ) {
        await session.abortTransaction();

        return res.status(403).json({
          message:
            "Manager can convert only active Sales leads"
        });
      }
    }

    // =================================================
    // ALREADY CONVERTED
    // =================================================

    if (lead.isConverted) {
      await session.abortTransaction();

      return res.status(400).json({
        message:
          "Lead has already been converted",
        convertedContact:
          lead.convertedContact
      });
    }

    // =================================================
    // ONLY QUALIFIED LEAD
    // =================================================

    if (lead.status !== "Qualified") {
      await session.abortTransaction();

      return res.status(400).json({
        message:
          "Only Qualified leads can be converted"
      });
    }

    // =================================================
    // ASSIGNED USER REQUIRED
    // =================================================

    if (!lead.assignedTo) {
      await session.abortTransaction();

      return res.status(400).json({
        message:
          "Lead must be assigned to a user before conversion"
      });
    }

    // =================================================
    // VALIDATE ASSIGNED USER
    // =================================================

    const assignedUser =
      await User.findOne({
        _id: lead.assignedTo,
        isActive: true
      }).session(session);

    if (!assignedUser) {
      await session.abortTransaction();

      return res.status(400).json({
        message:
          "Lead owner not found or inactive"
      });
    }

    // =================================================
    // VALIDATE COMPANY
    // =================================================

    if (lead.company) {
      // Validate ObjectId
      if (
        !mongoose.Types.ObjectId.isValid(
          lead.company
        )
      ) {
        await session.abortTransaction();

        return res.status(400).json({
          message: "Invalid company ID"
        });
      }

      const companyExists =
        await Company.findById(
          lead.company
        ).session(session);

      if (!companyExists) {
        await session.abortTransaction();

        return res.status(400).json({
          message:
            "Lead company not found"
        });
      }
    }

    // =================================================
    // CHECK EXISTING CONTACT
    // =================================================

    let contact = await Contact.findOne({
      lead: lead._id
    }).session(session);

    // =================================================
    // CREATE CONTACT
    // =================================================

    if (!contact) {
      contact = await Contact.create(
        [
          {
            firstName: lead.firstName,
            lastName: lead.lastName,
            email: lead.email,
            phone: lead.phone,
            company: lead.company,
            lead: lead._id,
            owner: lead.assignedTo,
            notes: lead.notes
          }
        ],
        {
          session
        }
      );

      contact = contact[0];
    }

    // =================================================
    // MARK LEAD AS CONVERTED
    // =================================================

    lead.isConverted = true;
    lead.convertedAt = new Date();
    lead.convertedContact = contact._id;

    await lead.save({
      session
    });

    // =================================================
    // COMMIT TRANSACTION
    // =================================================

    await session.commitTransaction();

    // =================================================
    // LEAD CONVERTED NOTIFICATION
    // =================================================

    await createNotification({
      recipient: lead.assignedTo,
      type: "LEAD_CONVERTED",
      title: "Lead Converted",
      message:
        `${lead.firstName} ${
          lead.lastName || ""
        } has been converted to a Contact.`,
      relatedLead: lead._id,
      relatedContact: contact._id
    });

    // =================================================
    // GET CONTACT
    // =================================================

    const populatedContact =
      await Contact.findById(
        contact._id
      )
        .populate(
          "company",
          "name industry"
        )
        .populate(
          "owner",
          "name email role"
        );

    // =================================================
    // RESPONSE
    // =================================================

    return res.status(200).json({
      message:
        "Lead converted to Contact successfully",

      contact: populatedContact
    });
  } catch (error) {
    // =================================================
    // ABORT TRANSACTION
    // =================================================

    try {
      await session.abortTransaction();
    } catch (abortError) {
      console.error(
        "Transaction Abort Error:",
        abortError
      );
    }

    console.error(
      "Convert Lead Error:",
      error
    );

    return res.status(500).json({
      message:
        "Lead conversion failed",
      error: error.message
    });
  } finally {
    await session.endSession();
  }
};

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  createLead,
  getLeads,
  updateLead,
  deleteLead,
  getLeadById,
  getAssignableUsers,
  convertLead
};