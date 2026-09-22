
const Lead = require("../models/Lead");
const Contact = require("../models/Contact");
const Company = require("../models/Company");
const Deal = require("../models/Deal");
const Activity = require("../models/Activity");
const Task = require("../models/Task");
const User = require("../models/User");


// =====================================================
// DASHBOARD SCOPE
// =====================================================

const getDashboardScope = async (req) => {
  const role = req.user.role;
  const userId = req.user.id;

  // ===================================================
  // ADMIN
  // ===================================================

  // Admin ko pura CRM data dikhega
  if (role === "admin") {
    return {
      userIds: null,
      isAllAccess: true
    };
  }


  // ===================================================
  // MANAGER
  // ===================================================

  // Manager active Sales users ka data dekhega
  if (role === "manager") {
    const salesUsers = await User.find({
      role: "sales",
      isActive: true
    }).select("_id");

    const salesUserIds = salesUsers.map(
      (user) => user._id
    );

    return {
      userIds: salesUserIds,
      isAllAccess: false
    };
  }


  // ===================================================
  // SALES
  // ===================================================

  // Sales user sirf apna data dekhega
  if (role === "sales") {
    return {
      userIds: [userId],
      isAllAccess: false
    };
  }


  // ===================================================
  // UNKNOWN ROLE
  // ===================================================

  return {
    userIds: [],
    isAllAccess: false
  };
};


// =====================================================
// DASHBOARD SUMMARY
// =====================================================

const getDashboardSummary = async (req, res) => {
  try {

    const scope =
      await getDashboardScope(req);


    // =================================================
    // LEAD FILTER
    // =================================================

    const leadFilter =
      scope.isAllAccess
        ? {}
        : {
            assignedTo: {
              $in: scope.userIds
            }
          };


    // =================================================
    // CONTACT FILTER
    // =================================================

    const contactFilter =
      scope.isAllAccess
        ? {}
        : {
            owner: {
              $in: scope.userIds
            }
          };


    // =================================================
    // DEAL FILTER
    // =================================================

    const dealFilter =
      scope.isAllAccess
        ? {}
        : {
            owner: {
              $in: scope.userIds
            }
          };


    // =================================================
    // LEADS
    // =================================================

    const totalLeads =
      await Lead.countDocuments(
        leadFilter
      );


    const newLeads =
      await Lead.countDocuments({
        ...leadFilter,
        status: "New"
      });


    const qualifiedLeads =
      await Lead.countDocuments({
        ...leadFilter,
        status: "Qualified"
      });


    // =================================================
    // CONTACTS
    // =================================================

    const totalContacts =
      await Contact.countDocuments(
        contactFilter
      );


    // =================================================
    // DEALS
    // =================================================

    const totalDeals =
      await Deal.countDocuments(
        dealFilter
      );


    // =================================================
    // PIPELINE VALUE
    // =================================================

    // Won aur Lost deals ko active pipeline
    // se exclude karenge

    const pipelineResult =
      await Deal.aggregate([
        {
          $match: {
            ...dealFilter,

            stage: {
              $nin: [
                "Won",
                "Lost"
              ]
            }
          }
        },

        {
          $group: {
            _id: null,

            total: {
              $sum: "$value"
            }
          }
        }
      ]);


    const pipelineValue =
      pipelineResult.length > 0
        ? pipelineResult[0].total
        : 0;


    // =================================================
    // WON REVENUE
    // =================================================

    const wonResult =
      await Deal.aggregate([
        {
          $match: {
            ...dealFilter,

            stage: "Won"
          }
        },

        {
          $group: {
            _id: null,

            total: {
              $sum: "$value"
            }
          }
        }
      ]);


    const wonRevenue =
      wonResult.length > 0
        ? wonResult[0].total
        : 0;


    // =================================================
    // RESPONSE
    // =================================================

    res.status(200).json({

      message:
        "Dashboard summary fetched successfully",

      role:
        req.user.role,

      summary: {
        totalLeads,
        newLeads,
        qualifiedLeads,
        totalContacts,
        totalDeals,
        pipelineValue,
        wonRevenue
      }

    });

  } catch (error) {

    console.error(
      "Dashboard Summary Error:",
      error
    );

    res.status(500).json({

      message:
        "Failed to fetch dashboard summary",

      error:
        error.message

    });
  }
};


