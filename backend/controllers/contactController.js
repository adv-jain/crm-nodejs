const Contact = require("../models/Contact");
const User = require("../models/User");

// =====================================================
// CREATE CONTACT
// =====================================================

const createContact = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      designation,
      company,
      lead,
      owner,
      notes,
    } = req.body;

    // -----------------------------------------------
    // Validate required fields
    // -----------------------------------------------

    if (!firstName || !lastName || !email) {
      return res.status(400).json({
        message:
          "First name, last name and email are required",
      });
    }

    // -----------------------------------------------
    // Determine owner
    // -----------------------------------------------

    let contactOwner;

    // Sales can only create contact for themselves
    if (req.user.role === "sales") {
      contactOwner = req.user.id;
    }

    // Admin
    else if (req.user.role === "admin") {
      if (!owner) {
        contactOwner = req.user.id;
      } else {
        const selectedUser = await User.findOne({
          _id: owner,
          isActive: true,
        });

        if (!selectedUser) {
          return res.status(400).json({
            message:
              "Selected owner does not exist or is inactive",
          });
        }

        contactOwner = selectedUser._id;
      }
    }

    // Manager
    else if (req.user.role === "manager") {
      if (!owner) {
        contactOwner = req.user.id;
      } else {
        const selectedUser = await User.findOne({
          _id: owner,
          role: "sales",
          isActive: true,
        });

        if (!selectedUser) {
          return res.status(400).json({
            message:
              "Manager can only assign contacts to active sales users",
          });
        }

        contactOwner = selectedUser._id;
      }
    }

    // -----------------------------------------------
    // Create contact
    // -----------------------------------------------

    const contact = await Contact.create({
      firstName,
      lastName,
      email,
      phone,
      designation,
      company: company || null,
      lead: lead || null,
      owner: contactOwner,
      notes,
    });

    // -----------------------------------------------
    // Populate response
    // -----------------------------------------------

    const populatedContact =
      await Contact.findById(contact._id)
        .populate(
          "company",
          "name industry"
        )
        .populate(
          "lead",
          "firstName lastName email status"
        )
        .populate(
          "owner",
          "name email role"
        );

    return res.status(201).json({
      message:
        "Contact created successfully",
      contact: populatedContact,
    });
  } catch (error) {
    console.error(
      "Create Contact Error:",
      error
    );

    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// =====================================================
// GET CONTACTS WITH PAGINATION
// =====================================================

const getContacts = async (req, res) => {
  try {
    const {
      search,
      company,
      designation,
      page = 1,
      limit = 50,
    } = req.query;

    // -----------------------------------------------
    // Pagination
    // -----------------------------------------------

    const currentPage = Math.max(
      parseInt(page) || 1,
      1
    );

    /*
     * Maximum 50 contacts per request.
     *
     * Example:
     * limit=100 -> automatically becomes 50
     */
    const recordsPerPage = Math.min(
      Math.max(
        parseInt(limit) || 50,
        1
      ),
      50
    );

    const skip =
      (currentPage - 1) *
      recordsPerPage;

    // -----------------------------------------------
    // Base filter
    // -----------------------------------------------

    let filter = {};

    // -----------------------------------------------
    // SALES
    // -----------------------------------------------

    if (req.user.role === "sales") {
      filter.owner = req.user.id;
    }

    // -----------------------------------------------
    // MANAGER
    // -----------------------------------------------

    else if (
      req.user.role === "manager"
    ) {
      const salesUsers =
        await User.find({
          role: "sales",
          isActive: true,
        }).select("_id");

      const salesUserIds =
        salesUsers.map(
          (user) => user._id
        );

      filter.owner = {
        $in: salesUserIds,
      };
    }

    // -----------------------------------------------
    // ADMIN
    // -----------------------------------------------

    /*
     * Admin can see all contacts.
     * No owner filter required.
     */

    // -----------------------------------------------
    // SEARCH
    // -----------------------------------------------

    if (search) {
      filter.$or = [
        {
          firstName: {
            $regex: search,
            $options: "i",
          },
        },
        {
          lastName: {
            $regex: search,
            $options: "i",
          },
        },
        {
          email: {
            $regex: search,
            $options: "i",
          },
        },
        {
          phone: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    // -----------------------------------------------
    // COMPANY FILTER
    // -----------------------------------------------

    if (company) {
      filter.company = company;
    }

    // -----------------------------------------------
    // DESIGNATION FILTER
    // -----------------------------------------------

    if (designation) {
      filter.designation =
        designation;
    }

    // -----------------------------------------------
    // TOTAL CONTACTS
    // -----------------------------------------------

    const total =
      await Contact.countDocuments(
        filter
      );

    // -----------------------------------------------
    // FETCH PAGINATED CONTACTS
    // -----------------------------------------------

    const contacts =
      await Contact.find(filter)
        .populate(
          "company",
          "name industry"
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
          createdAt: -1,
        })
        .skip(skip)
        .limit(recordsPerPage);

    // -----------------------------------------------
    // TOTAL PAGES
    // -----------------------------------------------

    const totalPages = Math.ceil(
      total / recordsPerPage
    );

    // -----------------------------------------------
    // RESPONSE
    // -----------------------------------------------

    return res.status(200).json({
      message:
        "Contacts fetched successfully",

      // Current page records
      count: contacts.length,

      // Total records matching filters
      total,

      // Current page
      page: currentPage,

      // Records per page
      limit: recordsPerPage,

      // Total pages
      totalPages,

      // Pagination flags
      hasNextPage:
        currentPage < totalPages,

      hasPreviousPage:
        currentPage > 1,

      // Data
      contacts,
    });
  } catch (error) {
    console.error(
      "Get Contacts Error:",
      error
    );

    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// =====================================================
// GET CONTACT BY ID
// =====================================================

const getContactById = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const contact =
      await Contact.findById(id)
        .populate(
          "company",
          "name industry website email phone"
        )
        .populate(
          "lead",
          "firstName lastName email phone status source"
        )
        .populate(
          "owner",
          "name email role"
        );

    if (!contact) {
      return res.status(404).json({
        message: "Contact not found",
      });
    }

    // -----------------------------------------------
    // SALES ACCESS
    // -----------------------------------------------

    if (
      req.user.role === "sales"
    ) {
      if (
        contact.owner?._id.toString() !==
        req.user.id.toString()
      ) {
        return res.status(403).json({
          message:
            "You are not authorized to view this contact",
        });
      }
    }

    // -----------------------------------------------
    // MANAGER ACCESS
    // -----------------------------------------------

    if (
      req.user.role === "manager"
    ) {
      const ownerId =
        contact.owner?._id?.toString();

      if (!ownerId) {
        return res.status(403).json({
          message:
            "You are not authorized to view this contact",
        });
      }

      const ownerUser =
        await User.findById(ownerId);

      if (
        !ownerUser ||
        ownerUser.role !== "sales"
      ) {
        return res.status(403).json({
          message:
            "You are not authorized to view this contact",
        });
      }
    }

    // Admin can view everything

    return res.status(200).json({
      message:
        "Contact fetched successfully",
      contact,
    });
  } catch (error) {
    console.error(
      "Get Contact By ID Error:",
      error
    );

    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// =====================================================
// UPDATE CONTACT
// =====================================================

const updateContact = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const {
      firstName,
      lastName,
      email,
      phone,
      designation,
      company,
      lead,
      owner,
      notes,
    } = req.body;

    // -----------------------------------------------
    // Find contact
    // -----------------------------------------------

    const contact =
      await Contact.findById(id);

    if (!contact) {
      return res.status(404).json({
        message: "Contact not found",
      });
    }

    // -----------------------------------------------
    // SALES ACCESS
    // -----------------------------------------------

    if (
      req.user.role === "sales"
    ) {
      if (
        contact.owner?.toString() !==
        req.user.id.toString()
      ) {
        return res.status(403).json({
          message:
            "You are not authorized to update this contact",
        });
      }

      // Sales cannot change owner
      if (owner) {
        if (
          owner.toString() !==
          req.user.id.toString()
        ) {
          return res.status(403).json({
            message:
              "Sales users cannot change contact owner",
          });
        }
      }
    }

    // -----------------------------------------------
    // MANAGER ACCESS
    // -----------------------------------------------

    if (
      req.user.role === "manager"
    ) {
      const currentOwner =
        await User.findById(
          contact.owner
        );

      if (
        !currentOwner ||
        currentOwner.role !== "sales"
      ) {
        return res.status(403).json({
          message:
            "You are not authorized to update this contact",
        });
      }

      if (owner) {
        const selectedUser =
          await User.findOne({
            _id: owner,
            role: "sales",
            isActive: true,
          });

        if (!selectedUser) {
          return res.status(400).json({
            message:
              "Manager can only assign contacts to active sales users",
          });
        }

        contact.owner =
          selectedUser._id;
      }
    }

    // -----------------------------------------------
    // ADMIN OWNER
    // -----------------------------------------------

    if (
      req.user.role === "admin" &&
      owner
    ) {
      const selectedUser =
        await User.findOne({
          _id: owner,
          isActive: true,
        });

      if (!selectedUser) {
        return res.status(400).json({
          message:
            "Selected owner does not exist or is inactive",
        });
      }

      contact.owner =
        selectedUser._id;
    }

    // -----------------------------------------------
    // Update fields
    // -----------------------------------------------

    if (firstName !== undefined) {
      contact.firstName =
        firstName;
    }

    if (lastName !== undefined) {
      contact.lastName =
        lastName;
    }

    if (email !== undefined) {
      contact.email = email;
    }

    if (phone !== undefined) {
      contact.phone = phone;
    }

    if (
      designation !== undefined
    ) {
      contact.designation =
        designation;
    }

    if (company !== undefined) {
      contact.company =
        company || null;
    }

    if (lead !== undefined) {
      contact.lead =
        lead || null;
    }

    if (notes !== undefined) {
      contact.notes = notes;
    }

    await contact.save();

    // -----------------------------------------------
    // Populate updated contact
    // -----------------------------------------------

    const updatedContact =
      await Contact.findById(
        contact._id
      )
        .populate(
          "company",
          "name industry"
        )
        .populate(
          "lead",
          "firstName lastName email status"
        )
        .populate(
          "owner",
          "name email role"
        );

    return res.status(200).json({
      message:
        "Contact updated successfully",
      contact: updatedContact,
    });
  } catch (error) {
    console.error(
      "Update Contact Error:",
      error
    );

    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// =====================================================
// DELETE CONTACT
// =====================================================

const deleteContact = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    // -----------------------------------------------
    // Admin only
    // -----------------------------------------------

    if (
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        message:
          "Only admin can delete contacts",
      });
    }

    const contact =
      await Contact.findById(id);

    if (!contact) {
      return res.status(404).json({
        message: "Contact not found",
      });
    }

    await Contact.findByIdAndDelete(id);

    return res.status(200).json({
      message:
        "Contact deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete Contact Error:",
      error
    );

    return res.status(500).json({
      message: "Server error",
      error: error.message,
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
      isActive: true,
    };

    // -----------------------------------------------
    // ADMIN
    // -----------------------------------------------

    if (
      req.user.role === "admin"
    ) {
      filter.role = {
        $in: [
          "admin",
          "manager",
          "sales",
        ],
      };
    }

    // -----------------------------------------------
    // MANAGER
    // -----------------------------------------------

    else if (
      req.user.role === "manager"
    ) {
      filter.role = "sales";
    }

    // -----------------------------------------------
    // SALES
    // -----------------------------------------------

    else {
      return res.status(403).json({
        message:
          "You are not authorized to view assignable users",
      });
    }

    const users =
      await User.find(filter)
        .select(
          "_id name email role isActive"
        )
        .sort({
          name: 1,
        });

    return res.status(200).json({
      message:
        "Assignable users fetched successfully",

      count: users.length,

      users,
    });
  } catch (error) {
    console.error(
      "Get Assignable Users Error:",
      error
    );

    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  createContact,
  getContacts,
  getContactById,
  updateContact,
  deleteContact,
  getAssignableUsers,
};