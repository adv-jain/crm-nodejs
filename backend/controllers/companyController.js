const mongoose = require("mongoose");
const Company = require("../models/Company");

// =========================================================
// CREATE COMPANY
// =========================================================

const createCompany = async (req, res) => {
  try {
    const {
      name,
      industry,
      website,
      email,
      phone,
      address,
      city,
      country,
      employees
    } = req.body;

    // -------------------------------------------------------
    // Validate company name
    // -------------------------------------------------------

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Company name is required"
      });
    }

    // -------------------------------------------------------
    // Validate employees
    // -------------------------------------------------------

    if (
      employees !== undefined &&
      employees !== null &&
      employees !== ""
    ) {
      const employeeNumber = Number(employees);

      if (
        !Number.isFinite(employeeNumber) ||
        employeeNumber < 0
      ) {
        return res.status(400).json({
          message:
            "Employees must be a valid non-negative number"
        });
      }
    }

    // -------------------------------------------------------
    // Create company
    // -------------------------------------------------------

    const company = await Company.create({
      name: name.trim(),
      industry: industry?.trim(),
      website: website?.trim(),
      email: email?.trim(),
      phone: phone?.trim(),
      address: address?.trim(),
      city: city?.trim(),
      country: country?.trim(),
      employees:
        employees === "" ||
        employees === undefined ||
        employees === null
          ? undefined
          : Number(employees),

      owner: req.user.id
    });

    // -------------------------------------------------------
    // Populate owner
    // -------------------------------------------------------

    const populatedCompany =
      await Company.findById(company._id).populate(
        "owner",
        "name email role"
      );

    // -------------------------------------------------------
    // Response
    // -------------------------------------------------------

    return res.status(201).json({
      message: "Company created successfully",
      company: populatedCompany
    });

  } catch (error) {
    console.error(
      "Create company error:",
      error
    );

    return res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};


// =========================================================
// GET ALL COMPANIES
// =========================================================

const getCompanies = async (req, res) => {
  try {
    const {
      search = "",
      industry = "",
      city = "",
      page = 1,
      limit = 50
    } = req.query;

    // -------------------------------------------------------
    // Pagination
    // -------------------------------------------------------

    const currentPage = Math.max(
      parseInt(page) || 1,
      1
    );

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

    // -------------------------------------------------------
    // Filter
    // -------------------------------------------------------

    const filter = {};

    // Search:
    // company name
    // email
    // phone
    if (search.trim()) {
      filter.$or = [
        {
          name: {
            $regex: search.trim(),
            $options: "i"
          }
        },
        {
          email: {
            $regex: search.trim(),
            $options: "i"
          }
        },
        {
          phone: {
            $regex: search.trim(),
            $options: "i"
          }
        }
      ];
    }

    // Industry
    if (industry.trim()) {
      filter.industry = industry.trim();
    }

    // City
    // Partial + case-insensitive search
    if (city.trim()) {
      filter.city = {
        $regex: city.trim(),
        $options: "i"
      };
    }

    // -------------------------------------------------------
    // Count + Fetch
    // -------------------------------------------------------

    const [total, companies] =
      await Promise.all([
        Company.countDocuments(filter),

        Company.find(filter)
          .populate(
            "owner",
            "name email role"
          )
          .sort({
            createdAt: -1
          })
          .skip(skip)
          .limit(recordsPerPage)
      ]);

    // -------------------------------------------------------
    // Total pages
    // -------------------------------------------------------

    const totalPages = Math.ceil(
      total / recordsPerPage
    );

    // -------------------------------------------------------
    // Response
    // -------------------------------------------------------

    return res.status(200).json({
      message:
        "Companies fetched successfully",

      count: companies.length,

      total,

      page: currentPage,

      limit: recordsPerPage,

      totalPages,

      hasNextPage:
        currentPage < totalPages,

      hasPreviousPage:
        currentPage > 1,

      companies
    });

  } catch (error) {
    console.error(
      "Get companies error:",
      error
    );

    return res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};


// =========================================================
// GET SINGLE COMPANY
// =========================================================

const getCompanyById = async (req, res) => {
  try {
    const { id } = req.params;

    // -------------------------------------------------------
    // Validate MongoDB ObjectId
    // -------------------------------------------------------

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid company ID"
      });
    }

    // -------------------------------------------------------
    // Find company
    // -------------------------------------------------------

    const company =
      await Company.findById(id).populate(
        "owner",
        "name email role"
      );

    // -------------------------------------------------------
    // Company not found
    // -------------------------------------------------------

    if (!company) {
      return res.status(404).json({
        message: "Company not found"
      });
    }

    // -------------------------------------------------------
    // Response
    // -------------------------------------------------------

    return res.status(200).json({
      message:
        "Company fetched successfully",
      company
    });

  } catch (error) {
    console.error(
      "Get company error:",
      error
    );

    return res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};