// =====================================================
// SALES PIPELINE
// =====================================================

const getDashboardPipeline = async (req, res) => {
  try {

    const scope =
      await getDashboardScope(req);


    // =================================================
    // DEAL FILTER
    // =================================================

    const dealFilter =
      scope.isAllAccess
        ? {}
        : {
            owner: {
              $in: scope.userIds
            }
          };


    // =================================================
    // PIPELINE
    // =================================================

    const pipeline =
      await Deal.aggregate([
        {
          $match:
            dealFilter
        },

        {
          $group: {

            _id: "$stage",

            dealCount: {
              $sum: 1
            },

            totalValue: {
              $sum: "$value"
            }

          }
        }
      ]);


    // =================================================
    // ALL VALID DEAL STAGES
    // =================================================

    // IMPORTANT:
    // Ye stages Deal model ke actual enum
    // ke according hain.

    const stages = [

      "New",

      "Qualified",

      "Proposal",

      "Negotiation",

      "Won",

      "Lost"

    ];


    // =================================================
    // FORMAT PIPELINE
    // =================================================

    const formattedPipeline =
      stages.map((stage) => {

        const found =
          pipeline.find(
            (item) =>
              item._id === stage
          );


        return {

          stage,

          dealCount:
            found
              ? found.dealCount
              : 0,

          totalValue:
            found
              ? found.totalValue
              : 0

        };

      });


    // =================================================
    // RESPONSE
    // =================================================

    res.status(200).json({

      message:
        "Sales pipeline fetched successfully",

      role:
        req.user.role,

      pipeline:
        formattedPipeline

    });

  } catch (error) {

    console.error(
      "Dashboard Pipeline Error:",
      error
    );

    res.status(500).json({

      message:
        "Failed to fetch sales pipeline",

      error:
        error.message

    });
  }
};


// =====================================================
// LEAD SOURCES
// =====================================================

const getDashboardLeadSources = async (
  req,
  res
) => {

  try {

    const scope =
      await getDashboardScope(req);


    // =================================================
    // LEAD FILTER
    // =================================================

    const leadFilter =
      scope.isAllAccess
        ? {}
        : {
            assignedTo: {
              $in: scope.userIds
            }
          };


    // =================================================
    // GROUP BY SOURCE
    // =================================================

    const leadSources =
      await Lead.aggregate([

        {
          $match:
            leadFilter
        },

        {
          $group: {

            _id: "$source",

            leadCount: {
              $sum: 1
            }

          }
        },

        {
          $sort: {
            leadCount: -1
          }
        }

      ]);


    // =================================================
    // FORMAT RESPONSE
    // =================================================

    const sources =
      leadSources.map((item) => {

        return {

          source:
            item._id ||
            "Unknown",

          leadCount:
            item.leadCount

        };

      });


    // =================================================
    // RESPONSE
    // =================================================

    res.status(200).json({

      message:
        "Lead sources fetched successfully",

      role:
        req.user.role,

      sources

    });

  } catch (error) {

    console.error(
      "Dashboard Lead Sources Error:",
      error
    );

    res.status(500).json({

      message:
        "Failed to fetch lead sources",

      error:
        error.message

    });
  }
};


// =====================================================
// RECENT ACTIVITIES + UPCOMING TASKS
// =====================================================

