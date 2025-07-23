// This file acts as a simple database for our support content.
// In the future, this data could come from a Headless CMS or a dedicated backend API.

export const allSupportArticles = [
  // Category: Getting Started
  {
    id: 'gs-01',
    category: "Getting Started",
    title: "How do I add my first property?",
    content: "Once logged in, navigate to your Dashboard, click on the 'Properties' tab, and then select 'Add New Property'. You'll be prompted to enter details like the property name, address, and type. It's that simple!",
    tags: ['property', 'setup', 'new', 'add']
  },
  {
    id: 'gs-02',
    category: "Getting Started",
    title: "How do I invite a Tenant or Property Manager?",
    content: "From the 'Users' or 'Team' section of your dashboard, you can send invitations via email. Simply enter their email address and select their role (e.g., Tenant, Property Manager). They will receive a secure link to sign up and connect to your property.",
    tags: ['invite', 'users', 'tenant', 'property manager', 'team']
  },

  // Category: Maintenance
  {
    id: 'maint-01',
    category: "Maintenance",
    title: "How does a tenant submit a maintenance request?",
    content: "Tenants can log in to their dedicated Tenant Portal and click 'Submit Request'. They can fill out a form with the issue category, a description, and even upload photos or videos directly from their phone.",
    tags: ['maintenance', 'request', 'ticket', 'tenant', 'issue']
  },
  {
    id: 'maint-02',
    category: "Maintenance",
    title: "What happens after a maintenance request is submitted?",
    content: "Once submitted, the request is instantly logged and you (or the assigned Property Manager) will receive a notification. The ticket will appear on your dashboard, where you can view details, add comments, and assign it to a vendor.",
    tags: ['status', 'update', 'ticket', 'notification', 'vendor']
  },
  {
    id: 'maint-03',
    category: "Maintenance",
    title: "How do I assign a vendor to a task?",
    content: "Open the maintenance ticket from your dashboard. You will see an 'Assign Vendor' option. You can select from your existing list of vendors or add a new one on the fly. The vendor will then be notified of the assignment.",
    tags: ['vendor', 'assign', 'task', 'job']
  },

  // Category: Billing & Plans
  {
    id: 'bill-01',
    category: "Billing & Plans",
    title: "How can I upgrade or downgrade my plan?",
    content: "You can change your subscription at any time. Go to 'Settings' > 'Billing', where you can select a new plan. Changes are prorated automatically, so you only pay for what you use.",
    tags: ['billing', 'subscription', 'plan', 'upgrade', 'downgrade', 'payment']
  },
  {
    id: 'bill-02',
    category: "Billing & Plans",
    title: "What payment methods do you accept?",
    content: "We accept all major credit cards, including Visa, Mastercard, and American Express. For Enterprise plans, we also support invoicing and bank transfers.",
    tags: ['payment', 'credit card', 'invoice', 'billing']
  },
];

// You can also export the FAQs from here to keep all support content centralized.
export const faqsByCategory = {
  "Getting Started": allSupportArticles.filter(a => a.category === "Getting Started"),
  "Maintenance": allSupportArticles.filter(a => a.category === "Maintenance"),
  "Billing & Plans": allSupportArticles.filter(a => a.category === "Billing & Plans"),
};