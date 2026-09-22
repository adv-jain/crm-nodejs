const Notification = require("../models/Notification");

const createNotification = async ({
  recipient,
  type,
  title,
  message,
  relatedLead = null,
  relatedContact = null,
  relatedTask = null,
  relatedDeal = null,
  relatedCustomer = null,
  metadata = null
}) => {
  try {
    if (!recipient) {
      return null;
    }

    const notification = await Notification.create({
      recipient,
      type,
      title,
      message,
      relatedLead,
      relatedContact,
      relatedTask,
      relatedDeal,
      relatedCustomer,
      metadata
    });

    return notification;
  } catch (error) {
    console.error("Notification creation error:", error.message);

    // Notification fail hone ki wajah se
    // main CRM operation fail nahi hona chahiye.
    return null;
  }
};

const createLeadAssignedNotification = async ({
  recipient,
  lead,
  leadName
}) => {
  return createNotification({
    recipient,
    type: "LEAD_ASSIGNED",
    title: "New Lead Assigned",
    message: `${leadName} has been assigned to you.`,
    relatedLead: lead
  });
};

const createTaskAssignedNotification = async ({
  recipient,
  task,
  taskTitle
}) => {
  return createNotification({
    recipient,
    type: "TASK_ASSIGNED",
    title: "New Task Assigned",
    message: `${taskTitle} has been assigned to you.`,
    relatedTask: task
  });
};

const createDealAssignedNotification = async ({
  recipient,
  deal,
  dealTitle
}) => {
  return createNotification({
    recipient,
    type: "DEAL_ASSIGNED",
    title: "New Deal Assigned",
    message: `${dealTitle} has been assigned to you.`,
    relatedDeal: deal
  });
};

const createDealWonNotification = async ({
  recipient,
  deal,
  dealTitle
}) => {
  return createNotification({
    recipient,
    type: "DEAL_WON",
    title: "Deal Won 🎉",
    message: `${dealTitle} has been marked as Won.`,
    relatedDeal: deal
  });
};

const createDealLostNotification = async ({
  recipient,
  deal,
  dealTitle,
  lostReason
}) => {
  return createNotification({
    recipient,
    type: "DEAL_LOST",
    title: "Deal Lost",
    message: `${dealTitle} was marked as Lost. Reason: ${lostReason}`,
    relatedDeal: deal
  });
};

const createCustomerCreatedNotification = async ({
  recipient,
  customer,
  customerName
}) => {
  return createNotification({
    recipient,
    type: "CUSTOMER_CREATED",
    title: "New Customer Created",
    message: `${customerName} has been added as a customer.`,
    relatedCustomer: customer
  });
};

module.exports = {
  createNotification,
  createLeadAssignedNotification,
  createTaskAssignedNotification,
  createDealAssignedNotification,
  createDealWonNotification,
  createDealLostNotification,
  createCustomerCreatedNotification
};