const getDashboardRecent = async (
  req,
  res
) => {

  try {

    const scope =
      await getDashboardScope(req);


    // =================================================
    // TASK FILTER
    // =================================================

    const taskFilter = {

      status: {
        $in: [
          "Pending",
          "In Progress"
        ]
      },

      dueDate: {
        $gte: new Date()
      }

    };


    // =================================================
    // MANAGER / SALES TASK FILTER
    // =================================================

    if (!scope.isAllAccess) {

      taskFilter.assignedTo = {
        $in: scope.userIds
      };

    }


    // =================================================
    // UPCOMING TASKS
    // =================================================

    const upcomingTasks =
      await Task.find(
        taskFilter
      )

      .sort({
        dueDate: 1
      })

      .limit(5)

      .populate(
        "assignedTo",
        "name email role"
      )

      .populate(
        "createdBy",
        "name email role"
      )

      .populate(
        "relatedLead",
        "firstName lastName"
      )

      .populate(
        "relatedContact",
        "firstName lastName"
      )

      .populate(
        "relatedCompany",
        "name"
      )

      .populate(
        "relatedDeal",
        "title value"
      );


    // =================================================
    // ACTIVITY FILTER
    // =================================================

    let activityFilter = {};


    // =================================================
    // ADMIN
    // =================================================

    if (scope.isAllAccess) {

      activityFilter = {};

    }


    // =================================================
    // MANAGER / SALES
    // =================================================

    else {

      // ===============================================
      // SALES LEADS
      // ===============================================

      const salesLeads =
        await Lead.find({

          assignedTo: {
            $in: scope.userIds
          }

        }).select("_id");


      const leadIds =
        salesLeads.map(
          (lead) => lead._id
        );


      // ===============================================
      // SALES CONTACTS
      // ===============================================

      const salesContacts =
        await Contact.find({

          owner: {
            $in: scope.userIds
          }

        }).select("_id");


      const contactIds =
        salesContacts.map(
          (contact) => contact._id
        );


      // ===============================================
      // SALES COMPANIES
      // ===============================================

      const salesCompanies =
        await Company.find({

          owner: {
            $in: scope.userIds
          }

        }).select("_id");


      const companyIds =
        salesCompanies.map(
          (company) => company._id
        );


      // ===============================================
      // SALES DEALS
      // ===============================================

      const salesDeals =
        await Deal.find({

          owner: {
            $in: scope.userIds
          }

        }).select("_id");


      const dealIds =
        salesDeals.map(
          (deal) => deal._id
        );


      // ===============================================
      // ACTIVITY ACCESS
      // ===============================================

      activityFilter = {

        $or: [

          // Activity created by Sales
          {
            createdBy: {
              $in: scope.userIds
            }
          },

          // Activity related to Sales Lead
          {
            lead: {
              $in: leadIds
            }
          },

          // Activity related to Sales Contact
          {
            contact: {
              $in: contactIds
            }
          },

          // Activity related to Sales Company
          {
            company: {
              $in: companyIds
            }
          },

          // Activity related to Sales Deal
          {
            deal: {
              $in: dealIds
            }
          }

        ]

      };

    }


    // =================================================
    // RECENT ACTIVITIES
    // =================================================

    const recentActivities =
      await Activity.find(
        activityFilter
      )

      .sort({
        createdAt: -1
      })

      .limit(5)

      .populate(
        "createdBy",
        "name email role"
      )

      .populate(
        "lead",
        "firstName lastName"
      )

      .populate(
        "contact",
        "firstName lastName"
      )

      .populate(
        "company",
        "name"
      )

      .populate(
        "deal",
        "title value"
      );


    // =================================================
    // RESPONSE
    // =================================================

    res.status(200).json({

      message:
        "Recent dashboard data fetched successfully",

      role:
        req.user.role,

      recentActivities,

      upcomingTasks

    });

  } catch (error) {

    console.error(
      "Dashboard Recent Data Error:",
      error
    );

    res.status(500).json({

      message:
        "Failed to fetch recent dashboard data",

      error:
        error.message

    });

  }
};


// =====================================================
// EXPORTS
// =====================================================

module.exports = {

  getDashboardSummary,

  getDashboardPipeline,

  getDashboardLeadSources,

  getDashboardRecent

};

