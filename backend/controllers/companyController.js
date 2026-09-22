const Company = require("../models/Company");

// Create Company
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

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Company name is required"
      });
    }

    const company = await Company.create({
      name,
      industry,
      website,
      email,
      phone,
      address,
      city,
      country,
      employees,
      owner: req.user.id
    });

    const populatedCompany =
      await Company.findById(company._id).populate(
        "owner",
        "name email role"
      );

    res.status(201).json({
      message: "Company created successfully",
      company: populatedCompany
    });

  } catch (error) {
    console.error("Create company error:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};


// Get All Companies
const getCompanies = async (req, res) => {
  try {
    const {
      search,
      industry,
      city
    } = req.query;

    let filter = {};

    if (search) {
      filter.$or = [
        {
          name: {
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

    if (industry) {
      filter.industry = industry;
    }

    if (city) {
      filter.city = city;
    }

    const companies = await Company.find(filter)
      .populate(
        "owner",
        "name email role"
      )
      .sort({
        createdAt: -1
      });

    res.status(200).json({
      message: "Companies fetched successfully",
      count: companies.length,
      companies
    });

  } catch (error) {
    console.error("Get companies error:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};


// Get Single Company
const getCompanyById = async (req, res) => {
  try {
    const company =
      await Company.findById(req.params.id)
        .populate(
          "owner",
          "name email role"
        );

    if (!company) {
      return res.status(404).json({
        message: "Company not found"
      });
    }

    res.status(200).json({
      message: "Company fetched successfully",
      company
    });

  } catch (error) {
    console.error(
      "Get company error:",
      error
    );

    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};


// Update Company
const updateCompany = async (req, res) => {
  try {
    const company =
      await Company.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
          new: true,
          runValidators: true
        }
      ).populate(
        "owner",
        "name email role"
      );

    if (!company) {
      return res.status(404).json({
        message: "Company not found"
      });
    }

    res.status(200).json({
      message: "Company updated successfully",
      company
    });

  } catch (error) {
    console.error(
      "Update company error:",
      error
    );

    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};


// Delete Company
const deleteCompany = async (req, res) => {
  try {
    const company =
      await Company.findByIdAndDelete(
        req.params.id
      );

    if (!company) {
      return res.status(404).json({
        message: "Company not found"
      });
    }

    res.status(200).json({
      message: "Company deleted successfully"
    });

  } catch (error) {
    console.error(
      "Delete company error:",
      error
    );

    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};


module.exports = {
  createCompany,
  getCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany
};