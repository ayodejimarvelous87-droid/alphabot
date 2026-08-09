const sendEmail = require("./emailService");

const benefits = {
  silver: [
    "2x coins on eligible rewards",
    "Weekly member bonuses",
    "Access to Silver member promotions"
  ],
  gold: [
    "3x coins on eligible rewards",
    "Weekly member bonuses",
    "Reduced prices during Gold promotions",
    "Access to Gold-only deals"
  ]
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
};


const sendMembershipDemotionEmail = async (user) => {

  if(!user?.email){
    return;
  }

  const name = user.name || "there";

  await sendEmail(
    user.email,
    "Your AlphaBot Membership Has Ended",
    `
Hello ${name},

Your AlphaBot membership has been changed to the Normal tier.

Your previous membership benefits are no longer active.

You can upgrade to Silver or Gold at any time from your AlphaBot account.

Thank you for being part of AlphaBot.

The AlphaBot Team
`
  );
};


const sendMembershipExpiryReminderEmail = async (
  user,
  daysRemaining = 3
) => {

  if(!user?.email){
    return;
  }

  const name = user.name || "there";
  const tier =
    String(user.accountTier || "silver")
      .toLowerCase();

  const expiryDate =
    formatDate(user.accountTierExpiresAt);

  const tierName =
    tier.charAt(0).toUpperCase() +
    tier.slice(1);

  const tierBenefits =
    benefits[tier] || [];

  const benefitText =
    tierBenefits
      .map(item => `- ${item}`)
      .join("\n");

  await sendEmail(
    user.email,
    `Your AlphaBot ${tierName} Membership Expires Soon`,
    `
Hello ${name},

Just a quick reminder that your AlphaBot ${tierName} membership is about to expire.

Your membership expires on ${expiryDate}, which is approximately ${daysRemaining} days from now.

Your current ${tierName} benefits include:

${benefitText}

To continue enjoying your membership benefits, you can renew or upgrade your membership from your AlphaBot account.

Thank you for being a valued AlphaBot member.

The AlphaBot Team
`
  );
};


const sendMembershipExpiredEmail = async (user) => {

  if(!user?.email){
    return;
  }

  const name = user.name || "there";

  await sendEmail(
    user.email,
    "Your AlphaBot Membership Has Expired",
    `
Hello ${name},

Your AlphaBot membership has now expired.

Your account has automatically been returned to the Normal tier, and your previous membership benefits are no longer active.

You are always welcome to upgrade again to Silver or Gold from your AlphaBot account.

Thank you for being part of AlphaBot.

The AlphaBot Team
`
  );
};


module.exports = {
  sendMembershipDemotionEmail,
  sendMembershipExpiryReminderEmail,
  sendMembershipExpiredEmail
};
