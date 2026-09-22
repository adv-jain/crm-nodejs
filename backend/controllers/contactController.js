
const Contact = require("../models/Contact");
const User = require("../models/User");


// ==========================================
// Create Contact
// ==========================================

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
      notes,
      owner
    } = req.body;

    let contactOwner = req.user.id;

    // ------------------------------------------
    // Admin / Manager can assign owner
    // ------------------------------------------

    if (
      (req.user.role === "admin" || req.user.role === "manager") &&
      owner
    ) {
      const assignedUser = await User.findOne({
        _id: owner,
        isActive: true
      });

      if (!assignedUser) {
        return res.status(400).json({
          message: "Assigned user not found or inactive"
        });
      }

      // Manager can assign only to Sales
      if (
        req.user.role === "manager" &&
        assignedUser.role !== "sales"
      ) {
        return res.status(403).json({
          message: "Manager can assign contacts only to sales users"
        });
      }

      contactOwner = assignedUser._id;
    }

    // ------------------------------------------
    // Sales always owns their own contact
    // ------------------------------------------

    if (req.user.role === "sales") {
      contactOwner = req.user.id;
    }

    const contact = await Contact.create({
      firstName,
      lastName,
      email,
      phone,
      designation,
      company,
      lead,
      owner: contactOwner,
      notes
    });

    const populatedContact = await Contact.findById(contact._id)
      .populate("company", "name industry")
      .populate("lead", "firstName lastName email status")
      .populate("owner", "name email role");

    res.status(201).json({
      message: "Contact created successfully",
      contact: populatedContact
    });

  } catch (error) {
    console.error("Create Contact Error:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};


// ==========================================
// Get All Contacts + Search + Filters
// ==========================================

const getContacts = async (req, res) => {
  try {
    const {
      search,
      company,
      designation
    } = req.query;

    let filter = {};

    // ------------------------------------------
    // ROLE BASED ACCESS
    // ------------------------------------------

    if (req.user.role === "sales") {

      // Sales → only own contacts
      filter.owner = req.user.id;

    } else if (req.user.role === "manager") {

      // Manager → all active Sales users' contacts
      const salesUsers = await User.find({
        role: "sales",
        isActive: true
      }).select("_id");

      const salesUserIds = salesUsers.map(
        user => user._id
      );

      filter.owner = {
        $in: salesUserIds
      };
    }

    // Admin → no owner filter
    // Admin can see all contacts


    // ------------------------------------------
    // Search by Name, Email or Phone
    // ------------------------------------------

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


    // ------------------------------------------
    // Filter by Company
    // ------------------------------------------

    if (company) {
      filter.company = company;
    }


    // ------------------------------------------
    // Filter by Designation
    // ------------------------------------------

    if (designation) {
      filter.designation = designation;
    }


    // ------------------------------------------
    // Get Contacts
    // ------------------------------------------

    const contacts = await Contact.find(filter)
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


    res.status(200).json({
      message: "Contacts fetched successfully",
      count: contacts.length,
      contacts
    });

  } catch (error) {
    console.error("Get Contacts Error:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};


// ==========================================
// Get Single Contact
// ==========================================

const getContactById = async (req, res) => {
  try {

    const contact = await Contact.findById(
      req.params.id
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


    if (!contact) {
      return res.status(404).json({
        message: "Contact not found"
      });
    }


    // ------------------------------------------
    // Sales → only own contact
    // ------------------------------------------

    if (
      req.user.role === "sales" &&
      contact.owner &&
      contact.owner._id.toString() !== req.user.id
    ) {
      return res.status(403).json({
        message: "Access denied"
      });
    }


    // ------------------------------------------
    // Manager → only Sales contacts
    // ------------------------------------------

    if (req.user.role === "manager") {

      if (
        !contact.owner ||
        contact.owner.role !== "sales"
      ) {
        return res.status(403).json({
          message: "Access denied"
        });
      }
    }


    res.status(200).json({
      message: "Contact fetched successfully",
      contact
    });

  } catch (error) {
    console.error("Get Contact By ID Error:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};


// ==========================================
// Update Contact
// ==========================================

const updateContact = async (req, res) => {
  try {

    const contact = await Contact.findById(
      req.params.id
    );

    if (!contact) {
      return res.status(404).json({
        message: "Contact not found"
      });
    }


    // ------------------------------------------
    // Sales → only own contact
    // ------------------------------------------

    if (
      req.user.role === "sales" &&
      contact.owner.toString() !== req.user.id
    ) {
      return res.status(403).json({
        message: "Access denied"
      });
    }


    // ------------------------------------------
    // Manager → only Sales contacts
    // ------------------------------------------

    if (req.user.role === "manager") {

      const ownerUser = await User.findById(
        contact.owner
      );

      if (
        !ownerUser ||
        ownerUser.role !== "sales"
      ) {
        return res.status(403).json({
          message: "Access denied"
        });
      }
    }


    // ------------------------------------------
    // Prevent Sales from changing owner
    // ------------------------------------------

    if (req.user.role === "sales") {
      delete req.body.owner;
    }


    // ------------------------------------------
    // Admin can assign any active user
    // Manager can assign only Sales
    // ------------------------------------------

    if (
      req.user.role === "admin" ||
      req.user.role === "manager"
    ) {

      if (req.body.owner) {

        const assignedUser = await User.findOne({
          _id: req.body.owner,
          isActive: true
        });

        if (!assignedUser) {
          return res.status(400).json({
            message: "Assigned user not found or inactive"
          });
        }


        if (
          req.user.role === "manager" &&
          assignedUser.role !== "sales"
        ) {
          return res.status(403).json({
            message: "Manager can assign contacts only to sales users"
          });
        }
      }
    }


    Object.assign(contact, req.body);

    await contact.save();


    const updatedContact = await Contact.findById(
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


    res.status(200).json({
      message: "Contact updated successfully",
      contact: updatedContact
    });

  } catch (error) {
    console.error("Update Contact Error:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};


// ==========================================
// Delete Contact
// ==========================================

const deleteContact = async (req, res) => {
  try {

    // ------------------------------------------
    // Only Admin can delete
    // ------------------------------------------

    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Only admin can delete contacts"
      });
    }


    const contact = await Contact.findByIdAndDelete(
      req.params.id
    );


    if (!contact) {
      return res.status(404).json({
        message: "Contact not found"
      });
    }


    res.status(200).json({
      message: "Contact deleted successfully"
    });

  } catch (error) {
    console.error("Delete Contact Error:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};


// ==========================================
// Get Assignable Users
// ==========================================

const getAssignableUsers = async (req, res) => {
  try {

    let filter = {
      isActive: true
    };


    // Admin → can assign to Admin, Manager, Sales
    if (req.user.role === "admin") {
      filter.role = {
        $in: ["admin", "manager", "sales"]
      };
    }


    // Manager → can assign only to Sales
    if (req.user.role === "manager") {
      filter.role = "sales";
    }


    const users = await User.find(filter)
      .select("_id name email role")
      .sort({ name: 1 });


    res.status(200).json({
      message: "Assignable users fetched successfully",
      users
    });

  } catch (error) {
    console.error("Get Assignable Users Error:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};


// ==========================================
// Export Controllers
// ==========================================

module.exports = {
  createContact,
  getContacts,
  getContactById,
  updateContact,
  deleteContact,
  getAssignableUsers
};