// =========================================================
// UPDATE COMPANY
// =========================================================

const updateCompany = async (req, res) => {
  try {
    const { id } = req.params;

    // -------------------------------------------------------
    // Validate MongoDB ObjectId
    // -------------------------------------------------------

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid company ID"
      });
    }

    // -------------------------------------------------------
    // Allowed fields only
    // -------------------------------------------------------

    const {
      name,
      industry,
      website,
      email,
      phone,
      address,
      city,
      country,
      employees
    } = req.body;

    // -------------------------------------------------------
    // Validate company name
    // -------------------------------------------------------

    if (
      name !== undefined &&
      !String(name).trim()
    ) {
      return res.status(400).json({
        message: "Company name cannot be empty"
      });
    }

    // -------------------------------------------------------
    // Validate employees
    // -------------------------------------------------------

    if (
      employees !== undefined &&
      employees !== null &&
      employees !== ""
    ) {
      const employeeNumber = Number(
        employees
      );

      if (
        !Number.isFinite(employeeNumber) ||
        employeeNumber < 0
      ) {
        return res.status(400).json({
          message:
            "Employees must be a valid non-negative number"
        });
      }
    }

    // -------------------------------------------------------
    // Build update object
    // -------------------------------------------------------

    const updateData = {};

    if (name !== undefined) {
      updateData.name = String(name).trim();
    }

    if (industry !== undefined) {
      updateData.industry =
        String(industry).trim();
    }

    if (website !== undefined) {
      updateData.website =
        String(website).trim();
    }

    if (email !== undefined) {
      updateData.email =
        String(email).trim();
    }

    if (phone !== undefined) {
      updateData.phone =
        String(phone).trim();
    }

    if (address !== undefined) {
      updateData.address =
        String(address).trim();
    }

    if (city !== undefined) {
      updateData.city =
        String(city).trim();
    }

    if (country !== undefined) {
      updateData.country =
        String(country).trim();
    }

    if (employees !== undefined) {
      updateData.employees =
        employees === "" ||
        employees === null
          ? undefined
          : Number(employees);
    }

    // -------------------------------------------------------
    // Update company
    // -------------------------------------------------------

    const company =
      await Company.findByIdAndUpdate(
        id,
        updateData,
        {
          new: true,
          runValidators: true
        }
      ).populate(
        "owner",
        "name email role"
      );

    // -------------------------------------------------------
    // Company not found
    // -------------------------------------------------------

    if (!company) {
      return res.status(404).json({
        message: "Company not found"
      });
    }

    // -------------------------------------------------------
    // Response
    // -------------------------------------------------------

    return res.status(200).json({
      message:
        "Company updated successfully",
      company
    });

  } catch (error) {
    console.error(
      "Update company error:",
      error
    );

    return res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};


// =========================================================
// DELETE COMPANY
// =========================================================

const deleteCompany = async (req, res) => {
  try {
    const { id } = req.params;

    // -------------------------------------------------------
    // Validate MongoDB ObjectId
    // -------------------------------------------------------

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid company ID"
      });
    }

    // -------------------------------------------------------
    // Find company
    // -------------------------------------------------------

    const company =
      await Company.findById(id);

    if (!company) {
      return res.status(404).json({
        message: "Company not found"
      });
    }

    // -------------------------------------------------------
    // Delete company
    // -------------------------------------------------------

    await Company.findByIdAndDelete(id);

    // -------------------------------------------------------
    // Response
    // -------------------------------------------------------

    return res.status(200).json({
      message:
        "Company deleted successfully"
    });

  } catch (error) {
    console.error(
      "Delete company error:",
      error
    );

    return res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};


// =========================================================
// EXPORTS
// =========================================================

module.exports = {
  createCompany,
  getCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany
};